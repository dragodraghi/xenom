import { db, auth, COL, isAdminLoggedIn, onAdminAuthChange } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const CHECKS = [
  { id: "browser", title: "Browser e rete", detail: "Stato connessione del dispositivo." },
  { id: "categorie", title: "Categorie", detail: "Lettura pubblica delle 6 categorie gara." },
  { id: "eventi", title: "Eventi", detail: "Lettura pubblica dei 10 eventi e benchmark." },
  { id: "live", title: "Live data", detail: "Lettura copie pubbliche per classifica e podio." },
  { id: "iscrizioni", title: "Stato iscrizioni", detail: "Lettura riepilogo pubblico slot e pending." },
  { id: "admin", title: "Sessione admin", detail: "Verifica accesso privato se hai gia fatto login." }
];

const grid = document.getElementById("check-grid");
const summaryEl = document.getElementById("health-summary");
const timeEl = document.getElementById("health-time");
const latencyEl = document.getElementById("health-latency");
const reportEl = document.getElementById("health-report");
const btnRun = document.getElementById("btn-run");
const btnCopy = document.getElementById("btn-copy");

let lastReport = "";

function renderCards() {
  grid.innerHTML = CHECKS.map((check) => `
    <article class="check-card" id="check-${check.id}" data-status="idle">
      <div class="check-card__top">
        <h3>${escapeHtml(check.title)}</h3>
        <span class="dot" aria-hidden="true"></span>
      </div>
      <p>${escapeHtml(check.detail)}</p>
    </article>
  `).join("");
}

function setCard(id, status, detail) {
  const card = document.getElementById(`check-${id}`);
  if (!card) return;
  card.dataset.status = status;
  const p = card.querySelector("p");
  if (p) p.textContent = detail;
}

function nowLabel() {
  return new Date().toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms))
  ]);
}

async function countCollection(name, maxDocs = 500) {
  const snap = await getDocs(query(collection(db, name), limit(maxDocs)));
  return snap.size;
}

function waitAuthReady() {
  return new Promise((resolve) => {
    let unsub = () => {};
    unsub = onAdminAuthChange((user) => {
      try { unsub(); } catch (e) {}
      resolve(user);
    });
  });
}

async function runCheck(check) {
  setCard(check.id, "idle", "Controllo in corso...");
  const started = performance.now();
  try {
    const result = await withTimeout(executeCheck(check.id), 9000, check.title);
    const elapsed = Math.round(performance.now() - started);
    setCard(check.id, result.status, `${result.message} (${elapsed}ms)`);
    return { ...check, ...result, elapsed };
  } catch (err) {
    setCard(check.id, "fail", `${err.code || err.message}`);
    return { ...check, status: "fail", message: err.code || err.message, elapsed: Math.round(performance.now() - started) };
  }
}

async function executeCheck(id) {
  if (id === "browser") {
    if (!navigator.onLine) return { status: "fail", message: "Dispositivo offline secondo il browser" };
    return { status: "ok", message: "Browser online" };
  }

  if (id === "categorie") {
    const n = await countCollection(COL.categorie, 20);
    return n >= 6
      ? { status: "ok", message: `${n} categorie leggibili` }
      : { status: "warn", message: `${n}/6 categorie leggibili` };
  }

  if (id === "eventi") {
    // Esclude i doc di config (es. _config_iscrizioni) — solo doc con numero 1-10 sono eventi reali
    const snap = await getDocs(query(collection(db, COL.eventi), limit(30)));
    const eventi = snap.docs.filter((d) => {
      const data = d.data();
      return Number.isFinite(data.numero) && data.numero >= 1 && data.numero <= 10;
    });
    const n = eventi.length;
    return n === 10
      ? { status: "ok", message: `${n} eventi leggibili (numero 1-10)` }
      : { status: "fail", message: `${n}/10 eventi numerati (esclusi doc config). Atteso esattamente 10.` };
  }

  if (id === "live") {
    const [atleti, risultati] = await Promise.all([
      countCollection(COL.atletiPubblici),
      countCollection(COL.risultatiPubblici)
    ]);
    return { status: "ok", message: `${atleti} atleti pubblici, ${risultati} risultati pubblici leggibili` };
  }

  if (id === "iscrizioni") {
    const snap = await getDoc(doc(db, COL.iscrizioniStatoPubblico, "_summary"));
    return snap.exists()
      ? { status: "ok", message: "Riepilogo iscrizioni pubblicato" }
      : { status: "warn", message: "Riepilogo iscrizioni non ancora pubblicato" };
  }

  if (id === "admin") {
    await waitAuthReady();
    if (!auth.currentUser) return { status: "warn", message: "Non sei loggato in questa tab" };
    if (!isAdminLoggedIn()) return { status: "fail", message: `Login non admin: ${auth.currentUser.email || auth.currentUser.uid}` };
    const [atleti, pending] = await Promise.all([
      countCollection(COL.atleti),
      countCollection(COL.iscrizioni)
    ]);
    return { status: "ok", message: `Admin ok: ${atleti} atleti privati, ${pending} pending` };
  }

  return { status: "warn", message: "Controllo non configurato" };
}

async function runAll() {
  btnRun.disabled = true;
  summaryEl.textContent = "Controllo in corso";
  latencyEl.textContent = "-";
  const started = performance.now();
  const results = [];

  for (const check of CHECKS) {
    results.push(await runCheck(check));
  }

  const elapsed = Math.round(performance.now() - started);
  const failures = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warn").length;
  summaryEl.textContent = failures ? `${failures} errore/i` : warnings ? `${warnings} avviso/i` : "Tutto operativo";
  timeEl.textContent = nowLabel();
  latencyEl.textContent = `${elapsed}ms totali`;

  lastReport = [
    `TUSK Protocol health-check - ${timeEl.textContent}`,
    `Esito: ${summaryEl.textContent}`,
    "",
    ...results.map((r) => `[${r.status.toUpperCase()}] ${r.title}: ${r.message} (${r.elapsed}ms)`)
  ].join("\n");
  reportEl.textContent = lastReport;
  btnRun.disabled = false;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

btnRun.addEventListener("click", runAll);
btnCopy.addEventListener("click", async () => {
  if (!lastReport) await runAll();
  try {
    await navigator.clipboard.writeText(lastReport);
    btnCopy.textContent = "Copiato";
    setTimeout(() => { btnCopy.textContent = "Copia report"; }, 1400);
  } catch (err) {
    reportEl.textContent = `${lastReport}\n\nCopia automatica non riuscita: ${err.message}`;
  }
});

renderCards();
runAll();
