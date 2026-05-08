// admin.js — App admin TUSK Protocol
// Versione M5: login, tab navigation, tab Iscrizioni con approve/reject realtime.
// I tab Atleti / Risultati / Strumenti / Eventi saranno aggiunti in M6/M8.

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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// === DOM ===
const screenLogin = document.getElementById("screen-login");
const screenAdmin = document.getElementById("screen-admin");
const formLogin = document.getElementById("form-login");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const errorPassword = formLogin.querySelector('[data-error-for="password"]');

// === Mappe utili ===
const NOMI_CATEGORIE = {
  ultimate: "Ultimate (M)",
  advanced: "Advanced (M)",
  challenge: "Challenge (M)",
  essential: "Essential (M)",
  performance: "Performance (F)",
  intermediate: "Intermediate (F)"
};

// === Auth ===
let unsubscribers = [];

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
    console.warn("Login fallito:", err.code);
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

btnLogout.addEventListener("click", async () => {
  await logoutAdmin();
});

// === Tab navigation ===
const tabs = document.querySelectorAll(".admin-tab");
const panels = document.querySelectorAll(".admin-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === target));
  });
});

// === App init dopo login ===
function initAdminApp() {
  cleanupListeners();
  initTabIscrizioni();
  // initTabAtleti() — M6
  // initTabRisultati() — M6
  // initTabEventi() — M8
  // initTabStrumenti() — M8
}

function cleanupListeners() {
  unsubscribers.forEach((u) => {
    try { u(); } catch (e) { /* ignore */ }
  });
  unsubscribers = [];
}

// === TAB ISCRIZIONI ===
const listaIscrizioni = document.getElementById("lista-iscrizioni");
const badgeIscrizioni = document.getElementById("badge-iscrizioni");

function initTabIscrizioni() {
  const q = query(collection(db, COL.iscrizioni), orderBy("createdAt", "asc"));
  const unsub = onSnapshot(
    q,
    (snap) => renderIscrizioni(snap),
    (err) => {
      console.error("Errore listener iscrizioni:", err);
      listaIscrizioni.innerHTML = `<p class="admin-empty">Errore caricamento iscrizioni: ${escapeHtml(err.code || err.message)}</p>`;
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

    const noteHtml = data.note
      ? `<br><em style="color: var(--text-muted);">${escapeHtml(data.note)}</em>`
      : "";

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

    card.querySelector('[data-action="approva"]')
      .addEventListener("click", () => approvaIscrizione(d.id, data));
    card.querySelector('[data-action="rifiuta"]')
      .addEventListener("click", () => rifiutaIscrizione(d.id, data.nome));

    listaIscrizioni.appendChild(card);
  });
}

async function approvaIscrizione(idPending, dati) {
  if (!confirm(`Approvare l'iscrizione di ${dati.nome}?\n\n` +
    `Categoria: ${NOMI_CATEGORIE[dati.categoriaId] || dati.categoriaId}\n` +
    `Box: ${dati.box}\n` +
    `Contatto: ${dati.contatto}`)) return;

  try {
    // Genera ID atleta univoco
    const atletaId = crypto.randomUUID();

    // Crea documento atleta
    await setDoc(doc(db, COL.atleti, atletaId), {
      nome: dati.nome,
      categoriaId: dati.categoriaId,
      box: dati.box,
      contatto: dati.contatto || "",
      createdAt: serverTimestamp()
    });

    // Elimina dalla lista pending
    await deleteDoc(doc(db, COL.iscrizioni, idPending));

    showToast(`✅ ${dati.nome} approvato`);
  } catch (err) {
    console.error("Errore approvazione:", err);
    alert(`Errore durante l'approvazione: ${err.code || err.message}`);
  }
}

async function rifiutaIscrizione(idPending, nome) {
  if (!confirm(`Rifiutare e cancellare l'iscrizione di ${nome}?\nQuesta azione è irreversibile.`)) return;

  try {
    await deleteDoc(doc(db, COL.iscrizioni, idPending));
    showToast(`✕ ${nome} rifiutato`, "err");
  } catch (err) {
    console.error("Errore rifiuto:", err);
    alert(`Errore: ${err.code || err.message}`);
  }
}

// === Helper ===
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
