// admin.js — App admin TUSK Protocol
// Versione M6: login, tab nav, Iscrizioni, Atleti CRUD, Inserimento risultati con anteprima EPI.

import {
  db,
  loginAdmin,
  logoutAdmin,
  onAdminAuthChange,
  isAdminLoggedIn,
  COL
} from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  runTransaction,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  calcolaEpi,
  calcolaEpiDnf,
  tempoASecondi,
  secondiATempo,
  roundsRepsAReps
} from "./epi-formulas.js";

// === DOM Login ===
const screenLogin = document.getElementById("screen-login");
const screenAdmin = document.getElementById("screen-admin");
const formLogin = document.getElementById("form-login");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const errorPassword = formLogin.querySelector('[data-error-for="password"]');

// === Costanti ===
const NOMI_CATEGORIE = {
  ultimate: "Ultimate (M)",
  advanced: "Advanced (M)",
  challenge: "Challenge (M)",
  essential: "Essential (M)",
  performance: "Performance (F)",
  intermediate: "Intermediate (F)"
};
const CATEGORIE_ORDINATE = Object.keys(NOMI_CATEGORIE);
const CONFIG_ISCRIZIONI_ID = "_config_iscrizioni";
const STATO_ISCRIZIONI_ID = "_summary";

// === Cache condivise tra tab ===
let unsubscribers = [];
let atletiCache = [];   // [{id, nome, categoriaId, box, contatto?}] - collezione admin privata
let eventiCache = [];   // [{id, numero, nome, scoringType, scoringDirection, repsPerRound, benchmarks}]
let iscrizioniCache = []; // [{id, nome, categoriaId, box, contatto?, note?}]
let slotConfig = { caps: {} };
let syncPubbliciTimer = null;
let syncIscrizioniStatoTimer = null;
let shareControlsInitialized = false;
let slotConfigLoaded = false;
let atletiLoaded = false;
let iscrizioniLoaded = false;
let iscrizioniPrevCount = -1; // -1 = primo render, niente beep
const NOTIFY_AUDIO_KEY = "tuskNotifyAudio";
let audioCtx = null;

function isNotifyAudioOn() {
  try { return localStorage.getItem(NOTIFY_AUDIO_KEY) !== "off"; } catch (e) { return true; }
}

function setNotifyAudio(on) {
  try { localStorage.setItem(NOTIFY_AUDIO_KEY, on ? "on" : "off"); } catch (e) {}
}

function beepNuovaIscrizione() {
  if (!isNotifyAudioOn()) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    // Doppio bip 880Hz + 1320Hz (perfetta quinta) — chiaro ma non aggressivo
    const t0 = audioCtx.currentTime;
    [
      { freq: 880,  start: t0,        dur: 0.12 },
      { freq: 1320, start: t0 + 0.16, dur: 0.18 }
    ].forEach(({ freq, start, dur }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
  } catch (e) { /* audio non disponibile */ }
}

// === Auth ===
onAdminAuthChange((user) => {
  if (user && isAdminLoggedIn()) {
    screenLogin.hidden = true;
    screenAdmin.hidden = false;
    initAdminApp();
  } else {
    screenLogin.hidden = false;
    screenAdmin.hidden = true;
    cleanupListeners();
  }
});

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = formLogin.elements.password.value;
  errorPassword.textContent = "";
  if (!password) {
    errorPassword.textContent = "Inserisci la password.";
    return;
  }
  btnLogin.disabled = true;
  btnLogin.classList.add("is-loading");
  try {
    await loginAdmin(password);
    formLogin.elements.password.value = "";
  } catch (err) {
    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
      errorPassword.textContent = "Password non valida.";
    } else if (err.code === "auth/too-many-requests") {
      errorPassword.textContent = "Troppi tentativi. Riprova tra qualche minuto.";
    } else if (err.code === "auth/network-request-failed") {
      errorPassword.textContent = "Errore di rete. Verifica la connessione.";
    } else {
      errorPassword.textContent = "Errore: " + (err.code || "sconosciuto");
    }
  } finally {
    btnLogin.disabled = false;
    btnLogin.classList.remove("is-loading");
  }
});

btnLogout.addEventListener("click", () => logoutAdmin());

// === Tab nav ===
const tabs = document.querySelectorAll(".admin-tab");
const panels = document.querySelectorAll(".admin-panel");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === target));
  });
});

// === Init/cleanup ===
function initAdminApp() {
  cleanupListeners();
  initSlotConfig();
  initShareControls();
  initTabIscrizioni();
  initTabAtleti();
  initTabRisultati();
  initTabEventi();
  initTabStrumenti();
  syncRisultatiPubblici({ silent: true }).catch((err) => {
    console.warn("Sync risultati pubblici:", err.code || err.message);
  });
}
function cleanupListeners() {
  unsubscribers.forEach((u) => { try { u(); } catch (e) {} });
  unsubscribers = [];
  clearTimeout(syncPubbliciTimer);
  clearTimeout(syncIscrizioniStatoTimer);
}

// =====================================================
// TAB ISCRIZIONI
// =====================================================
const listaIscrizioni = document.getElementById("lista-iscrizioni");
const badgeIscrizioni = document.getElementById("badge-iscrizioni");
const slotGrid = document.getElementById("slot-grid");
const linkAtleti = document.getElementById("link-atleti");
const linkGiudici = document.getElementById("link-giudici");
const whatsappMessage = document.getElementById("whatsapp-message");
const btnCopyWhatsapp = document.getElementById("btn-copy-whatsapp");
const btnCopyLinkAtleti = document.getElementById("btn-copy-link-atleti");
const btnCopyLinkGiudici = document.getElementById("btn-copy-link-giudici");
const btnOpenWhatsapp = document.getElementById("btn-open-whatsapp");

function initSlotConfig() {
  const unsub = onSnapshot(
    doc(db, COL.eventi, CONFIG_ISCRIZIONI_ID),
    (snap) => {
      slotConfig = snap.exists() ? { caps: snap.data().caps || {} } : { caps: {} };
      slotConfigLoaded = true;
      renderSlotDashboard();
    },
    (err) => console.error("Errore config slot:", err)
  );
  unsubscribers.push(unsub);
}

function initShareControls() {
  if (shareControlsInitialized) return;
  shareControlsInitialized = true;
  btnCopyWhatsapp?.addEventListener("click", () => copyText(whatsappMessage?.value || "", "Messaggio WhatsApp copiato"));
  btnCopyLinkAtleti?.addEventListener("click", () => copyText(linkAtleti?.value || "", "Link atleti copiato"));
  btnCopyLinkGiudici?.addEventListener("click", () => copyText(linkGiudici?.value || "", "Link giudici copiato"));
  btnOpenWhatsapp?.addEventListener("click", () => {
    const msg = whatsappMessage?.value || "";
    if (!msg) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  });
  initAudioToggle();
  updateShareText();
}

function initAudioToggle() {
  const target = document.querySelector(".slot-dashboard__header");
  if (!target || target.querySelector("[data-audio-toggle]")) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.audioToggle = "1";
  btn.className = "btn btn--ghost btn--small";
  btn.style.marginLeft = "0.4rem";
  const sync = () => {
    const on = isNotifyAudioOn();
    btn.textContent = on ? "🔔 Audio ON" : "🔕 Audio OFF";
    btn.title = on
      ? "Beep alla nuova iscrizione attivo. Click per silenziare."
      : "Beep silenziato. Click per riattivare.";
  };
  btn.addEventListener("click", () => {
    const next = !isNotifyAudioOn();
    setNotifyAudio(next);
    sync();
    if (next) beepNuovaIscrizione(); // beep di test quando si riattiva
  });
  sync();
  target.appendChild(btn);
}

function slotStatsCategoria(categoriaId) {
  const cap = Number(slotConfig.caps?.[categoriaId] || 0);
  const pending = iscrizioniCache.filter((i) => i.categoriaId === categoriaId).length;
  const approvati = atletiCache.filter((a) => a.categoriaId === categoriaId).length;
  const occupati = pending + approvati;
  const disponibili = cap > 0 ? Math.max(cap - occupati, 0) : null;
  const ratio = cap > 0 ? occupati / cap : 0;
  const stato = cap <= 0
    ? "Slot da impostare"
    : disponibili === 0
    ? "Completa"
    : ratio >= 0.8
    ? "Quasi completa"
    : "Aperta";
  return { categoriaId, cap, pending, approvati, occupati, disponibili, ratio, stato };
}

function datiStatoIscrizioniPubblico(stats) {
  const categorie = {};
  stats.forEach((s) => {
    categorie[s.categoriaId] = {
      nome: NOMI_CATEGORIE[s.categoriaId] || s.categoriaId,
      cap: s.cap,
      approvati: s.approvati,
      pending: s.pending,
      occupati: s.occupati,
      disponibili: s.disponibili,
      stato: s.stato
    };
  });
  return {
    updatedAt: serverTimestamp(),
    categorie,
    links: {
      atleti: `${window.location.origin}/iscriviti.html`,
      live: `${window.location.origin}/live.html`,
      podio: `${window.location.origin}/podio.html`
    }
  };
}

function programmaSyncStatoIscrizioniPubblico(stats) {
  if (!slotConfigLoaded || !atletiLoaded || !iscrizioniLoaded) return;
  clearTimeout(syncIscrizioniStatoTimer);
  const payload = datiStatoIscrizioniPubblico(stats);
  syncIscrizioniStatoTimer = setTimeout(() => {
    setDoc(doc(db, COL.iscrizioniStatoPubblico, STATO_ISCRIZIONI_ID), payload, { merge: true })
      .catch((err) => console.warn("Sync stato iscrizioni pubblico:", err.code || err.message));
  }, 800);
}

function renderSlotDashboard() {
  if (!slotGrid) return;
  const stats = CATEGORIE_ORDINATE.map(slotStatsCategoria);
  slotGrid.innerHTML = "";

  stats.forEach((s) => {
    const card = document.createElement("div");
    card.className = "slot-card";
    if (s.cap <= 0) card.classList.add("needs-cap");
    if (s.disponibili === 0) card.classList.add("is-full");
    else if (s.ratio >= 0.8 && s.cap > 0) card.classList.add("is-warning");
    const progress = s.cap > 0 ? Math.min(100, Math.round(s.ratio * 100)) : 0;
    const disponibiliText = s.disponibili === null ? "-" : String(s.disponibili);
    const capText = s.cap > 0 ? `${s.occupati}/${s.cap} occupati` : "Inserisci gli slot totali per attivare il conteggio liberi";
    card.innerHTML = `
      <div class="slot-card__top">
        <strong>${escapeHtml(NOMI_CATEGORIE[s.categoriaId])}</strong>
        <span>${escapeHtml(s.stato)}</span>
      </div>
      <div class="slot-card__numbers">
        <div><b>${s.approvati}</b><small>Approvati</small></div>
        <div><b>${s.pending}</b><small>Pending</small></div>
        <div><b>${escapeHtml(disponibiliText)}</b><small>Liberi</small></div>
      </div>
      <div class="slot-card__progress"><span style="width:${progress}%"></span></div>
      <div class="slot-card__summary">${escapeHtml(capText)}</div>
      <label class="slot-card__cap">
        Slot totali
        <input type="number" min="0" step="1" inputmode="numeric" value="${s.cap > 0 ? s.cap : ""}" data-slot-cap="${escapeAttr(s.categoriaId)}" placeholder="es. 20">
      </label>
    `;
    slotGrid.appendChild(card);
  });

  slotGrid.querySelectorAll("[data-slot-cap]").forEach((input) => {
    input.addEventListener("change", () => salvaCapCategoria(input.dataset.slotCap, input.value));
  });
  updateShareText(stats);
  programmaSyncStatoIscrizioniPubblico(stats);
}

async function salvaCapCategoria(categoriaId, value) {
  const parsed = parseInt(value, 10);
  const caps = { ...(slotConfig.caps || {}) };
  if (Number.isFinite(parsed) && parsed > 0) caps[categoriaId] = parsed;
  else delete caps[categoriaId];

  try {
    await setDoc(doc(db, COL.eventi, CONFIG_ISCRIZIONI_ID), {
      caps,
      updatedAt: serverTimestamp()
    }, { merge: true });
    showToast("Slot aggiornati");
  } catch (err) {
    console.error("Errore salvataggio slot:", err);
    alert(`Errore salvataggio slot: ${err.code || err.message}`);
  }
}

function updateShareText(stats = CATEGORIE_ORDINATE.map(slotStatsCategoria)) {
  const athleteUrl = `${window.location.origin}/iscriviti.html`;
  const judgesUrl = `${window.location.origin}/giudici.html`;
  const liveUrl = `${window.location.origin}/live.html`;
  const podioUrl = `${window.location.origin}/podio.html`;
  if (linkAtleti) linkAtleti.value = athleteUrl;
  if (linkGiudici) linkGiudici.value = judgesUrl;

  const righePosti = stats
    .filter((s) => s.cap > 0)
    .map((s) => `${NOMI_CATEGORIE[s.categoriaId]}: ${s.disponibili} posti liberi`);
  const riepilogo = righePosti.length
    ? `\n\nPosti disponibili ora:\n${righePosti.join("\n")}`
    : "";

  if (whatsappMessage) {
    whatsappMessage.value =
`TUSK Protocol Bad Boars - iscrizioni aperte.

Compila il form qui:
${athleteUrl}${riepilogo}

Classifica live:
${liveUrl}

Podio:
${podioUrl}

Salvalo come app sul telefono, cosi lo ritrovi subito:

IPHONE
1. Apri il link con Safari.
2. Tocca il pulsante Condividi (quadrato con freccia).
3. Scorri e scegli "Aggiungi a schermata Home".
4. Tocca "Aggiungi".

ANDROID
1. Apri il link con Chrome.
2. Tocca i tre puntini in alto a destra.
3. Tocca "Installa app" oppure "Aggiungi a schermata Home".
4. Conferma con "Installa" o "Aggiungi".

Se il link si apre dentro WhatsApp/Instagram: apri il menu e scegli "Apri nel browser" prima di salvarlo.

Riferimenti Bad Boars:
Instagram: https://www.instagram.com/bad_boars_crossfit/
Facebook: https://www.facebook.com/pages/Bad-Boars-CrossFit/480247628798596

Dopo l'invio l'organizzazione approva manualmente la richiesta e ti contatta per conferma.`;
  }
}

function initTabIscrizioni() {
  const q = query(collection(db, COL.iscrizioni), orderBy("createdAt", "asc"));
  const unsub = onSnapshot(
    q,
    (snap) => renderIscrizioni(snap),
    (err) => {
      console.error("Errore listener iscrizioni:", err);
      listaIscrizioni.innerHTML = `<p class="admin-empty">Errore: ${escapeHtml(err.code || err.message)}</p>`;
    }
  );
  unsubscribers.push(unsub);
}

function renderIscrizioni(snap) {
  const docs = snap.docs;
  iscrizioniCache = docs.map((d) => ({ id: d.id, ...d.data() }));
  iscrizioniLoaded = true;
  renderSlotDashboard();
  // Beep se sono arrivate nuove iscrizioni (skip primo render)
  if (iscrizioniPrevCount >= 0 && docs.length > iscrizioniPrevCount) {
    beepNuovaIscrizione();
  }
  iscrizioniPrevCount = docs.length;
  if (docs.length === 0) {
    listaIscrizioni.innerHTML = `<p class="admin-empty">Nessuna iscrizione in attesa.</p>`;
    badgeIscrizioni.hidden = true;
    return;
  }
  badgeIscrizioni.hidden = false;
  badgeIscrizioni.textContent = docs.length;
  listaIscrizioni.innerHTML = "";
  docs.forEach((d) => {
    const data = d.data();
    const card = document.createElement("div");
    card.className = "admin-card";
    const noteHtml = data.note ? `<br><em style="color: var(--text-muted);">${escapeHtml(data.note)}</em>` : "";
    const duplicati = trovaDuplicatiAtleta(data);
    const duplicatiHtml = duplicati.length
      ? `<br><strong style="color: var(--danger);">Possibile duplicato:</strong> ${escapeHtml(duplicati.slice(0, 2).map((dup) => dup.atleta.nome).join(", "))}`
      : "";
    card.innerHTML = `
      <div class="admin-card__info">
        <div class="admin-card__title">${escapeHtml(data.nome)}</div>
        <div class="admin-card__meta">
          ${escapeHtml(NOMI_CATEGORIE[data.categoriaId] || data.categoriaId)} ·
          ${escapeHtml(data.box)} ·
          <span style="opacity: 0.85;">${escapeHtml(data.contatto)}</span>
          ${noteHtml}
          ${duplicatiHtml}
        </div>
      </div>
      <div class="admin-card__actions">
        <button class="btn btn--success btn--small" data-action="approva">✅ Approva</button>
        <button class="btn btn--danger btn--small" data-action="rifiuta">✕ Rifiuta</button>
      </div>
    `;
    card.querySelector('[data-action="approva"]').addEventListener("click", () => approvaIscrizione(d.id, data));
    card.querySelector('[data-action="rifiuta"]').addEventListener("click", () => rifiutaIscrizione(d.id, data.nome));
    listaIscrizioni.appendChild(card);
  });
}

async function approvaIscrizione(idPending, dati) {
  // Slot cap hard-stop: warn esplicito se approvare sfora il cap della categoria
  const cap = Number(slotConfig.caps?.[dati.categoriaId] || 0);
  const approvati = atletiCache.filter((a) => a.categoriaId === dati.categoriaId).length;
  const catLabel = NOMI_CATEGORIE[dati.categoriaId] || dati.categoriaId;
  let confirmMsg;
  if (cap > 0 && approvati >= cap) {
    confirmMsg = `⚠️ CATEGORIA AL CAP\n\nCategoria ${catLabel} è già al cap (${approvati}/${cap} approvati). Approvare ${dati.nome} sforerà il limite impostato.\n\nBox: ${dati.box}\n\nForzare approvazione comunque?`;
  } else {
    const ricap = cap > 0 ? ` (${approvati + 1}/${cap} dopo l'approvazione)` : "";
    confirmMsg = `Approvare l'iscrizione di ${dati.nome}?\n\nCategoria: ${catLabel}${ricap}\nBox: ${dati.box}`;
  }
  const duplicati = trovaDuplicatiAtleta(dati);
  if (duplicati.length) {
    confirmMsg += `\n\nPossibile duplicato nella stessa categoria:\n${descriviDuplicati(duplicati)}`;
  }
  if (!confirm(confirmMsg)) return;
  try {
    const atletaId = crypto.randomUUID();
    const pendingRef = doc(db, COL.iscrizioni, idPending);
    let atletaNome = dati.nome;

    await runTransaction(db, async (transaction) => {
      const pendingSnap = await transaction.get(pendingRef);
      if (!pendingSnap.exists()) {
        const err = new Error("Iscrizione gia gestita da un altro admin.");
        err.code = "tusk/pending-already-handled";
        throw err;
      }

      const pending = pendingSnap.data();
      const atleta = {
        nome: pending.nome,
        categoriaId: pending.categoriaId,
        box: pending.box,
        contatto: pending.contatto || "",
        presente: true,
        createdAt: serverTimestamp()
      };
      atletaNome = atleta.nome;

      transaction.set(doc(db, COL.atleti, atletaId), atleta);
      transaction.set(doc(db, COL.atletiPubblici, atletaId), datiAtletaPubblici(atleta));
      transaction.delete(pendingRef);
    });
    showToast(`✅ ${atletaNome} approvato`);
  } catch (err) {
    console.error(err);
    if (err.code === "tusk/pending-already-handled") {
      showToast("Iscrizione gia gestita da un altro admin", "err");
    } else {
      alert(`Errore approvazione: ${err.code || err.message}`);
    }
  }
}

async function rifiutaIscrizione(idPending, nome) {
  if (!confirm(`Rifiutare l'iscrizione di ${nome}? Operazione irreversibile.`)) return;
  try {
    await deleteDoc(doc(db, COL.iscrizioni, idPending));
    showToast(`✕ ${nome} rifiutato`, "err");
  } catch (err) {
    console.error(err);
    alert(`Errore: ${err.code || err.message}`);
  }
}

function datiAtletaPubblici(atleta) {
  return {
    nome: String(atleta.nome || "").trim(),
    categoriaId: atleta.categoriaId,
    box: String(atleta.box || "").trim()
  };
}

function datiRisultatoPubblico(r) {
  return {
    atletaId: String(r.atletaId || "").trim(),
    eventoId: String(r.eventoId || "").trim(),
    categoriaId: String(r.categoriaId || "").trim(),
    puntiEpi: Number(r.puntiEpi || 0),
    tieBreak: typeof r.tieBreak === "number" ? r.tieBreak : null
  };
}

function tieBreakSecondi(r) {
  return typeof r?.tieBreak === "number" && r.tieBreak > 0 ? r.tieBreak : null;
}

function formatTieBreak(r) {
  const tb = tieBreakSecondi(r);
  return tb === null ? "" : `T.B. ${secondiATempo(tb)}`;
}

function normalizzaChiaveDuplicati(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenNome(value) {
  return normalizzaChiaveDuplicati(value)
    .split(" ")
    .filter((x) => x.length > 1);
}

function stessoNomeProbabile(a, b) {
  const na = tokenNome(a);
  const nb = tokenNome(b);
  if (na.length === 0 || nb.length === 0) return false;
  const sa = [...na].sort().join(" ");
  const sb = [...nb].sort().join(" ");
  if (sa === sb) return true;
  const setB = new Set(nb);
  const comuni = na.filter((x) => setB.has(x)).length;
  return Math.min(na.length, nb.length) >= 2 && comuni >= 2;
}

function trovaDuplicatiAtleta(atleta, ignoreId = "") {
  const contatto = normalizzaChiaveDuplicati(atleta.contatto || "");
  return atletiCache
    .filter((a) => a.id !== ignoreId && a.categoriaId === atleta.categoriaId)
    .map((a) => {
      const stessoNome = stessoNomeProbabile(a.nome, atleta.nome);
      const stessoContatto = contatto && contatto === normalizzaChiaveDuplicati(a.contatto || "");
      if (!stessoNome && !stessoContatto) return null;
      return {
        atleta: a,
        motivo: stessoNome && stessoContatto ? "nome e contatto simili" : stessoNome ? "nome simile" : "stesso contatto"
      };
    })
    .filter(Boolean);
}

function descriviDuplicati(duplicati) {
  return duplicati
    .slice(0, 5)
    .map((d) => `- ${d.atleta.nome} (${NOMI_CATEGORIE[d.atleta.categoriaId] || d.atleta.categoriaId}, ${d.atleta.box || "box n.d."}) - ${d.motivo}`)
    .join("\n");
}

function confermaDuplicatiAtleta(atleta, ignoreId = "") {
  const duplicati = trovaDuplicatiAtleta(atleta, ignoreId);
  if (duplicati.length === 0) return true;
  return confirm(`Possibile atleta duplicato nella stessa categoria:\n\n${descriviDuplicati(duplicati)}\n\nVuoi continuare comunque?`);
}

function atletaPubblicoUguale(esistente, prossimo) {
  const chiaviConsentite = new Set(["nome", "categoriaId", "box"]);
  return esistente
    && Object.keys(esistente).every((k) => chiaviConsentite.has(k))
    && esistente.nome === prossimo.nome
    && esistente.categoriaId === prossimo.categoriaId
    && esistente.box === prossimo.box;
}

function risultatoPubblicoUguale(esistente, prossimo) {
  const chiaviConsentite = new Set(["atletaId", "eventoId", "categoriaId", "puntiEpi", "tieBreak"]);
  return esistente
    && Object.keys(esistente).every((k) => chiaviConsentite.has(k))
    && esistente.atletaId === prossimo.atletaId
    && esistente.eventoId === prossimo.eventoId
    && esistente.categoriaId === prossimo.categoriaId
    && Number(esistente.puntiEpi || 0) === Number(prossimo.puntiEpi || 0)
    && tieBreakSecondi(esistente) === tieBreakSecondi(prossimo);
}

function programmaSyncAtletiPubblici() {
  clearTimeout(syncPubbliciTimer);
  syncPubbliciTimer = setTimeout(() => {
    syncAtletiPubblici({ silent: true }).catch((err) => {
      console.warn("Sync atleti pubblici:", err.code || err.message);
    });
  }, 700);
}

async function syncAtletiPubblici({ silent = false, outputEl = null } = {}) {
  if (!atletiCache.length) {
    const snapPrivati = await getDocs(collection(db, COL.atleti));
    atletiCache = snapPrivati.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const snapPubblici = await getDocs(collection(db, COL.atletiPubblici));
  const pubblici = new Map(snapPubblici.docs.map((d) => [d.id, d.data()]));
  let batch = writeBatch(db);
  let operazioniBatch = 0;
  let aggiornati = 0;
  let rimossi = 0;

  async function commitSePieno(force = false) {
    if (operazioniBatch === 0) return;
    if (!force && operazioniBatch < 400) return;
    await batch.commit();
    batch = writeBatch(db);
    operazioniBatch = 0;
  }

  for (const atleta of atletiCache) {
    const esistente = pubblici.get(atleta.id);
    if (atleta.presente === false) {
      if (esistente) {
        batch.delete(doc(db, COL.atletiPubblici, atleta.id));
        operazioniBatch++;
        rimossi++;
        await commitSePieno();
      }
      pubblici.delete(atleta.id);
      continue;
    }

    const pubblico = datiAtletaPubblici(atleta);
    if (!atletaPubblicoUguale(esistente, pubblico)) {
      batch.set(doc(db, COL.atletiPubblici, atleta.id), pubblico);
      operazioniBatch++;
      aggiornati++;
      await commitSePieno();
    }
    pubblici.delete(atleta.id);
  }

  for (const id of pubblici.keys()) {
    batch.delete(doc(db, COL.atletiPubblici, id));
    operazioniBatch++;
    rimossi++;
    await commitSePieno();
  }

  await commitSePieno(true);

  const msg = `Copia pubblica aggiornata: ${aggiornati} scritti, ${rimossi} rimossi, ${atletiCache.length} atleti privati.`;
  if (!silent) showToast(msg);
  if (outputEl) {
    outputEl.classList.add("is-visible");
    outputEl.textContent = msg;
  }
  return { aggiornati, rimossi, totale: atletiCache.length };
}

async function syncRisultatiPubblici({ silent = false, outputEl = null } = {}) {
  const [snapPrivati, snapPubblici] = await Promise.all([
    getDocs(collection(db, COL.risultati)),
    getDocs(collection(db, COL.risultatiPubblici))
  ]);

  const pubblici = new Map(snapPubblici.docs.map((d) => [d.id, d.data()]));
  let batch = writeBatch(db);
  let operazioniBatch = 0;
  let aggiornati = 0;
  let rimossi = 0;

  async function commitSePieno(force = false) {
    if (operazioniBatch === 0) return;
    if (!force && operazioniBatch < 400) return;
    await batch.commit();
    batch = writeBatch(db);
    operazioniBatch = 0;
  }

  for (const d of snapPrivati.docs) {
    const pubblico = datiRisultatoPubblico(d.data());
    const esistente = pubblici.get(d.id);
    if (!risultatoPubblicoUguale(esistente, pubblico)) {
      batch.set(doc(db, COL.risultatiPubblici, d.id), pubblico);
      operazioniBatch++;
      aggiornati++;
      await commitSePieno();
    }
    pubblici.delete(d.id);
  }

  for (const id of pubblici.keys()) {
    batch.delete(doc(db, COL.risultatiPubblici, id));
    operazioniBatch++;
    rimossi++;
    await commitSePieno();
  }

  await commitSePieno(true);

  const msg = `Risultati pubblici aggiornati: ${aggiornati} scritti, ${rimossi} rimossi, ${snapPrivati.size} risultati privati.`;
  if (!silent) showToast(msg);
  if (outputEl) {
    outputEl.classList.add("is-visible");
    outputEl.textContent = msg;
  }
  return { aggiornati, rimossi, totale: snapPrivati.size };
}

// =====================================================
// TAB ATLETI
// =====================================================
const countAtleti = document.getElementById("count-atleti");
const searchAtleti = document.getElementById("search-atleti");
const listaAtleti = document.getElementById("lista-atleti");
const btnAggiungiAtleta = document.getElementById("btn-aggiungi-atleta");
const modalAtleta = document.getElementById("modal-atleta");
const formAtleta = document.getElementById("form-atleta");
const modalAtletaTitle = document.getElementById("modal-atleta-title");

function initTabAtleti() {
  const q = query(collection(db, COL.atleti), orderBy("nome", "asc"));
  const unsub = onSnapshot(
    q,
    (snap) => {
      atletiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      atletiLoaded = true;
      renderAtleti();
      renderSlotDashboard();
      programmaSyncAtletiPubblici();
    },
    (err) => {
      console.error("Errore atleti:", err);
      listaAtleti.innerHTML = `<p class="admin-empty">Errore: ${escapeHtml(err.code || err.message)}</p>`;
    }
  );
  unsubscribers.push(unsub);
}

function renderAtleti() {
  const filtro = (searchAtleti.value || "").trim().toLowerCase();
  const filtrati = filtro
    ? atletiCache.filter((a) =>
        a.nome.toLowerCase().includes(filtro) ||
        (a.box || "").toLowerCase().includes(filtro))
    : atletiCache;

  const presentiTot = atletiCache.filter((a) => a.presente !== false).length;
  const assentiTot = atletiCache.length - presentiTot;
  const counterBase = atletiCache.length === filtrati.length
    ? `${atletiCache.length}`
    : `${filtrati.length}/${atletiCache.length}`;
  countAtleti.textContent = `(${counterBase} · ${presentiTot} pres / ${assentiTot} ass)`;

  if (filtrati.length === 0) {
    listaAtleti.innerHTML = `<p class="admin-empty">${filtro ? "Nessun atleta trovato." : "Nessun atleta registrato. Aggiungi il primo dal bottone qui sopra o approva un'iscrizione pending."}</p>`;
    return;
  }

  listaAtleti.innerHTML = "";
  filtrati.forEach((a) => {
    const isPresente = a.presente !== false;
    const card = document.createElement("div");
    card.className = "admin-card" + (isPresente ? "" : " is-absent");
    const badge = isPresente
      ? ""
      : ` <span class="atleta-badge atleta-badge--absent">Assente</span>`;
    const toggleLabel = isPresente ? "Marca assente" : "Marca presente";
    const toggleClass = isPresente ? "btn btn--ghost btn--small" : "btn btn--success btn--small";
    card.innerHTML = `
      <div class="admin-card__info">
        <div class="admin-card__title">${escapeHtml(a.nome)}${badge}</div>
        <div class="admin-card__meta">
          ${escapeHtml(NOMI_CATEGORIE[a.categoriaId] || a.categoriaId)} · ${escapeHtml(a.box || "—")}
          ${a.contatto ? `<br><span style="opacity:0.7; font-size:0.85em;">${escapeHtml(a.contatto)}</span>` : ""}
        </div>
      </div>
      <div class="admin-card__actions">
        <button class="${toggleClass}" data-action="presenza">${toggleLabel}</button>
        <button class="btn btn--ghost btn--small" data-action="edit">Modifica</button>
        <button class="btn btn--danger btn--small" data-action="delete">Elimina</button>
      </div>
    `;
    card.querySelector('[data-action="presenza"]').addEventListener("click", () => togglePresenza(a));
    card.querySelector('[data-action="edit"]').addEventListener("click", () => apriModalEditAtleta(a));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => eliminaAtleta(a));
    listaAtleti.appendChild(card);
  });
}

async function togglePresenza(a) {
  const wasPresente = a.presente !== false;
  const nextPresente = !wasPresente;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, COL.atleti, a.id), { presente: nextPresente }, { merge: true });
    if (nextPresente) {
      batch.set(doc(db, COL.atletiPubblici, a.id), datiAtletaPubblici(a));
    } else {
      batch.delete(doc(db, COL.atletiPubblici, a.id));
    }
    await batch.commit();
    showToast(`${a.nome} marcato ${nextPresente ? "presente ✅" : "assente ⚠️"}`, nextPresente ? "ok" : "err");
  } catch (err) {
    console.error(err);
    alert(`Errore aggiornamento presenza: ${err.code || err.message}`);
  }
}

searchAtleti.addEventListener("input", renderAtleti);

function apriModalNuovoAtleta() {
  modalAtletaTitle.textContent = "Aggiungi atleta";
  formAtleta.reset();
  document.getElementById("atleta-id").value = "";
  modalAtleta.hidden = false;
}

function apriModalEditAtleta(a) {
  modalAtletaTitle.textContent = "Modifica atleta";
  document.getElementById("atleta-id").value = a.id;
  document.getElementById("atleta-nome").value = a.nome;
  document.getElementById("atleta-categoria").value = a.categoriaId;
  document.getElementById("atleta-box").value = a.box || "";
  document.getElementById("atleta-contatto").value = a.contatto || "";
  modalAtleta.hidden = false;
}

btnAggiungiAtleta.addEventListener("click", apriModalNuovoAtleta);

document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener("click", () => {
    const target = document.getElementById(el.dataset.close);
    if (target) target.hidden = true;
  });
});

formAtleta.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("atleta-id").value;
  const nome = document.getElementById("atleta-nome").value.trim();
  const categoriaId = document.getElementById("atleta-categoria").value;
  const box = document.getElementById("atleta-box").value.trim();
  const contatto = document.getElementById("atleta-contatto").value.trim();

  if (nome.length < 2 || !categoriaId || box.length < 2) {
    alert("Compila correttamente nome, categoria e box.");
    return;
  }

  try {
    const atleta = { nome, categoriaId, box, contatto };
    if (!confermaDuplicatiAtleta(atleta, id)) return;
    const batch = writeBatch(db);
    if (id) {
      const atletaEsistente = atletiCache.find((a) => a.id === id);
      const isPresente = atletaEsistente?.presente !== false;
      batch.set(doc(db, COL.atleti, id), atleta, { merge: true });
      if (isPresente) {
        batch.set(doc(db, COL.atletiPubblici, id), datiAtletaPubblici(atleta));
      } else {
        batch.delete(doc(db, COL.atletiPubblici, id));
      }
      await batch.commit();
      showToast(`✅ ${nome} aggiornato`);
    } else {
      const newId = crypto.randomUUID();
      const nuovoAtleta = { ...atleta, presente: true, createdAt: serverTimestamp() };
      batch.set(doc(db, COL.atleti, newId), nuovoAtleta);
      batch.set(doc(db, COL.atletiPubblici, newId), datiAtletaPubblici(nuovoAtleta));
      await batch.commit();
      showToast(`✅ ${nome} aggiunto`);
    }
    modalAtleta.hidden = true;
  } catch (err) {
    console.error(err);
    alert(`Errore: ${err.code || err.message}`);
  }
});

async function eliminaAtleta(a) {
  if (!confirm(`Eliminare ${a.nome}?\n\nLo slot della categoria torna subito disponibile. Nota: eventuali risultati registrati per questo atleta resteranno orfani in tusk_risultati ma non appariranno in classifica.`)) return;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, COL.atleti, a.id));
    batch.delete(doc(db, COL.atletiPubblici, a.id));
    await batch.commit();
    showToast(`✕ ${a.nome} eliminato`, "err");
  } catch (err) {
    console.error(err);
    alert(`Errore: ${err.code || err.message}`);
  }
}

// =====================================================
// TAB RISULTATI
// =====================================================
const risSearchAtleta = document.getElementById("ris-search-atleta");
const risSuggerimenti = document.getElementById("ris-suggerimenti");
const risAtletaSelezionato = document.getElementById("ris-atleta-selezionato");
const risAtletaNome = document.getElementById("ris-atleta-nome");
const risDeseleziona = document.getElementById("ris-deseleziona");
const risGiudice = document.getElementById("ris-giudice");
const risEvento = document.getElementById("ris-evento");
const risFormDinamico = document.getElementById("ris-form-dinamico");
const risAnteprima = document.getElementById("ris-anteprima");
const risAnteprimaValore = document.getElementById("ris-anteprima-valore");
const risAnteprimaHint = document.getElementById("ris-anteprima-hint");
const risAnteprimaAlert = document.getElementById("ris-anteprima-alert");
const EPI_ANOMALY_THRESHOLD = 1800;
const RIS_JUDGE_STORAGE_KEY = "tuskJudgeName";
const risEsistente = document.getElementById("ris-esistente");
const risEsistenteDetail = document.getElementById("ris-esistente-detail");
const risBtnSalva = document.getElementById("ris-btn-salva");

let atletaCorrente = null;
let eventoCorrente = null;
let risEsistenteCorrente = null;
let formRenderVersion = 0;

function capRepsPerCategoria(evento, categoriaId) {
  return Number(evento?.capRepsBenchmark?.[categoriaId] || 0);
}

function eventoSupportaDnf(evento, categoriaId) {
  return evento?.scoringType === "time"
    && Number(evento.capSecondi || 0) > 0
    && capRepsPerCategoria(evento, categoriaId) > 0;
}

function isDnfRisultato(r) {
  return r?.dnf === true || r?.isDnf === true;
}

function calcolaPuntiDaRisultato(r, evento) {
  if (!r || !evento) return 0;
  if (isDnfRisultato(r)) {
    return calcolaEpiDnf(r.valore, evento, r.categoriaId);
  }
  return calcolaEpi(r.valore, evento, r.categoriaId);
}

function initTabRisultati() {
  initGiudiceInput();

  // Carica eventi una volta (dovrebbe essere già popolato in setup)
  getDocs(query(collection(db, COL.eventi), orderBy("numero", "asc"))).then((snap) => {
    eventiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    risEvento.innerHTML = '<option value="">— Seleziona evento —</option>';
    if (eventiCache.length === 0) {
      const opt = document.createElement("option");
      opt.disabled = true;
      opt.textContent = "⚠️ Nessun evento configurato — vai su /setup.html";
      risEvento.appendChild(opt);
      return;
    }
    eventiCache.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e.id;
      opt.textContent = `E${e.numero} — ${e.nome} (giorno ${e.giorno})`;
      risEvento.appendChild(opt);
    });
  }).catch((err) => {
    console.error("Errore caricamento eventi:", err);
  });
}

function initGiudiceInput() {
  if (!risGiudice) return;
  risGiudice.value = localStorage.getItem(RIS_JUDGE_STORAGE_KEY) || "";
  risGiudice.oninput = () => {
    localStorage.setItem(RIS_JUDGE_STORAGE_KEY, nomeGiudiceCorrente());
  };
}

function nomeGiudiceCorrente() {
  return String(risGiudice?.value || "").trim();
}

risSearchAtleta.addEventListener("input", () => {
  const qstr = risSearchAtleta.value.trim().toLowerCase();
  if (qstr.length < 2) {
    risSuggerimenti.hidden = true;
    return;
  }
  const matches = atletiCache.filter((a) =>
    a.nome.toLowerCase().includes(qstr) || (a.box || "").toLowerCase().includes(qstr)
  ).slice(0, 8);

  if (matches.length === 0) {
    risSuggerimenti.innerHTML = '<div class="suggerimenti__item" style="color: var(--text-muted);">Nessun atleta trovato</div>';
  } else {
    risSuggerimenti.innerHTML = matches.map((a) => {
      const isPresente = a.presente !== false;
      const cls = `suggerimenti__item${isPresente ? "" : " is-absent"}`;
      const tag = isPresente ? "" : ` <span class="atleta-badge atleta-badge--absent">Assente</span>`;
      return `
      <div class="${cls}" data-id="${escapeAttr(a.id)}">
        <div class="suggerimenti__nome">${escapeHtml(a.nome)}${tag}</div>
        <div class="suggerimenti__meta">${escapeHtml(NOMI_CATEGORIE[a.categoriaId] || a.categoriaId)} · ${escapeHtml(a.box || "—")}</div>
      </div>`;
    }).join("");
    risSuggerimenti.querySelectorAll(".suggerimenti__item[data-id]").forEach((item) => {
      item.addEventListener("click", () => {
        const a = atletiCache.find((x) => x.id === item.dataset.id);
        if (a) selezionaAtleta(a);
      });
    });
  }
  risSuggerimenti.hidden = false;
});

// Chiudi suggerimenti se click fuori
document.addEventListener("click", (e) => {
  if (!risSearchAtleta.contains(e.target) && !risSuggerimenti.contains(e.target)) {
    risSuggerimenti.hidden = true;
  }
});

function selezionaAtleta(a) {
  atletaCorrente = a;
  risAtletaNome.textContent = `${a.nome} — ${NOMI_CATEGORIE[a.categoriaId] || a.categoriaId}`;
  risAtletaSelezionato.hidden = false;
  risSearchAtleta.value = "";
  risSearchAtleta.hidden = true;
  risSuggerimenti.hidden = true;
  aggiornaFormDinamico();
}

risDeseleziona.addEventListener("click", () => {
  atletaCorrente = null;
  risAtletaSelezionato.hidden = true;
  risSearchAtleta.hidden = false;
  risSearchAtleta.focus();
  aggiornaFormDinamico();
});

risEvento.addEventListener("change", () => {
  const id = risEvento.value;
  eventoCorrente = id ? eventiCache.find((e) => e.id === id) : null;
  aggiornaFormDinamico();
});

async function aggiornaFormDinamico() {
  const renderId = ++formRenderVersion;
  const atleta = atletaCorrente;
  const evento = eventoCorrente;

  risFormDinamico.innerHTML = "";
  risAnteprima.hidden = true;
  risEsistente.hidden = true;
  risBtnSalva.disabled = true;
  risEsistenteCorrente = null;

  if (!atleta || !evento) {
    risFormDinamico.hidden = true;
    return;
  }
  risFormDinamico.hidden = false;

  // Verifica se esiste già un risultato
  const risId = `${atleta.id}_${evento.id}`;
  try {
    const d = await getDoc(doc(db, COL.risultati, risId));
    if (renderId !== formRenderVersion || atletaCorrente?.id !== atleta.id || eventoCorrente?.id !== evento.id) return;
    if (d.exists()) {
      const r = d.data();
      risEsistenteCorrente = r;
      risEsistenteDetail.textContent = ` ${formatDettaglioRisultato(r, evento)}`;
      risEsistente.hidden = false;
    }
  } catch (err) {
    if (renderId === formRenderVersion) console.warn("getDoc risultato esistente:", err.code);
  }

  // Genera HTML form in base a scoringType
  const t = evento.scoringType;
  let html = "";
  if (t === "weight") {
    html = `
      <div class="form__field">
        <label for="ris-input-weight">3. Peso sollevato (kg)</label>
        <input type="number" id="ris-input-weight" min="0" step="0.5" placeholder="Es. 100" data-input inputmode="decimal">
      </div>`;
  } else if (t === "reps") {
    html = `
      <div class="form__field">
        <label for="ris-input-num">3. Ripetizioni totali</label>
        <input type="number" id="ris-input-num" min="0" step="1" placeholder="Es. 60" data-input inputmode="numeric">
      </div>`;
  } else if (t === "calories") {
    html = `
      <div class="form__field">
        <label for="ris-input-num">3. Calorie totali</label>
        <input type="number" id="ris-input-num" min="0" step="1" placeholder="Es. 32" data-input inputmode="numeric">
      </div>`;
  } else if (t === "time") {
    const supportsDnf = eventoSupportaDnf(evento, atleta.categoriaId);
    const repsBm = capRepsPerCategoria(evento, atleta.categoriaId);
    html = `
      <div class="form__field">
        <label>3. Tempo di completamento</label>
        <div class="form-row">
          <input type="number" id="ris-input-min" min="0" step="1" placeholder="Minuti" data-input inputmode="numeric">
          <input type="number" id="ris-input-sec" min="0" max="59" step="1" placeholder="Secondi" data-input inputmode="numeric">
        </div>
      </div>`;
    if (supportsDnf) {
      html += `
      <div class="form__field" id="ris-dnf-block">
        <label class="form-row" style="align-items: center; gap: 0.6rem; cursor: pointer;">
          <input type="checkbox" id="ris-dnf-check" data-input>
          <span>DNF — non finito entro il cap (${secondiATempo(evento.capSecondi)}). Scoring per reps completate.</span>
        </label>
        <div id="ris-dnf-reps-row" hidden style="margin-top: 0.6rem;">
          <label for="ris-input-dnfreps">Reps/work unit completate al cap (lavoro completo: ${repsBm})</label>
          <input type="number" id="ris-input-dnfreps" min="0" max="${repsBm}" step="1" placeholder="Es. ${Math.max(1, Math.floor(repsBm * 0.6))}" data-input inputmode="numeric">
        </div>
      </div>`;
    }
  } else if (t === "rounds_reps") {
    const rpr = evento.repsPerRound || 0;
    const maxExtra = rpr > 0 ? ` max="${rpr - 1}"` : "";
    html = `
      <div class="form__field">
        <label>3. Round + reps extra (${rpr} reps per round)</label>
        <div class="form-row">
          <input type="number" id="ris-input-round" min="0" step="1" placeholder="Round completati" data-input inputmode="numeric">
          <input type="number" id="ris-input-extra" min="0"${maxExtra} step="1" placeholder="Reps extra" data-input inputmode="numeric">
        </div>
      </div>`;
  }
  // Tie-break (opzionale, sempre presente per ogni evento)
  const tbExistente = risEsistenteCorrente && typeof risEsistenteCorrente.tieBreak === "number"
    ? risEsistenteCorrente.tieBreak : null;
  const tbMin = tbExistente !== null ? Math.floor(tbExistente / 60) : "";
  const tbSec = tbExistente !== null ? (tbExistente % 60) : "";
  html += `
    <div class="form__field" id="ris-tb-block" style="border-top:1px dashed var(--border, #444); margin-top:1rem; padding-top:1rem;">
      <label>4. Tie-break (opzionale, mm:ss)</label>
      <div class="form-row">
        <input type="number" id="ris-input-tb-min" min="0" step="1" placeholder="Minuti" value="${tbMin}" data-input inputmode="numeric">
        <input type="number" id="ris-input-tb-sec" min="0" max="59" step="1" placeholder="Secondi" value="${tbSec}" data-input inputmode="numeric">
      </div>
      <span class="form__hint">Cronometro al checkpoint T.B. del WOD (es. dopo l'ultima RC, dopo i Thrusters, fine row). Usato per spareggi automatici quando due atleti hanno lo stesso EPI totale.</span>
    </div>`;
  risFormDinamico.innerHTML = html;
  risFormDinamico.querySelectorAll("[data-input]").forEach((input) => {
    input.addEventListener("input", aggiornaAnteprima);
  });
  // Listener DNF checkbox: toggla visibility input reps + abilitazione input time
  const dnfCheck = document.getElementById("ris-dnf-check");
  if (dnfCheck) {
    dnfCheck.addEventListener("change", () => {
      const repsRow = document.getElementById("ris-dnf-reps-row");
      const minInput = document.getElementById("ris-input-min");
      const secInput = document.getElementById("ris-input-sec");
      const isDnf = dnfCheck.checked;
      if (repsRow) repsRow.hidden = !isDnf;
      if (minInput) {
        minInput.disabled = isDnf;
        if (isDnf) minInput.value = "";
      }
      if (secInput) {
        secInput.disabled = isDnf;
        if (isDnf) secInput.value = "";
      }
      const dnfRepsInput = document.getElementById("ris-input-dnfreps");
      if (dnfRepsInput) {
        if (isDnf) dnfRepsInput.focus();
        else dnfRepsInput.value = "";
      }
      aggiornaAnteprima();
    });
  }
  // Focus primo input
  const first = risFormDinamico.querySelector("[data-input]");
  if (first) first.focus();
}

function aggiornaAnteprima() {
  if (!atletaCorrente || !eventoCorrente) return;

  // Pre-check: tempo inserito oltre il cap → mostra warning chiaro invece di rifiuto silenzioso
  const dnfCheck = document.getElementById("ris-dnf-check");
  const isDnfActive = !!(dnfCheck && dnfCheck.checked);
  if (eventoCorrente.scoringType === "time"
      && !isDnfActive
      && eventoSupportaDnf(eventoCorrente, atletaCorrente.categoriaId)) {
    const m = interoNonNegativo("ris-input-min", 0);
    const s = interoNonNegativo("ris-input-sec", 0);
    const cap = Number(eventoCorrente.capSecondi || 0);
    if (m !== null && s !== null && s <= 59 && cap > 0) {
      const sec = tempoASecondi(m, s);
      if (sec > cap) {
        risAnteprimaValore.textContent = "—";
        risAnteprimaHint.textContent = "";
        risAnteprima.classList.remove("is-anomalous");
        if (risAnteprimaAlert) {
          risAnteprimaAlert.textContent = `⚠️ Tempo ${secondiATempo(sec)} oltre il cap (${secondiATempo(cap)}). Attiva la checkbox DNF qui sotto e inserisci le reps completate al cap, oppure correggi il tempo.`;
          risAnteprimaAlert.hidden = false;
        }
        risAnteprima.hidden = false;
        risBtnSalva.disabled = true;
        return;
      }
    }
  }

  const valore = leggiPerformance();
  if (valore === null || valore <= 0) {
    risAnteprima.hidden = true;
    risBtnSalva.disabled = true;
    return;
  }
  const dnfCheckPreview = document.getElementById("ris-dnf-check");
  const isDnfPreview = !!(dnfCheckPreview && dnfCheckPreview.checked && eventoSupportaDnf(eventoCorrente, atletaCorrente.categoriaId));
  const punti = isDnfPreview
    ? calcolaEpiDnf(valore, eventoCorrente, atletaCorrente.categoriaId)
    : calcolaEpi(valore, eventoCorrente, atletaCorrente.categoriaId);
  risAnteprimaValore.textContent = punti;

  // Hint contestuale (es. "100kg / benchmark 130kg")
  const bm = eventoCorrente.benchmarks ? eventoCorrente.benchmarks[atletaCorrente.categoriaId] : null;
  if (isDnfPreview) {
    const repsBm = eventoCorrente.capRepsBenchmark?.[atletaCorrente.categoriaId];
    risAnteprimaHint.textContent = `DNF: ${valore} reps al cap · Benchmark reps "1000": ${repsBm ?? "—"}`;
  } else if (bm) {
    const t = eventoCorrente.scoringType;
    let valStr = String(valore);
    if (t === "time") valStr = secondiATempo(valore);
    let bmStr = String(bm);
    if (t === "time") bmStr = secondiATempo(bm);
    risAnteprimaHint.textContent = `Performance: ${valStr} · Benchmark "1000": ${bmStr}`;
  } else {
    risAnteprimaHint.textContent = "";
  }

  const isAnomalous = punti > EPI_ANOMALY_THRESHOLD;
  risAnteprima.classList.toggle("is-anomalous", isAnomalous);
  if (risAnteprimaAlert) {
    if (isAnomalous) {
      risAnteprimaAlert.textContent = `⚠️ ${punti} punti supera 1.8× il benchmark — verifica il valore (es. 100 invece di 1000, oppure 1080 invece di 108).`;
      risAnteprimaAlert.hidden = false;
    } else {
      risAnteprimaAlert.hidden = true;
      risAnteprimaAlert.textContent = "";
    }
  }

  risAnteprima.hidden = false;
  risBtnSalva.disabled = false;
}

function valoreInput(id) {
  return String(document.getElementById(id)?.value || "").trim();
}

function numeroPositivo(id) {
  const raw = valoreInput(id).replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function interoNonNegativo(id, fallback = null) {
  const raw = valoreInput(id);
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function leggiTieBreak() {
  const mRaw = valoreInput("ris-input-tb-min");
  const sRaw = valoreInput("ris-input-tb-sec");
  if (!mRaw && !sRaw) return null;
  const m = mRaw ? interoNonNegativo("ris-input-tb-min", 0) : 0;
  const s = sRaw ? interoNonNegativo("ris-input-tb-sec", 0) : 0;
  if (m === null || s === null || s > 59) return null;
  const total = m * 60 + s;
  return total > 0 ? total : null;
}

function leggiPerformance() {
  const t = eventoCorrente.scoringType;
  if (t === "weight") {
    return numeroPositivo("ris-input-weight");
  }
  if (t === "reps" || t === "calories") {
    const v = interoNonNegativo("ris-input-num");
    return v !== null && v > 0 ? v : null;
  }
  if (t === "time") {
    // DNF mode: legge reps invece di tempo
    const dnfCheck = document.getElementById("ris-dnf-check");
    if (dnfCheck && dnfCheck.checked) {
      const reps = interoNonNegativo("ris-input-dnfreps");
      const repsBm = capRepsPerCategoria(eventoCorrente, atletaCorrente?.categoriaId);
      if (reps === null || reps <= 0) return null;
      if (repsBm > 0 && reps > repsBm) return null;
      return reps;
    }
    if (!valoreInput("ris-input-min") && !valoreInput("ris-input-sec")) return null;
    const m = interoNonNegativo("ris-input-min", 0);
    const s = interoNonNegativo("ris-input-sec", 0);
    if (m === null || s === null || s > 59) return null;
    const sec = tempoASecondi(m, s);
    if (eventoSupportaDnf(eventoCorrente, atletaCorrente?.categoriaId)
      && sec > Number(eventoCorrente.capSecondi || 0)) return null;
    return sec > 0 ? sec : null;
  }
  if (t === "rounds_reps") {
    if (!valoreInput("ris-input-round") && !valoreInput("ris-input-extra")) return null;
    const r = interoNonNegativo("ris-input-round", 0);
    const e = interoNonNegativo("ris-input-extra", 0);
    const rpr = Number(eventoCorrente.repsPerRound || 0);
    if (r === null || e === null || (rpr > 0 && e >= rpr)) return null;
    const reps = roundsRepsAReps(r, e, rpr);
    return reps > 0 ? reps : null;
  }
  return null;
}

function formatValoreEsistente(r, evento) {
  const t = evento.scoringType;
  if (t === "weight") return `${r.valore} kg`;
  if (t === "reps") return `${r.valore} reps`;
  if (t === "calories") return `${r.valore} cal`;
  if (t === "time") {
    if (isDnfRisultato(r)) {
      const repsBm = capRepsPerCategoria(evento, r.categoriaId);
      const repsInfo = repsBm > 0 ? `${r.valore}/${repsBm}` : String(r.valore);
      const capInfo = evento.capSecondi ? ` ${secondiATempo(evento.capSecondi)}` : "";
      return `DNF · ${repsInfo} reps al cap${capInfo}`;
    }
    return secondiATempo(r.valore);
  }
  if (t === "rounds_reps") {
    const rpr = evento.repsPerRound || 1;
    const round = Math.floor(r.valore / rpr);
    const extra = r.valore % rpr;
    return `${round} round + ${extra} reps (= ${r.valore} totali)`;
  }
  return String(r.valore);
}

function formatTimestamp(ts) {
  if (!ts || typeof ts.toDate !== "function") return "";
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatAutoreRisultato(r) {
  const nome = r.aggiornatoDa || r.inseritoDa || "giudice non indicato";
  const ts = r.aggiornatoIl || r.inseritoIl;
  return `${nome}${ts ? " alle " + formatTimestamp(ts) : ""}`;
}

function formatDettaglioRisultato(r, evento) {
  const tb = formatTieBreak(r);
  return `${formatValoreEsistente(r, evento)}${tb ? " - " + tb : ""} -> ${r.puntiEpi} punti EPI (${formatAutoreRisultato(r)})`;
}

function timestampKey(ts) {
  if (!ts) return "";
  if (typeof ts.toMillis === "function") return String(ts.toMillis());
  if (typeof ts.seconds === "number") return `${ts.seconds}:${ts.nanoseconds || 0}`;
  return String(ts);
}

function firmaRisultato(r) {
  return JSON.stringify({
    valore: r?.valore ?? null,
    valoreSecondario: r?.valoreSecondario ?? null,
    dnf: isDnfRisultato(r),
    puntiEpi: r?.puntiEpi ?? null,
    tieBreak: tieBreakSecondi(r),
    aggiornatoDa: r?.aggiornatoDa || r?.inseritoDa || "",
    aggiornatoIl: timestampKey(r?.aggiornatoIl || r?.inseritoIl)
  });
}

risBtnSalva.addEventListener("click", async () => {
  if (!atletaCorrente || !eventoCorrente) return;
  const giudice = nomeGiudiceCorrente();
  if (!giudice) {
    alert("Inserisci il nome del giudice prima di salvare il risultato.");
    risGiudice?.focus();
    return;
  }
  localStorage.setItem(RIS_JUDGE_STORAGE_KEY, giudice);

  const valore = leggiPerformance();
  if (valore === null || valore <= 0) return;

  const t = eventoCorrente.scoringType;
  const valoreSecondario = t === "rounds_reps"
    ? (interoNonNegativo("ris-input-extra", 0) || 0)
    : null;

  const dnfCheckSave = document.getElementById("ris-dnf-check");
  const isDnf = !!(dnfCheckSave && dnfCheckSave.checked && eventoSupportaDnf(eventoCorrente, atletaCorrente.categoriaId));
  const puntiEpi = isDnf
    ? calcolaEpiDnf(valore, eventoCorrente, atletaCorrente.categoriaId)
    : calcolaEpi(valore, eventoCorrente, atletaCorrente.categoriaId);
  const tieBreak = leggiTieBreak();
  const risId = `${atletaCorrente.id}_${eventoCorrente.id}`;
  const risultatoRef = doc(db, COL.risultati, risId);
  const risultatoPubblicoRef = doc(db, COL.risultatiPubblici, risId);

  if (puntiEpi > EPI_ANOMALY_THRESHOLD) {
    const valoreFmt = formatValoreEsistente({ valore }, eventoCorrente);
    if (!confirm(`⚠️ Punteggio anomalo: ${puntiEpi} punti EPI (oltre 1.8× benchmark).\n\nValore inserito: ${valoreFmt}\nAtleta: ${atletaCorrente.nome} (${NOMI_CATEGORIE[atletaCorrente.categoriaId] || atletaCorrente.categoriaId})\nEvento: E${eventoCorrente.numero} ${eventoCorrente.nome}\n\nConfermi che il valore sia corretto?`)) return;
  }

  risBtnSalva.disabled = true;
  risBtnSalva.classList.add("is-loading");

  try {
    let overwriteConfirmed = false;
    let overwriteSignature = "";
    const currentSnap = await getDoc(risultatoRef);
    if (currentSnap.exists()) {
      const current = currentSnap.data();
      overwriteSignature = firmaRisultato(current);
      const nuovoTb = formatTieBreak({ tieBreak });
      if (!confirm(`Sovrascrivere il risultato esistente per ${atletaCorrente.nome} su E${eventoCorrente.numero} ${eventoCorrente.nome}?\n\nPrecedente: ${formatDettaglioRisultato(current, eventoCorrente)}\nNuovo: ${puntiEpi} pt${nuovoTb ? " - " + nuovoTb : " - T.B. vuoto"}\nGiudice: ${giudice}`)) return;
      overwriteConfirmed = true;
    }

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(risultatoRef);
      if (snap.exists() && !overwriteConfirmed) {
        const conflict = new Error("Risultato gia salvato da un altro giudice.");
        conflict.code = "tusk/concurrent-result";
        conflict.current = snap.data();
        throw conflict;
      }
      if (snap.exists() && overwriteConfirmed && firmaRisultato(snap.data()) !== overwriteSignature) {
        const stale = new Error("Risultato modificato dopo la conferma.");
        stale.code = "tusk/stale-result";
        stale.current = snap.data();
        throw stale;
      }

      const previous = snap.exists() ? snap.data() : null;
      const payload = {
        atletaId: atletaCorrente.id,
        eventoId: eventoCorrente.id,
        categoriaId: atletaCorrente.categoriaId,
        valore: valore,
        valoreSecondario: valoreSecondario,
        dnf: isDnf,
        puntiEpi: puntiEpi,
        tieBreak: tieBreak,
        aggiornatoIl: serverTimestamp(),
        aggiornatoDa: giudice
      };

      if (previous) {
        payload.inseritoIl = previous.inseritoIl || serverTimestamp();
        payload.inseritoDa = previous.inseritoDa || previous.aggiornatoDa || giudice;
        payload.sovrascrittoIl = serverTimestamp();
        payload.sovrascrittoDa = giudice;
        payload.precedente = {
          valore: previous.valore ?? null,
          valoreSecondario: previous.valoreSecondario ?? null,
          dnf: isDnfRisultato(previous),
          puntiEpi: previous.puntiEpi ?? null,
          giudice: previous.aggiornatoDa || previous.inseritoDa || "",
          salvatoIl: previous.aggiornatoIl || previous.inseritoIl || null
        };
      } else {
        payload.inseritoIl = serverTimestamp();
        payload.inseritoDa = giudice;
      }

      transaction.set(risultatoRef, payload, { merge: true });
      transaction.set(risultatoPubblicoRef, datiRisultatoPubblico(payload));
    });
    showToast(`✅ Salvato: ${puntiEpi} pt EPI per ${atletaCorrente.nome}`);
    // Reset form
    risFormDinamico.innerHTML = "";
    risFormDinamico.hidden = true;
    risAnteprima.hidden = true;
    risEsistente.hidden = true;
    risEvento.value = "";
    eventoCorrente = null;
    atletaCorrente = null;
    risEsistenteCorrente = null;
    risAtletaSelezionato.hidden = true;
    risSearchAtleta.hidden = false;
    risSearchAtleta.value = "";
    risSearchAtleta.focus();
  } catch (err) {
    if (err.code === "tusk/concurrent-result" || err.code === "tusk/stale-result") {
      risEsistenteCorrente = err.current;
      risEsistenteDetail.textContent = ` ${formatDettaglioRisultato(err.current, eventoCorrente)}`;
      risEsistente.hidden = false;
      alert(`Attenzione: un altro giudice ha appena salvato o modificato questo atleta/WOD.\n\nRisultato presente: ${formatDettaglioRisultato(err.current, eventoCorrente)}\n\nVerifica prima di sovrascrivere.`);
      return;
    }
    console.error("Errore salvataggio risultato:", err);
    alert(`Errore: ${err.code || err.message}`);
  } finally {
    risBtnSalva.disabled = !atletaCorrente || !eventoCorrente || risAnteprima.hidden;
    risBtnSalva.classList.remove("is-loading");
  }
});

// =====================================================
// TAB EVENTI (read-only)
// =====================================================
function initTabEventi() {
  const lista = document.getElementById("lista-eventi");
  if (!lista) return;
  getDocs(query(collection(db, COL.eventi), orderBy("numero", "asc")))
    .then((snap) => {
      if (snap.empty) {
        lista.innerHTML = `<p class="admin-empty">Nessun evento configurato. Vai su <a href="setup.html" style="color: var(--accent-primary);">setup.html</a> per popolare i 10 eventi.</p>`;
        return;
      }
      lista.innerHTML = "";
      snap.docs.forEach((d) => {
        const e = d.data();
        const card = document.createElement("div");
        card.className = "admin-card";
        const bm = e.benchmarks || {};
        const bmStr = ["ultimate", "advanced", "challenge", "essential", "performance", "intermediate"]
          .map((k) => `<span style="display:inline-block; margin-right: 0.8rem; font-size: 0.85em;"><strong style="color: var(--accent-primary);">${k.slice(0, 3).toUpperCase()}:</strong> ${bm[k] !== undefined ? bm[k] : "—"}</span>`)
          .join("");
        const rprStr = e.repsPerRound ? ` · <strong>RPR ${e.repsPerRound}</strong>` : "";
        card.innerHTML = `
          <div class="admin-card__info" style="flex-basis: 100%;">
            <div class="admin-card__title">E${e.numero} — ${escapeHtml(e.nome)}</div>
            <div class="admin-card__meta">
              ${escapeHtml(e.scoringType)} · ${escapeHtml(e.scoringDirection)} · giorno ${e.giorno}${rprStr}<br>
              <div style="margin-top: 0.4rem;">${bmStr}</div>
            </div>
          </div>
        `;
        lista.appendChild(card);
      });
    })
    .catch((err) => {
      lista.innerHTML = `<p class="admin-empty">Errore: ${escapeHtml(err.code || err.message)}</p>`;
    });
}

function timestampMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return (ts.seconds * 1000) + Math.floor((ts.nanoseconds || 0) / 1000000);
  return 0;
}

function formatDateTime(ts) {
  const millis = timestampMillis(ts);
  if (!millis) return "";
  const d = new Date(millis);
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatValoreRisultato(r, evento) {
  if (!evento) return String(r.valore ?? "");
  return formatValoreEsistente(r, evento);
}

async function caricaDatiRisultatiAdmin() {
  const [atletiSnap, eventiSnap, risSnap] = await Promise.all([
    getDocs(collection(db, COL.atleti)),
    getDocs(collection(db, COL.eventi)),
    getDocs(collection(db, COL.risultati))
  ]);

  const atletiMap = new Map(atletiSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  const eventiMap = new Map(eventiSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  const risultati = risSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => timestampMillis(b.aggiornatoIl || b.inseritoIl) - timestampMillis(a.aggiornatoIl || a.inseritoIl));

  return { atletiMap, eventiMap, risultati };
}

function renderAuditRisultati(outputEl, dati) {
  if (!outputEl) return;
  const ultimi = dati.risultati.slice(0, 12);
  if (ultimi.length === 0) {
    outputEl.innerHTML = `<p class="admin-empty">Nessun risultato inserito.</p>`;
    return;
  }

  outputEl.innerHTML = ultimi.map((r) => {
    const atleta = dati.atletiMap.get(r.atletaId);
    const evento = dati.eventiMap.get(r.eventoId);
    const nomeAtleta = atleta?.nome || `Atleta eliminato (${r.atletaId})`;
    const categoria = NOMI_CATEGORIE[r.categoriaId] || r.categoriaId || "-";
    const eventoLabel = evento ? `E${evento.numero} - ${evento.nome}` : `Evento ${r.eventoId}`;
    const giudice = r.aggiornatoDa || r.inseritoDa || "giudice non indicato";
    const tb = formatTieBreak(r);
    return `
      <div class="audit-row">
        <div class="audit-row__main">
          <div class="audit-row__athlete">${escapeHtml(nomeAtleta)}</div>
          <div class="audit-row__event">${escapeHtml(categoria)} · ${escapeHtml(atleta?.box || "-")}</div>
        </div>
        <div class="audit-row__meta">
          <div class="audit-row__event">${escapeHtml(eventoLabel)} · ${escapeHtml(formatValoreRisultato(r, evento))}${tb ? " - " + escapeHtml(tb) : ""}</div>
          <div class="audit-row__judge">${escapeHtml(giudice)} · ${escapeHtml(formatDateTime(r.aggiornatoIl || r.inseritoIl) || "ora n.d.")}</div>
        </div>
        <div class="audit-row__score">
          <b>${Number(r.puntiEpi || 0).toFixed(1)}</b>
          EPI
        </div>
      </div>
    `;
  }).join("");
}

function officialUrl(path) {
  return `${window.location.origin}/${path}`;
}

function qrCodeUrl(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(url)}`;
}

function officialMessage() {
  const athleteUrl = officialUrl("iscriviti.html");
  const liveUrl = officialUrl("live.html");
  const podioUrl = officialUrl("podio.html");
  return `TUSK Protocol Bad Boars - link ufficiali

Iscrizione atleti:
${athleteUrl}

Classifica live:
${liveUrl}

Podio:
${podioUrl}

Salva l'app sul telefono:
iPhone: apri il link con Safari, Condividi, Aggiungi a schermata Home.
Android: apri il link con Chrome, menu tre puntini, Installa app o Aggiungi a schermata Home.

Se il link si apre dentro WhatsApp o Instagram, scegli Apri nel browser.`;
}

function initOfficialLinks() {
  const root = document.getElementById("official-links");
  if (!root || root.dataset.ready === "1") return;
  root.dataset.ready = "1";

  const links = [
    { key: "atleti", label: "Atleti", desc: "Form iscrizione", path: "iscriviti.html" },
    { key: "live", label: "Live", desc: "Classifica pubblica", path: "live.html" },
    { key: "podio", label: "Podio", desc: "Top 3 premiazione", path: "podio.html" },
    { key: "giudici", label: "Giudici", desc: "Console riservata", path: "giudici.html" }
  ];

  root.innerHTML = links.map((item) => {
    const url = officialUrl(item.path);
    return `
      <div class="official-link">
        <div class="official-link__qr">
          <img src="${escapeAttr(qrCodeUrl(url))}" alt="QR ${escapeAttr(item.label)}" loading="lazy">
        </div>
        <div class="official-link__body">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.desc)}</span>
          <input type="text" readonly value="${escapeAttr(url)}">
          <div class="official-link__actions">
            <button type="button" class="btn btn--ghost btn--small" data-copy-link="${escapeAttr(url)}">Copia</button>
            <a class="btn btn--ghost btn--small" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Apri</a>
            <a class="btn btn--ghost btn--small" href="${escapeAttr(qrCodeUrl(url))}" target="_blank" rel="noopener noreferrer">QR</a>
          </div>
        </div>
      </div>
    `;
  }).join("");

  root.querySelectorAll("[data-copy-link]").forEach((btn) => {
    btn.addEventListener("click", () => copyText(btn.dataset.copyLink || "", "Link copiato"));
  });

  const btnCopyMessage = document.getElementById("btn-copy-official-message");
  const btnOpenWhatsapp = document.getElementById("btn-open-official-whatsapp");
  btnCopyMessage?.addEventListener("click", () => copyText(officialMessage(), "Messaggio atleti copiato"));
  btnOpenWhatsapp?.addEventListener("click", () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(officialMessage())}`, "_blank", "noopener,noreferrer");
  });
}

function creaClassifiche(dati) {
  const eventiOrdinati = [...dati.eventiMap.values()]
    .filter((e) => Number.isFinite(Number(e.numero)))
    .sort((a, b) => Number(a.numero) - Number(b.numero));
  const risultatiPerAtleta = new Map();

  dati.risultati.forEach((r) => {
    const atleta = dati.atletiMap.get(r.atletaId);
    if (!atleta || atleta.presente === false) return;
    const evento = dati.eventiMap.get(r.eventoId);
    const eventoNum = Number(evento?.numero || r.eventoId || 0);
    const key = String(eventoNum || r.eventoId);
    if (!risultatiPerAtleta.has(r.atletaId)) risultatiPerAtleta.set(r.atletaId, {});
    risultatiPerAtleta.get(r.atletaId)[key] = Number(r.puntiEpi || 0);
  });

  const classifiche = {};
  CATEGORIE_ORDINATE.forEach((cat) => {
    const rows = [...dati.atletiMap.values()]
      .filter((a) => a.categoriaId === cat && a.presente !== false)
      .map((atleta) => {
        const perEvento = risultatiPerAtleta.get(atleta.id) || {};
        const punti = Object.values(perEvento);
        const totale = punti.reduce((sum, p) => sum + Number(p || 0), 0);
        return { atleta, perEvento, totale, eventi: punti.length };
      })
      .sort((a, b) => {
        if (b.totale !== a.totale) return b.totale - a.totale;
        return String(a.atleta.nome || "").localeCompare(String(b.atleta.nome || ""), "it");
      });
    classifiche[cat] = rows;
  });

  return { classifiche, eventiOrdinati };
}

function risultatiOrfani(dati) {
  return dati.risultati.filter((r) => !dati.atletiMap.has(r.atletaId));
}

function descriviRisultatiOrfani(orfani, dati, limite = 10) {
  if (orfani.length === 0) return "Nessun risultato orfano trovato.";
  const righe = [
    `Risultati orfani trovati: ${orfani.length}`,
    `Sono risultati collegati ad atleti eliminati. Non appaiono in live/podio, ma restano in storico e backup.`,
    ``,
    `Prime righe:`
  ];
  orfani.slice(0, limite).forEach((r, idx) => {
    const evento = dati.eventiMap.get(r.eventoId);
    const eventoLabel = evento ? `E${evento.numero} ${evento.nome}` : `Evento ${r.eventoId}`;
    const categoria = NOMI_CATEGORIE[r.categoriaId] || r.categoriaId || "-";
    righe.push(`${idx + 1}. ${eventoLabel} · ${categoria} · ${formatValoreRisultato(r, evento)} · ${Number(r.puntiEpi || 0).toFixed(1)} EPI · atletaId ${r.atletaId}`);
  });
  if (orfani.length > limite) righe.push(`... altri ${orfani.length - limite} risultati non mostrati.`);
  return righe.join("\n");
}

async function eliminaRisultatiOrfani(orfani) {
  let eliminati = 0;
  for (let i = 0; i < orfani.length; i += 240) {
    const batch = writeBatch(db);
    const chunk = orfani.slice(i, i + 240);
    chunk.forEach((r) => {
      batch.delete(doc(db, COL.risultati, r.id));
      batch.delete(doc(db, COL.risultatiPubblici, r.id));
    });
    await batch.commit();
    eliminati += chunk.length;
  }
  return eliminati;
}

// =====================================================
// TAB STRUMENTI
// =====================================================
function initTabStrumenti() {
  const btnRicalcola = document.getElementById("btn-ricalcola");
  const ricalcolaOutput = document.getElementById("ricalcola-output");
  const btnExport = document.getElementById("btn-export");
  const exportCategoria = document.getElementById("export-categoria");
  const btnExportFinali = document.getElementById("btn-export-finali");
  const btnExportPodi = document.getElementById("btn-export-podi");
  const btnExportAtleti = document.getElementById("btn-export-atleti");
  const btnExportRisultati = document.getElementById("btn-export-risultati");
  const btnScanOrfani = document.getElementById("btn-scan-orfani");
  const btnDeleteOrfani = document.getElementById("btn-delete-orfani");
  const orfaniOutput = document.getElementById("orfani-output");
  const btnRefreshAudit = document.getElementById("btn-refresh-audit");
  const auditRisultati = document.getElementById("audit-risultati");
  const btnSyncPubblici = document.getElementById("btn-sync-pubblici");
  const syncPubbliciOutput = document.getElementById("sync-pubblici-output");
  const btnSyncRisultatiPubblici = document.getElementById("btn-sync-risultati-pubblici");
  const syncRisultatiPubbliciOutput = document.getElementById("sync-risultati-pubblici-output");
  const btnStats = document.getElementById("btn-stats");
  const statsOutput = document.getElementById("stats-output");

  if (!btnRicalcola) return;
  initOfficialLinks();

  async function aggiornaAuditRisultati() {
    if (!auditRisultati) return;
    auditRisultati.innerHTML = `<p class="admin-empty">Caricamento ultimi risultati...</p>`;
    try {
      const dati = await caricaDatiRisultatiAdmin();
      renderAuditRisultati(auditRisultati, dati);
    } catch (err) {
      auditRisultati.innerHTML = `<p class="admin-empty">Errore: ${escapeHtml(err.code || err.message)}</p>`;
    }
  }

  if (btnRefreshAudit) {
    btnRefreshAudit.onclick = aggiornaAuditRisultati;
  }
  aggiornaAuditRisultati();

  // Ricalcola EPI
  btnRicalcola.onclick = async () => {
    if (!confirm("Ricalcolare TUTTI gli EPI usando i benchmark correnti?\n\nOperazione rapida (max ~1 minuto), sicura, sovrascrive solo il campo puntiEpi sui risultati.")) return;
    ricalcolaOutput.classList.add("is-visible");
    ricalcolaOutput.textContent = "Caricamento eventi...\n";
    btnRicalcola.disabled = true;

    try {
      const eventiSnap = await getDocs(collection(db, COL.eventi));
      const eventiMap = {};
      eventiSnap.docs.forEach((d) => { eventiMap[d.id] = d.data(); });

      const risSnap = await getDocs(collection(db, COL.risultati));
      ricalcolaOutput.textContent += `Trovati ${risSnap.size} risultati. Ricalcolo in corso...\n`;

      let aggiornati = 0;
      let invariati = 0;
      let mancantiBenchmark = 0;

      const docs = risSnap.docs;
      for (let i = 0; i < docs.length; i += 240) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 240);
        chunk.forEach((d) => {
          const r = d.data();
          const evento = eventiMap[r.eventoId];
          if (!evento) {
            mancantiBenchmark++;
            return;
          }
          const nuovi = calcolaPuntiDaRisultato(r, evento);
          if (Math.abs(nuovi - (r.puntiEpi || 0)) > 0.05) {
            batch.update(doc(db, COL.risultati, d.id), { puntiEpi: nuovi });
            batch.set(doc(db, COL.risultatiPubblici, d.id), datiRisultatoPubblico({ ...r, puntiEpi: nuovi }));
            aggiornati++;
          } else {
            batch.set(doc(db, COL.risultatiPubblici, d.id), datiRisultatoPubblico(r));
            invariati++;
          }
        });
        await batch.commit();
        ricalcolaOutput.textContent += `Processati ${Math.min(i + 240, docs.length)}/${docs.length}...\n`;
      }
      ricalcolaOutput.textContent += `\n=== Fine ===\nAggiornati: ${aggiornati}\nInvariati: ${invariati}\nMancante evento: ${mancantiBenchmark}\nTotale: ${risSnap.size}`;
    } catch (err) {
      ricalcolaOutput.textContent += `\nERRORE: ${err.code || err.message}`;
    } finally {
      btnRicalcola.disabled = false;
    }
  };

  // Esporta classifica per categoria
  btnExport.onclick = async () => {
    const cat = exportCategoria.value;
    try {
      const [atletiSnap, risSnap] = await Promise.all([
        getDocs(collection(db, COL.atleti)),
        getDocs(collection(db, COL.risultati))
      ]);
      const atleti = atletiSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => a.categoriaId === cat);
      const risultati = risSnap.docs.map((d) => d.data());

      const headers = ["Pos", "Nome", "Box", "Contatto"];
      for (let n = 1; n <= 10; n++) headers.push(`E${n}`);
      headers.push("EPI Totale");

      const rows = atleti.map((a) => {
        const perEv = {};
        risultati.filter((r) => r.atletaId === a.id).forEach((r) => {
          perEv[r.eventoId] = r.puntiEpi;
        });
        const totale = Object.values(perEv).reduce((acc, p) => acc + (p || 0), 0);
        return { atleta: a, perEv, totale };
      }).sort((x, y) => y.totale - x.totale);

      let csv = headers.join(";") + "\n";
      rows.forEach((row, idx) => {
        const cells = [
          idx + 1,
          csvSafe(row.atleta.nome),
          csvSafe(row.atleta.box || ""),
          csvSafe(row.atleta.contatto || "")
        ];
        for (let n = 1; n <= 10; n++) {
          cells.push(row.perEv[String(n)] !== undefined ? row.perEv[String(n)].toFixed(1) : "");
        }
        cells.push(row.totale.toFixed(1));
        csv += cells.join(";") + "\n";
      });

      downloadCsv(csv, `classifica-${cat}-${nowStr()}.csv`);
      showToast(`📥 Classifica ${cat} esportata (${rows.length} atleti)`);
    } catch (err) {
      console.error(err);
      alert("Errore export: " + (err.code || err.message));
    }
  };

  if (btnExportFinali) {
    btnExportFinali.onclick = async () => {
      btnExportFinali.disabled = true;
      try {
        const dati = await caricaDatiRisultatiAdmin();
        const { classifiche, eventiOrdinati } = creaClassifiche(dati);
        const headers = ["Categoria", "Pos", "Nome", "Box", "Eventi completati"];
        eventiOrdinati.forEach((e) => headers.push(`E${e.numero}`));
        headers.push("EPI Totale");

        let csv = headers.join(";") + "\n";
        CATEGORIE_ORDINATE.forEach((cat) => {
          (classifiche[cat] || []).forEach((row, idx) => {
            const cells = [
              NOMI_CATEGORIE[cat] || cat,
              idx + 1,
              row.atleta.nome || "",
              row.atleta.box || "",
              row.eventi
            ];
            eventiOrdinati.forEach((e) => {
              const key = String(Number(e.numero));
              cells.push(row.perEvento[key] !== undefined ? Number(row.perEvento[key]).toFixed(1) : "");
            });
            cells.push(row.totale.toFixed(1));
            csv += cells.map(csvSafe).join(";") + "\n";
          });
        });

        downloadCsv(csv, `classifiche-finali-${nowStr()}.csv`);
        showToast("Classifiche finali esportate");
      } catch (err) {
        console.error(err);
        alert("Errore export finali: " + (err.code || err.message));
      } finally {
        btnExportFinali.disabled = false;
      }
    };
  }

  if (btnExportPodi) {
    btnExportPodi.onclick = async () => {
      btnExportPodi.disabled = true;
      try {
        const dati = await caricaDatiRisultatiAdmin();
        const { classifiche } = creaClassifiche(dati);
        const headers = ["Categoria", "Pos", "Nome", "Box", "Eventi completati", "EPI Totale"];
        let csv = headers.join(";") + "\n";

        CATEGORIE_ORDINATE.forEach((cat) => {
          (classifiche[cat] || []).slice(0, 3).forEach((row, idx) => {
            const cells = [
              NOMI_CATEGORIE[cat] || cat,
              idx + 1,
              row.atleta.nome || "",
              row.atleta.box || "",
              row.eventi,
              row.totale.toFixed(1)
            ];
            csv += cells.map(csvSafe).join(";") + "\n";
          });
        });

        downloadCsv(csv, `podi-top3-${nowStr()}.csv`);
        showToast("Podi top 3 esportati");
      } catch (err) {
        console.error(err);
        alert("Errore export podi: " + (err.code || err.message));
      } finally {
        btnExportPodi.disabled = false;
      }
    };
  }

  // Esporta atleti
  btnExportAtleti.onclick = async () => {
    try {
      const snap = await getDocs(query(collection(db, COL.atleti), orderBy("nome", "asc")));
      let csv = "Nome;Categoria;Box;Contatto\n";
      snap.docs.forEach((d) => {
        const a = d.data();
        csv += [
          csvSafe(a.nome),
          csvSafe(a.categoriaId),
          csvSafe(a.box || ""),
          csvSafe(a.contatto || "")
        ].join(";") + "\n";
      });
      downloadCsv(csv, `atleti-${nowStr()}.csv`);
      showToast(`📥 ${snap.size} atleti esportati`);
    } catch (err) {
      alert("Errore: " + (err.code || err.message));
    }
  };

  // Backup completo risultati
  if (btnExportRisultati) {
    btnExportRisultati.onclick = async () => {
      btnExportRisultati.disabled = true;
      try {
        const dati = await caricaDatiRisultatiAdmin();
        const ordered = [...dati.risultati].sort((a, b) => {
          const ea = dati.eventiMap.get(a.eventoId);
          const eb = dati.eventiMap.get(b.eventoId);
          const na = Number(ea?.numero || a.eventoId || 0);
          const nb = Number(eb?.numero || b.eventoId || 0);
          if (na !== nb) return na - nb;
          const aa = dati.atletiMap.get(a.atletaId);
          const ab = dati.atletiMap.get(b.atletaId);
          return String(aa?.nome || a.atletaId).localeCompare(String(ab?.nome || b.atletaId), "it");
        });

        const headers = [
          "Data/Ora",
          "Evento",
          "Evento ID",
          "Atleta",
          "Categoria",
          "Box",
          "Contatto",
          "Presenza",
          "Valore",
          "DNF",
          "Valore raw",
          "Valore secondario",
          "T.B. mm:ss",
          "T.B. secondi",
          "Punti EPI",
          "Giudice ultimo update",
          "Giudice primo inserimento",
          "Sovrascritto da",
          "Punti precedenti"
        ];
        let csv = headers.join(";") + "\n";

        ordered.forEach((r) => {
          const atleta = dati.atletiMap.get(r.atletaId);
          const evento = dati.eventiMap.get(r.eventoId);
          const tb = tieBreakSecondi(r);
          const cells = [
            formatDateTime(r.aggiornatoIl || r.inseritoIl),
            evento ? `E${evento.numero} ${evento.nome}` : `Evento ${r.eventoId}`,
            r.eventoId,
            atleta?.nome || `Atleta eliminato (${r.atletaId})`,
            NOMI_CATEGORIE[r.categoriaId] || r.categoriaId || "",
            atleta?.box || "",
            atleta?.contatto || "",
            atleta ? (atleta.presente === false ? "Assente" : "Presente") : "Atleta eliminato",
            formatValoreRisultato(r, evento),
            isDnfRisultato(r) ? "SI" : "",
            r.valore ?? "",
            r.valoreSecondario ?? "",
            tb === null ? "" : secondiATempo(tb),
            tb === null ? "" : tb,
            Number(r.puntiEpi || 0).toFixed(1),
            r.aggiornatoDa || "",
            r.inseritoDa || "",
            r.sovrascrittoDa || "",
            r.precedente?.puntiEpi ?? ""
          ].map(csvSafe);
          csv += cells.join(";") + "\n";
        });

        downloadCsv(csv, `risultati-completi-${nowStr()}.csv`);
        showToast(`📥 Backup risultati esportato (${ordered.length} righe)`);
      } catch (err) {
        console.error(err);
        alert("Errore export risultati: " + (err.code || err.message));
      } finally {
        btnExportRisultati.disabled = false;
      }
    };
  }

  async function aggiornaOutputOrfani() {
    if (!orfaniOutput) return [];
    orfaniOutput.classList.add("is-visible");
    orfaniOutput.textContent = "Controllo risultati orfani in corso...";
    const dati = await caricaDatiRisultatiAdmin();
    const orfani = risultatiOrfani(dati);
    orfaniOutput.textContent = descriviRisultatiOrfani(orfani, dati);
    return orfani;
  }

  if (btnScanOrfani) {
    btnScanOrfani.onclick = async () => {
      btnScanOrfani.disabled = true;
      try {
        await aggiornaOutputOrfani();
      } catch (err) {
        if (orfaniOutput) {
          orfaniOutput.classList.add("is-visible");
          orfaniOutput.textContent = "Errore controllo orfani: " + (err.code || err.message);
        }
      } finally {
        btnScanOrfani.disabled = false;
      }
    };
  }

  if (btnDeleteOrfani) {
    btnDeleteOrfani.onclick = async () => {
      btnDeleteOrfani.disabled = true;
      try {
        const dati = await caricaDatiRisultatiAdmin();
        const orfani = risultatiOrfani(dati);
        if (orfaniOutput) {
          orfaniOutput.classList.add("is-visible");
          orfaniOutput.textContent = descriviRisultatiOrfani(orfani, dati);
        }
        if (orfani.length === 0) {
          showToast("Nessun risultato orfano da eliminare");
          return;
        }
        if (!confirm(`Eliminare definitivamente ${orfani.length} risultati collegati ad atleti eliminati?\n\nPrima di procedere, se ti serve archivio, scarica "Backup risultati completo". Questa operazione rimuove anche la copia pubblica usata da live/podio.`)) return;
        const eliminati = await eliminaRisultatiOrfani(orfani);
        if (orfaniOutput) {
          orfaniOutput.classList.add("is-visible");
          orfaniOutput.textContent = `Pulizia completata.\nRisultati orfani eliminati: ${eliminati}\nStorico e copia pubblica aggiornati.`;
        }
        showToast(`Pulizia completata: ${eliminati} risultati eliminati`);
        aggiornaAuditRisultati();
      } catch (err) {
        console.error(err);
        if (orfaniOutput) {
          orfaniOutput.classList.add("is-visible");
          orfaniOutput.textContent = "Errore pulizia orfani: " + (err.code || err.message);
        }
        alert("Errore pulizia orfani: " + (err.code || err.message));
      } finally {
        btnDeleteOrfani.disabled = false;
      }
    };
  }

  // Sincronizza copia pubblica senza contatti
  if (btnSyncPubblici) {
    btnSyncPubblici.onclick = async () => {
      btnSyncPubblici.disabled = true;
      if (syncPubbliciOutput) {
        syncPubbliciOutput.classList.add("is-visible");
        syncPubbliciOutput.textContent = "Sincronizzazione in corso...";
      }
      try {
        await syncAtletiPubblici({ outputEl: syncPubbliciOutput });
      } catch (err) {
        if (syncPubbliciOutput) {
          syncPubbliciOutput.classList.add("is-visible");
          syncPubbliciOutput.textContent = "Errore: " + (err.code || err.message);
        }
      } finally {
        btnSyncPubblici.disabled = false;
      }
    };
  }

  // Sincronizza copia pubblica dei risultati senza dati giudici/storico
  if (btnSyncRisultatiPubblici) {
    btnSyncRisultatiPubblici.onclick = async () => {
      btnSyncRisultatiPubblici.disabled = true;
      if (syncRisultatiPubbliciOutput) {
        syncRisultatiPubbliciOutput.classList.add("is-visible");
        syncRisultatiPubbliciOutput.textContent = "Sincronizzazione risultati in corso...";
      }
      try {
        await syncRisultatiPubblici({ outputEl: syncRisultatiPubbliciOutput });
      } catch (err) {
        if (syncRisultatiPubbliciOutput) {
          syncRisultatiPubbliciOutput.classList.add("is-visible");
          syncRisultatiPubbliciOutput.textContent = "Errore: " + (err.code || err.message);
        }
      } finally {
        btnSyncRisultatiPubblici.disabled = false;
      }
    };
  }

  // Statistiche
  btnStats.onclick = async () => {
    statsOutput.classList.add("is-visible");
    statsOutput.textContent = "Caricamento...";
    try {
      const [atletiSnap, risSnap, iscrSnap] = await Promise.all([
        getDocs(collection(db, COL.atleti)),
        getDocs(collection(db, COL.risultati)),
        getDocs(collection(db, COL.iscrizioni))
      ]);
      const atleti = atletiSnap.docs.map((d) => d.data());
      const perCat = {};
      atleti.forEach((a) => {
        perCat[a.categoriaId] = (perCat[a.categoriaId] || 0) + 1;
      });
      const eventiCompilati = new Set(risSnap.docs.map((d) => d.data().eventoId));

      let lines = [
        `=== Statistiche TUSK Protocol ===`,
        ``,
        `Atleti totali: ${atleti.length}`,
      ];
      Object.keys(NOMI_CATEGORIE).forEach((cat) => {
        const n = perCat[cat] || 0;
        if (n > 0) lines.push(`  · ${NOMI_CATEGORIE[cat]}: ${n}`);
      });
      lines.push(``);
      lines.push(`Iscrizioni pending: ${iscrSnap.size}`);
      lines.push(`Risultati registrati: ${risSnap.size}`);
      lines.push(`Eventi con almeno un risultato: ${eventiCompilati.size}/10`);
      statsOutput.textContent = lines.join("\n");
    } catch (err) {
      statsOutput.textContent = "Errore: " + (err.code || err.message);
    }
  };
}

function csvSafe(s) {
  const v = String(s || "");
  if (/[;"\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function downloadCsv(content, filename) {
  // BOM UTF-8 per Excel italiano
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
}

// =====================================================
// HELPER
// =====================================================
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(str) {
  return escapeHtml(str);
}

async function copyText(text, successMsg) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg || "Copiato");
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast(successMsg || "Copiato");
  }
}

function showToast(msg, kind = "ok") {
  const t = document.createElement("div");
  t.className = "toast" + (kind === "err" ? " toast--err" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("is-visible"));
  setTimeout(() => {
    t.classList.remove("is-visible");
    setTimeout(() => t.remove(), 300);
  }, 2500);
}
