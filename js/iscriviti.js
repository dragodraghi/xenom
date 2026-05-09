// iscriviti.js — Validazione form iscrizione + scrittura su tusk_iscrizioni_pending
import { db, COL } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const form = document.getElementById("form-iscrizione");
const successBox = document.getElementById("iscrizione-success");
const errorBox = document.getElementById("iscrizione-error");
const errorMsg = document.getElementById("iscrizione-error-msg");
const btnSubmit = document.getElementById("btn-submit");
const btnRetry = document.getElementById("btn-retry");
const formStatus = document.getElementById("form-status");

const VALID_CATEGORIE = new Set([
  "ultimate", "advanced", "challenge", "essential", "performance", "intermediate"
]);

const FIELD_NAMES = ["nome", "categoriaId", "box", "contatto", "note"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_RE = /^[+()\d\s.-]+$/;
let isSubmitting = false;

// === Validazione ===
function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isValidContact(value) {
  if (EMAIL_RE.test(value)) return true;

  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && PHONE_RE.test(value);
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
      note: normalizeText(formData.get("note")).slice(0, 300),
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, COL.iscrizioni), data);

    setStatus("Iscrizione ricevuta.");
    showResult(successBox);
  } catch (err) {
    console.error("Errore iscrizione:", err);
    const userMsg =
      err.code === "permission-denied"
        ? "I dati non sono stati accettati dal server. Controlla i campi e riprova."
        : err.code === "unavailable"
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
