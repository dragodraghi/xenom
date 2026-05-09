// podio.js — Pagina premiazione TUSK Protocol: top 3 per categoria
import { db, COL } from "./firebase-config.js";
import { totaleEpiAtleta } from "./epi-formulas.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const NOMI_CATEGORIE = {
  ultimate:     { nome: "Ultimate",     gender: "M" },
  advanced:     { nome: "Advanced",     gender: "M" },
  challenge:    { nome: "Challenge",    gender: "M" },
  essential:    { nome: "Essential",    gender: "M" },
  performance:  { nome: "Performance",  gender: "F" },
  intermediate: { nome: "Intermediate", gender: "F" }
};

const tabs = document.querySelectorAll(".podio-tab");
const stage = document.getElementById("podio-stage");
const status = document.getElementById("podio-status");
const catName = document.getElementById("podio-cat-name");
const catSub = document.getElementById("podio-cat-sub");
const emptyBox = document.getElementById("podio-empty");

let categoriaCorrente = "ultimate";
let atletiCache = [];
let risultatiCache = [];
let atletiLoaded = false;
let risultatiLoaded = false;

// === Auto-rotation (?rotate=N) ===
const rotateParam = new URLSearchParams(window.location.search).get("rotate");
const rotateSeconds = rotateParam ? Math.max(3, parseInt(rotateParam, 10) || 0) : 0;
const ROTATE_PAUSE_MS = 30_000;
let rotateTimer = null;
let rotatePausedUntil = 0;

// === Listener atleti pubblici ===
const unsubAtleti = onSnapshot(
  query(collection(db, COL.atletiPubblici), orderBy("nome", "asc")),
  (snap) => {
    atletiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    atletiLoaded = true;
    render();
  },
  (err) => {
    console.error("Errore atleti:", err);
    setStatus(`Errore: ${err.code || err.message}`);
  }
);

// === Listener risultati ===
const unsubRisultati = onSnapshot(
  collection(db, COL.risultati),
  (snap) => {
    risultatiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    risultatiLoaded = true;
    render();
  },
  (err) => {
    console.error("Errore risultati:", err);
    setStatus(`Errore: ${err.code || err.message}`);
  }
);

// === Tab switching ===
tabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    categoriaCorrente = tab.dataset.cat;
    render();
    if (e.isTrusted && rotateSeconds > 0) {
      rotatePausedUntil = Date.now() + ROTATE_PAUSE_MS;
    }
  });
});

if (rotateSeconds > 0) {
  rotateTimer = setInterval(() => {
    if (Date.now() < rotatePausedUntil) return;
    if (document.hidden) return;
    const tabsArr = Array.from(tabs);
    const currentIdx = tabsArr.findIndex((t) => t.classList.contains("is-active"));
    const nextIdx = (currentIdx + 1) % tabsArr.length;
    tabsArr[nextIdx].click();
  }, rotateSeconds * 1000);
}

// === Render ===
function render() {
  const meta = NOMI_CATEGORIE[categoriaCorrente];
  catName.textContent = meta ? `${meta.nome} (${meta.gender})` : "—";
  catSub.textContent = "Top 3 — TUSK Protocol Bad Boars Edition";

  if (!atletiLoaded || !risultatiLoaded) {
    setStatus("Caricamento…");
    return;
  }

  const atletiCategoria = atletiCache.filter((a) => a.categoriaId === categoriaCorrente);

  if (atletiCategoria.length === 0) {
    showEmpty(true, "Nessun atleta classificato in questa categoria.");
    return;
  }

  // Aggrega punti EPI per atleta
  const aggregato = atletiCategoria.map((a) => {
    const punti = risultatiCache
      .filter((r) => r.atletaId === a.id)
      .map((r) => ({ puntiEpi: r.puntiEpi }));
    return { atleta: a, totale: totaleEpiAtleta(punti), eventi: punti.length };
  });

  // Tieni solo chi ha almeno un risultato
  const classificati = aggregato.filter((x) => x.eventi > 0);

  if (classificati.length === 0) {
    showEmpty(true, "In attesa dei primi risultati per questa categoria.");
    return;
  }

  // Ordina desc, tie-breaker per nome
  classificati.sort((x, y) => {
    if (y.totale !== x.totale) return y.totale - x.totale;
    return x.atleta.nome.localeCompare(y.atleta.nome, "it");
  });

  const top3 = classificati.slice(0, 3);
  showEmpty(false);

  // Render: gli slot sono sempre 3 (gold center, silver left, bronze right).
  // Se ci sono meno di 3 atleti, riempi i mancanti con placeholder vuoti.
  const slots = [
    { rank: 1, data: top3[0] },
    { rank: 2, data: top3[1] },
    { rank: 3, data: top3[2] }
  ];

  slots.forEach((s) => {
    const card = stage.querySelector(`.podio-card[data-rank="${s.rank}"]`);
    if (!card) return;
    const nomeEl = card.querySelector(".podio-card__nome");
    const boxEl = card.querySelector(".podio-card__box");
    const epiEl = card.querySelector(".podio-card__epi");
    if (s.data) {
      nomeEl.textContent = s.data.atleta.nome;
      boxEl.textContent = s.data.atleta.box || "—";
      epiEl.textContent = `${formatEpi(s.data.totale)} pt · ${s.data.eventi}/10 eventi`;
      card.classList.remove("is-empty");
    } else {
      nomeEl.textContent = "—";
      boxEl.textContent = "—";
      epiEl.textContent = "—";
      card.classList.add("is-empty");
    }
  });

  setStatus(`${classificati.length} atleti classificati · ${rotateSeconds > 0 ? "rotazione " + rotateSeconds + "s" : "live"}`);
}

function showEmpty(isEmpty, msg = "") {
  if (isEmpty) {
    stage.hidden = true;
    emptyBox.hidden = false;
    if (msg) emptyBox.textContent = msg;
    setStatus("In attesa dati…");
  } else {
    stage.hidden = false;
    emptyBox.hidden = true;
  }
}

function setStatus(text) {
  status.innerHTML = `<span class="live-dot"></span>${escapeHtml(text)}`;
}

function formatEpi(n) {
  return Number(n || 0).toLocaleString("it-IT", { maximumFractionDigits: 1 });
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.addEventListener("beforeunload", () => {
  try { unsubAtleti(); } catch (e) {}
  try { unsubRisultati(); } catch (e) {}
  if (rotateTimer) clearInterval(rotateTimer);
});
