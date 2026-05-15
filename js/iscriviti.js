// iscriviti.js — Validazione form iscrizione + invio protetto via Cloud Function
import { app, db, COL } from "./firebase-config.js";
import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js";
import {
  collection,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const form = document.getElementById("form-iscrizione");
const successBox = document.getElementById("iscrizione-success");
const errorBox = document.getElementById("iscrizione-error");
const errorMsg = document.getElementById("iscrizione-error-msg");
const btnSubmit = document.getElementById("btn-submit");
const btnRetry = document.getElementById("btn-retry");
const formStatus = document.getElementById("form-status");
const categoryStatusGrid = document.getElementById("category-status-grid");
const categoryStatusUpdated = document.getElementById("category-status-updated");
const categoriaSelect = form.elements.categoriaId;
const functions = getFunctions(app, "europe-west1");
const submitTuskIscrizione = httpsCallable(functions, "submitTuskIscrizione");

const CATEGORIE = [
  ["ultimate", "Ultimate (M)"],
  ["advanced", "Advanced (M)"],
  ["challenge", "Challenge (M)"],
  ["essential", "Essential (M)"],
  ["performance", "Performance (F)"],
  ["intermediate", "Intermediate (F)"]
];
const VALID_CATEGORIE = new Set(CATEGORIE.map(([id]) => id));

const FIELD_NAMES = ["nome", "categoriaId", "box", "contatto", "note"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_RE = /^[+()\d\s.-]+$/;
const MIN_SUBMIT_MS = 3500;
const LOCAL_THROTTLE_MS = 45 * 1000;
const LAST_SUBMIT_KEY = "tuskLastIscrizioneSubmitAt";
let isSubmitting = false;
const formStartedAt = Date.now();
let publicStatus = null;
let fallbackStatus = null;
let fallbackCaps = {};
let fallbackAtleti = [];
let fallbackCapsLoaded = false;
let fallbackAtletiLoaded = false;

if (form.elements.formStartedAt) {
  form.elements.formStartedAt.value = String(formStartedAt);
}

// === Validazione ===
function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function timestampToMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return (ts.seconds * 1000) + Math.floor((ts.nanoseconds || 0) / 1000000);
  return 0;
}

function formatUpdatedAt(ts) {
  const millis = timestampToMillis(ts);
  if (!millis) return "Aggiornamento non disponibile";
  return `Aggiornato ${new Date(millis).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function getActiveStatus() {
  return publicStatus || fallbackStatus;
}

function isCategoryFull(categoriaId) {
  const s = getActiveStatus()?.categorie?.[categoriaId];
  return !!s && Number(s.cap || 0) > 0 && Number(s.disponibili || 0) <= 0;
}

function renderCategoryStatus() {
  if (!categoryStatusGrid) return;
  const activeStatus = getActiveStatus();
  const categorie = activeStatus?.categorie || {};
  const hasAnyCap = CATEGORIE.some(([id]) => Number(categorie[id]?.cap || 0) > 0);

  if (!activeStatus || !hasAnyCap) {
    categoryStatusGrid.innerHTML = `<p class="admin-empty">Capienze non ancora pubblicate. Seleziona la categoria: l'organizzazione confermera manualmente la richiesta.</p>`;
    if (categoryStatusUpdated) categoryStatusUpdated.textContent = "Stato in preparazione";
    syncCategoryOptions();
    return;
  }

  if (categoryStatusUpdated) {
    categoryStatusUpdated.textContent = activeStatus.isFallback
      ? "Stato indicativo: non include pending"
      : formatUpdatedAt(activeStatus.updatedAt);
  }
  categoryStatusGrid.innerHTML = CATEGORIE.map(([id, label]) => {
    const s = categorie[id] || {};
    const cap = Number(s.cap || 0);
    const disponibili = cap > 0 ? Math.max(Number(s.disponibili || 0), 0) : null;
    const quasiCompleta = cap > 0 && disponibili !== null && disponibili <= Math.max(1, Math.ceil(cap * 0.2));
    const stato = cap <= 0 ? "Da confermare" : disponibili === 0 ? "Completa" : quasiCompleta ? "Quasi completa" : (s.stato || "Aperta");
    const css = disponibili === 0 ? " is-full" : stato === "Quasi completa" ? " is-warning" : "";
    const detail = cap > 0
      ? `${disponibili} liberi su ${cap}`
      : "Capienza non impostata";
    return `
      <div class="category-status-card${css}">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(stato)}</span>
        <small>${escapeHtml(detail)}</small>
      </div>
    `;
  }).join("");
  syncCategoryOptions();
}

function syncCategoryOptions() {
  if (!categoriaSelect) return;
  Array.from(categoriaSelect.options).forEach((option) => {
    if (!option.value || !VALID_CATEGORIE.has(option.value)) return;
    if (!option.dataset.baseLabel) option.dataset.baseLabel = option.textContent;
    const full = isCategoryFull(option.value);
    option.disabled = full;
    option.textContent = full ? `${option.dataset.baseLabel} - COMPLETA` : option.dataset.baseLabel;
  });
  if (categoriaSelect.value && isCategoryFull(categoriaSelect.value)) {
    showError("categoriaId", "Categoria completa. Scegli una categoria con posti disponibili.");
    categoriaSelect.value = "";
  }
}

function updateFallbackStatus() {
  if (!fallbackCapsLoaded || !fallbackAtletiLoaded) return;
  const categorie = {};
  CATEGORIE.forEach(([id, label]) => {
    const cap = Number(fallbackCaps[id] || 0);
    const approvati = fallbackAtleti.filter((a) => a.categoriaId === id).length;
    const disponibili = cap > 0 ? Math.max(cap - approvati, 0) : null;
    const ratio = cap > 0 ? approvati / cap : 0;
    const stato = cap <= 0
      ? "Da confermare"
      : disponibili === 0
      ? "Completa"
      : ratio >= 0.8
      ? "Quasi completa"
      : "Aperta";
    categorie[id] = {
      nome: label,
      cap,
      approvati,
      pending: 0,
      occupati: approvati,
      disponibili,
      stato
    };
  });
  fallbackStatus = { isFallback: true, categorie };
  if (!publicStatus) renderCategoryStatus();
}

onSnapshot(
  doc(db, COL.eventi, "_config_iscrizioni"),
  (snap) => {
    fallbackCaps = snap.exists() ? (snap.data().caps || {}) : {};
    fallbackCapsLoaded = true;
    updateFallbackStatus();
  },
  (err) => console.warn("Capienze pubbliche non disponibili:", err.code || err.message)
);

onSnapshot(
  collection(db, COL.atletiPubblici),
  (snap) => {
    fallbackAtleti = snap.docs.map((d) => d.data());
    fallbackAtletiLoaded = true;
    updateFallbackStatus();
  },
  (err) => console.warn("Atleti pubblici non disponibili:", err.code || err.message)
);

onSnapshot(
  doc(db, COL.iscrizioniStatoPubblico, "_summary"),
  (snap) => {
    publicStatus = snap.exists() ? snap.data() : null;
    renderCategoryStatus();
  },
  (err) => {
    console.warn("Stato iscrizioni non disponibile:", err.code || err.message);
    if (fallbackStatus) {
      renderCategoryStatus();
    } else if (categoryStatusGrid) {
      categoryStatusGrid.innerHTML = `<p class="admin-empty">Stato categorie non disponibile. Puoi comunque inviare la richiesta: l'organizzazione confermera manualmente.</p>`;
    }
    if (categoryStatusUpdated && !fallbackStatus) categoryStatusUpdated.textContent = "Offline";
  }
);

function isValidContact(value) {
  if (EMAIL_RE.test(value)) return true;

  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && PHONE_RE.test(value);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateField(name, value) {
  const v = normalizeText(value);
  switch (name) {
    case "nome":
      if (v.length < 2) return "Inserisci nome e cognome";
      if (v.split(" ").filter(Boolean).length < 2) return "Inserisci sia nome sia cognome";
      if (v.length > 80) return "Massimo 80 caratteri";
      return null;
    case "categoriaId":
      if (!VALID_CATEGORIE.has(v)) return "Seleziona una categoria";
      if (isCategoryFull(v)) return "Categoria completa. Scegli una categoria con posti disponibili.";
      return null;
    case "box":
      if (v.length < 2) return "Inserisci il box di provenienza";
      if (v.length > 80) return "Massimo 80 caratteri";
      return null;
    case "contatto":
      if (v.length < 5) return "Inserisci telefono o email";
      if (v.length > 80) return "Massimo 80 caratteri";
      if (!isValidContact(v)) return "Inserisci un telefono o una email valida";
      return null;
    case "note":
      if (v.length > 300) return "Massimo 300 caratteri";
      return null;
    default:
      return null;
  }
}

function showError(name, message) {
  const input = form.elements[name];
  const errEl = form.querySelector(`[data-error-for="${name}"]`);
  if (input) {
    input.classList.toggle("is-invalid", !!message);
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }
  if (errEl) errEl.textContent = message || "";
}

function validateAll(formData) {
  let firstError = null;
  for (const name of FIELD_NAMES) {
    const err = validateField(name, formData.get(name));
    showError(name, err);
    if (err && !firstError) firstError = name;
  }
  return firstError;
}

function setStatus(message) {
  if (formStatus) formStatus.textContent = message || "";
}

function setSubmitting(submitting) {
  isSubmitting = submitting;
  btnSubmit.disabled = submitting;
  btnSubmit.classList.toggle("is-loading", submitting);
  btnSubmit.setAttribute("aria-busy", submitting ? "true" : "false");
  form.setAttribute("aria-busy", submitting ? "true" : "false");
  setStatus(submitting ? "Invio iscrizione in corso." : "");
}

function lastSubmitAt() {
  try { return Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0); } catch (e) { return 0; }
}

function setLastSubmitAt(value) {
  try { localStorage.setItem(LAST_SUBMIT_KEY, String(value)); } catch (e) {}
}

function throttleMessage() {
  const elapsed = Date.now() - lastSubmitAt();
  if (elapsed >= LOCAL_THROTTLE_MS) return "";
  const seconds = Math.ceil((LOCAL_THROTTLE_MS - elapsed) / 1000);
  return `Hai appena inviato una richiesta. Riprova tra ${seconds} secondi.`;
}

function showResult(panel) {
  form.hidden = true;
  panel.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  panel.focus({ preventScroll: true });
}

// Validazione live al blur dei campi
for (const name of FIELD_NAMES) {
  const input = form.elements[name];
  if (input) {
    input.addEventListener("blur", () => {
      const err = validateField(name, input.value);
      showError(name, err);
    });
    // Pulisce errore mentre digita di nuovo
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) {
        showError(name, null);
      }
    });
    input.addEventListener("change", () => {
      if (input.classList.contains("is-invalid")) {
        showError(name, validateField(name, input.value));
      }
    });
  }
}

// === Submit ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const formData = new FormData(form);
  if (normalizeText(formData.get("website"))) {
    showResult(successBox);
    return;
  }

  const startedAt = Number(formData.get("formStartedAt") || formStartedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_SUBMIT_MS) {
    setStatus("Attendi qualche secondo e ricontrolla i dati prima di inviare.");
    btnSubmit.disabled = true;
    setTimeout(() => {
      if (!isSubmitting) btnSubmit.disabled = false;
    }, Math.max(800, MIN_SUBMIT_MS - (Date.now() - formStartedAt)));
    return;
  }

  const throttle = throttleMessage();
  if (throttle) {
    setStatus(throttle);
    return;
  }

  const firstError = validateAll(formData);
  if (firstError) {
    setStatus("Controlla i campi evidenziati prima di inviare.");
    form.elements[firstError].focus();
    return;
  }

  setSubmitting(true);

  try {
    const data = {
      nome: normalizeText(formData.get("nome")),
      categoriaId: normalizeText(formData.get("categoriaId")),
      box: normalizeText(formData.get("box")),
      contatto: normalizeText(formData.get("contatto")),
      note: normalizeText(formData.get("note")).slice(0, 300)
    };

    await submitTuskIscrizione(data);
    setLastSubmitAt(Date.now());

    setStatus("Iscrizione ricevuta.");
    showResult(successBox);
  } catch (err) {
    console.error("Errore iscrizione:", err);
    const code = String(err.code || "");
    const userMsg =
      code.includes("resource-exhausted")
        ? "Hai gia' inviato una richiesta da poco. Riprova tra qualche minuto."
        : code.includes("invalid-argument") || code.includes("failed-precondition") || code.includes("permission-denied")
        ? "I dati non sono stati accettati dal server. Controlla i campi e riprova."
        : code.includes("unavailable")
        ? "Connessione assente. Verifica internet e riprova."
        : "Errore di rete. Riprova tra qualche secondo.";
    errorMsg.textContent = userMsg;
    showResult(errorBox);
  } finally {
    setSubmitting(false);
  }
});

// Bottone "Riprova" dopo errore: mostra di nuovo form
if (btnRetry) {
  btnRetry.addEventListener("click", () => {
    errorBox.hidden = true;
    form.hidden = false;
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    form.elements.nome.focus({ preventScroll: true });
  });
}
