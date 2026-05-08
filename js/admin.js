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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  calcolaEpi,
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

// === Cache condivise tra tab ===
let unsubscribers = [];
let atletiCache = [];   // [{id, nome, categoriaId, box, contatto?}]
let eventiCache = [];   // [{id, numero, nome, scoringType, scoringDirection, repsPerRound, benchmarks}]

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
  initTabIscrizioni();
  initTabAtleti();
  initTabRisultati();
}
function cleanupListeners() {
  unsubscribers.forEach((u) => { try { u(); } catch (e) {} });
  unsubscribers = [];
}

// =====================================================
// TAB ISCRIZIONI
// =====================================================
const listaIscrizioni = document.getElementById("lista-iscrizioni");
const badgeIscrizioni = document.getElementById("badge-iscrizioni");

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
    card.innerHTML = `
      <div class="admin-card__info">
        <div class="admin-card__title">${escapeHtml(data.nome)}</div>
        <div class="admin-card__meta">
          ${escapeHtml(NOMI_CATEGORIE[data.categoriaId] || data.categoriaId)} ·
          ${escapeHtml(data.box)} ·
          <span style="opacity: 0.85;">${escapeHtml(data.contatto)}</span>
          ${noteHtml}
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
  if (!confirm(`Approvare l'iscrizione di ${dati.nome}?\n\nCategoria: ${NOMI_CATEGORIE[dati.categoriaId] || dati.categoriaId}\nBox: ${dati.box}`)) return;
  try {
    const atletaId = crypto.randomUUID();
    await setDoc(doc(db, COL.atleti, atletaId), {
      nome: dati.nome,
      categoriaId: dati.categoriaId,
      box: dati.box,
      contatto: dati.contatto || "",
      createdAt: serverTimestamp()
    });
    await deleteDoc(doc(db, COL.iscrizioni, idPending));
    showToast(`✅ ${dati.nome} approvato`);
  } catch (err) {
    console.error(err);
    alert(`Errore approvazione: ${err.code || err.message}`);
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
      renderAtleti();
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

  countAtleti.textContent = atletiCache.length === filtrati.length
    ? `(${atletiCache.length})`
    : `(${filtrati.length}/${atletiCache.length})`;

  if (filtrati.length === 0) {
    listaAtleti.innerHTML = `<p class="admin-empty">${filtro ? "Nessun atleta trovato." : "Nessun atleta registrato. Aggiungi il primo dal bottone qui sopra o approva un'iscrizione pending."}</p>`;
    return;
  }

  listaAtleti.innerHTML = "";
  filtrati.forEach((a) => {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.innerHTML = `
      <div class="admin-card__info">
        <div class="admin-card__title">${escapeHtml(a.nome)}</div>
        <div class="admin-card__meta">
          ${escapeHtml(NOMI_CATEGORIE[a.categoriaId] || a.categoriaId)} · ${escapeHtml(a.box || "—")}
          ${a.contatto ? `<br><span style="opacity:0.7; font-size:0.85em;">${escapeHtml(a.contatto)}</span>` : ""}
        </div>
      </div>
      <div class="admin-card__actions">
        <button class="btn btn--ghost btn--small" data-action="edit">Modifica</button>
        <button class="btn btn--danger btn--small" data-action="delete">Elimina</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener("click", () => apriModalEditAtleta(a));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => eliminaAtleta(a));
    listaAtleti.appendChild(card);
  });
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
    if (id) {
      await setDoc(doc(db, COL.atleti, id), { nome, categoriaId, box, contatto }, { merge: true });
      showToast(`✅ ${nome} aggiornato`);
    } else {
      const newId = crypto.randomUUID();
      await setDoc(doc(db, COL.atleti, newId), { nome, categoriaId, box, contatto, createdAt: serverTimestamp() });
      showToast(`✅ ${nome} aggiunto`);
    }
    modalAtleta.hidden = true;
  } catch (err) {
    console.error(err);
    alert(`Errore: ${err.code || err.message}`);
  }
});

async function eliminaAtleta(a) {
  if (!confirm(`Eliminare ${a.nome}?\n\nNota: eventuali risultati registrati per questo atleta resteranno orfani in tusk_risultati ma non appariranno in classifica.`)) return;
  try {
    await deleteDoc(doc(db, COL.atleti, a.id));
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
const risEvento = document.getElementById("ris-evento");
const risFormDinamico = document.getElementById("ris-form-dinamico");
const risAnteprima = document.getElementById("ris-anteprima");
const risAnteprimaValore = document.getElementById("ris-anteprima-valore");
const risAnteprimaHint = document.getElementById("ris-anteprima-hint");
const risEsistente = document.getElementById("ris-esistente");
const risEsistenteDetail = document.getElementById("ris-esistente-detail");
const risBtnSalva = document.getElementById("ris-btn-salva");

let atletaCorrente = null;
let eventoCorrente = null;
let risEsistenteCorrente = null;

function initTabRisultati() {
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
    risSuggerimenti.innerHTML = matches.map((a) => `
      <div class="suggerimenti__item" data-id="${escapeAttr(a.id)}">
        <div class="suggerimenti__nome">${escapeHtml(a.nome)}</div>
        <div class="suggerimenti__meta">${escapeHtml(NOMI_CATEGORIE[a.categoriaId] || a.categoriaId)} · ${escapeHtml(a.box || "—")}</div>
      </div>
    `).join("");
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
  risFormDinamico.innerHTML = "";
  risAnteprima.hidden = true;
  risEsistente.hidden = true;
  risBtnSalva.disabled = true;
  risEsistenteCorrente = null;

  if (!atletaCorrente || !eventoCorrente) {
    risFormDinamico.hidden = true;
    return;
  }
  risFormDinamico.hidden = false;

  // Verifica se esiste già un risultato
  const risId = `${atletaCorrente.id}_${eventoCorrente.id}`;
  try {
    const d = await getDoc(doc(db, COL.risultati, risId));
    if (d.exists()) {
      const r = d.data();
      risEsistenteCorrente = r;
      risEsistenteDetail.textContent = ` ${formatValoreEsistente(r, eventoCorrente)} → ${r.puntiEpi} punti EPI ${r.inseritoIl ? "(inserito " + formatTimestamp(r.inseritoIl) + ")" : ""}`;
      risEsistente.hidden = false;
    }
  } catch (err) {
    console.warn("getDoc risultato esistente:", err.code);
  }

  // Genera HTML form in base a scoringType
  const t = eventoCorrente.scoringType;
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
    html = `
      <div class="form__field">
        <label>3. Tempo di completamento</label>
        <div class="form-row">
          <input type="number" id="ris-input-min" min="0" step="1" placeholder="Minuti" data-input inputmode="numeric">
          <input type="number" id="ris-input-sec" min="0" max="59" step="1" placeholder="Secondi" data-input inputmode="numeric">
        </div>
      </div>`;
  } else if (t === "rounds_reps") {
    const rpr = eventoCorrente.repsPerRound || 0;
    html = `
      <div class="form__field">
        <label>3. Round + reps extra (${rpr} reps per round)</label>
        <div class="form-row">
          <input type="number" id="ris-input-round" min="0" step="1" placeholder="Round completati" data-input inputmode="numeric">
          <input type="number" id="ris-input-extra" min="0" step="1" placeholder="Reps extra" data-input inputmode="numeric">
        </div>
      </div>`;
  }
  risFormDinamico.innerHTML = html;
  risFormDinamico.querySelectorAll("[data-input]").forEach((input) => {
    input.addEventListener("input", aggiornaAnteprima);
  });
  // Focus primo input
  const first = risFormDinamico.querySelector("[data-input]");
  if (first) first.focus();
}

function aggiornaAnteprima() {
  if (!atletaCorrente || !eventoCorrente) return;
  const valore = leggiPerformance();
  if (valore === null || valore <= 0) {
    risAnteprima.hidden = true;
    risBtnSalva.disabled = true;
    return;
  }
  const punti = calcolaEpi(valore, eventoCorrente, atletaCorrente.categoriaId);
  risAnteprimaValore.textContent = punti;

  // Hint contestuale (es. "100kg / benchmark 130kg")
  const bm = eventoCorrente.benchmarks ? eventoCorrente.benchmarks[atletaCorrente.categoriaId] : null;
  if (bm) {
    const t = eventoCorrente.scoringType;
    let valStr = String(valore);
    if (t === "time") valStr = secondiATempo(valore);
    let bmStr = String(bm);
    if (t === "time") bmStr = secondiATempo(bm);
    risAnteprimaHint.textContent = `Performance: ${valStr} · Benchmark "1000": ${bmStr}`;
  } else {
    risAnteprimaHint.textContent = "";
  }

  risAnteprima.hidden = false;
  risBtnSalva.disabled = false;
}

function leggiPerformance() {
  const t = eventoCorrente.scoringType;
  if (t === "weight") {
    const v = parseFloat(document.getElementById("ris-input-weight")?.value);
    return isFinite(v) && v > 0 ? v : null;
  }
  if (t === "reps" || t === "calories") {
    const v = parseInt(document.getElementById("ris-input-num")?.value, 10);
    return isFinite(v) && v > 0 ? v : null;
  }
  if (t === "time") {
    const m = document.getElementById("ris-input-min")?.value;
    const s = document.getElementById("ris-input-sec")?.value;
    if (!m && !s) return null;
    const sec = tempoASecondi(m, s);
    return sec > 0 ? sec : null;
  }
  if (t === "rounds_reps") {
    const r = document.getElementById("ris-input-round")?.value;
    const e = document.getElementById("ris-input-extra")?.value;
    if (!r && !e) return null;
    const reps = roundsRepsAReps(r, e, eventoCorrente.repsPerRound);
    return reps > 0 ? reps : null;
  }
  return null;
}

function formatValoreEsistente(r, evento) {
  const t = evento.scoringType;
  if (t === "weight") return `${r.valore} kg`;
  if (t === "reps") return `${r.valore} reps`;
  if (t === "calories") return `${r.valore} cal`;
  if (t === "time") return secondiATempo(r.valore);
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

risBtnSalva.addEventListener("click", async () => {
  if (!atletaCorrente || !eventoCorrente) return;
  const valore = leggiPerformance();
  if (valore === null || valore <= 0) return;

  const t = eventoCorrente.scoringType;
  const valoreSecondario = t === "rounds_reps"
    ? (parseInt(document.getElementById("ris-input-extra")?.value, 10) || 0)
    : null;

  const puntiEpi = calcolaEpi(valore, eventoCorrente, atletaCorrente.categoriaId);
  const risId = `${atletaCorrente.id}_${eventoCorrente.id}`;

  if (risEsistenteCorrente) {
    if (!confirm(`Sovrascrivere il risultato esistente per ${atletaCorrente.nome} su E${eventoCorrente.numero} ${eventoCorrente.nome}?\n\nPrecedente: ${formatValoreEsistente(risEsistenteCorrente, eventoCorrente)} (${risEsistenteCorrente.puntiEpi} pt)\nNuovo: ${puntiEpi} pt`)) return;
  }

  risBtnSalva.disabled = true;
  risBtnSalva.classList.add("is-loading");

  try {
    await setDoc(doc(db, COL.risultati, risId), {
      atletaId: atletaCorrente.id,
      eventoId: eventoCorrente.id,
      categoriaId: atletaCorrente.categoriaId,
      valore: valore,
      valoreSecondario: valoreSecondario,
      puntiEpi: puntiEpi,
      inseritoIl: serverTimestamp(),
      inseritoDa: "admin"
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
    console.error("Errore salvataggio risultato:", err);
    alert(`Errore: ${err.code || err.message}`);
  } finally {
    risBtnSalva.disabled = false;
    risBtnSalva.classList.remove("is-loading");
  }
});

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
