// live.js — Classifica EPI realtime per TUSK Protocol
import { db, COL } from "./firebase-config.js";
import { totaleEpiAtleta } from "./epi-formulas.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const tabs = document.querySelectorAll(".live-tab");
const tbody = document.getElementById("live-tbody");
const status = document.getElementById("live-status");
const content = document.getElementById("live-content");
const emptyBox = document.getElementById("live-empty");

let categoriaCorrente = "ultimate";
let atletiCache = [];     // [{id, nome, categoriaId, box}]
let risultatiCache = [];  // [{id, atletaId, eventoId, puntiEpi, ...}]
let prevPosizioni = {};   // {atletaId: posizione precedente} — per animazione is-updated
let atletiLoaded = false;
let risultatiLoaded = false;

// === Listener atleti ===
const unsubAtleti = onSnapshot(
  query(collection(db, COL.atletiPubblici), orderBy("nome", "asc")),
  (snap) => {
    atletiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    atletiLoaded = true;
    render();
  },
  (err) => {
    console.error("Errore listener atleti:", err);
    setStatus(`Errore caricamento atleti: ${err.code || err.message}`);
  }
);

// === Listener risultati ===
const unsubRisultati = onSnapshot(
  collection(db, COL.risultatiPubblici),
  (snap) => {
    risultatiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    risultatiLoaded = true;
    render();
  },
  (err) => {
    console.error("Errore listener risultati:", err);
    setStatus(`Errore caricamento risultati: ${err.code || err.message}`);
  }
);

// === Tab switching ===
tabs.forEach((tab) => {
  tab.addEventListener("click", (e) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    categoriaCorrente = tab.dataset.cat;
    prevPosizioni = {}; // reset per non flashare al cambio tab
    render();
    if (e.isTrusted && rotateSeconds > 0) {
      rotatePausedUntil = Date.now() + ROTATE_PAUSE_MS;
    }
  });
});

// === Auto-rotation per TV/proiettore: ?rotate=10 (secondi) ===
const rotateParam = new URLSearchParams(window.location.search).get("rotate");
const rotateSeconds = rotateParam ? Math.max(3, parseInt(rotateParam, 10) || 0) : 0;
const ROTATE_PAUSE_MS = 30_000; // dopo un click manuale, pausa 30s
let rotateTimer = null;
let rotatePausedUntil = 0;

if (rotateSeconds > 0) {
  rotateTimer = setInterval(() => {
    if (Date.now() < rotatePausedUntil) return;
    if (document.hidden) return; // niente switch se la tab non è visibile
    const tabsArr = Array.from(tabs);
    const currentIdx = tabsArr.findIndex((t) => t.classList.contains("is-active"));
    const nextIdx = (currentIdx + 1) % tabsArr.length;
    tabsArr[nextIdx].click();
  }, rotateSeconds * 1000);
}

// === Render ===
function render() {
  if (!atletiLoaded || !risultatiLoaded) return;

  const atletiCategoria = atletiCache.filter((a) => a.categoriaId === categoriaCorrente);

  if (atletiCategoria.length === 0) {
    content.hidden = true;
    emptyBox.hidden = false;
    setStatus(`0 atleti in categoria · in attesa iscrizioni`);
    tbody.innerHTML = "";
    return;
  }
  content.hidden = false;
  emptyBox.hidden = true;

  // Aggrega risultati per atleta
  const aggregato = {};
  for (const a of atletiCategoria) {
    aggregato[a.id] = { atleta: a, perEvento: {}, totale: 0 };
  }
  for (const r of risultatiCache) {
    if (aggregato[r.atletaId]) {
      aggregato[r.atletaId].perEvento[r.eventoId] = r.puntiEpi;
    }
  }
  for (const id in aggregato) {
    const punti = Object.values(aggregato[id].perEvento).map((p) => ({ puntiEpi: p }));
    aggregato[id].totale = totaleEpiAtleta(punti);
  }

  // Ordina per totale desc, poi per nome asc (stabile)
  const classifica = Object.values(aggregato).sort((x, y) => {
    if (y.totale !== x.totale) return y.totale - x.totale;
    return x.atleta.nome.localeCompare(y.atleta.nome, "it");
  });

  // Status: numero atleti + max eventi compilati
  const eventiCompilati = classifica.reduce((max, x) => Math.max(max, Object.keys(x.perEvento).length), 0);
  setStatus(`${classifica.length} atleti · ${eventiCompilati}/10 eventi monitorati · live`);

  // Render rows
  const newPosizioni = {};
  tbody.innerHTML = "";
  classifica.forEach((row, idx) => {
    const pos = idx + 1;
    newPosizioni[row.atleta.id] = pos;

    const tr = document.createElement("tr");
    if (pos <= 3) tr.classList.add(`is-podio-${pos}`);
    if (prevPosizioni[row.atleta.id] !== undefined && prevPosizioni[row.atleta.id] !== pos) {
      tr.classList.add("is-updated");
    }

    let cells = `
      <td class="live-table__rank">${pos}</td>
      <td class="live-table__atleta">${escapeHtml(row.atleta.nome)}</td>
      <td class="live-table__box">${escapeHtml(row.atleta.box || "—")}</td>
    `;
    for (let n = 1; n <= 10; n++) {
      const punti = row.perEvento[String(n)];
      if (punti !== undefined) {
        cells += `<td class="live-table__ev has-score">${Math.round(punti)}</td>`;
      } else {
        cells += `<td class="live-table__ev live-table__cell-vuota">—</td>`;
      }
    }
    cells += `<td class="live-table__epi">${formatEpi(row.totale)}</td>`;
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });

  prevPosizioni = newPosizioni;
}

function setStatus(text) {
  const rotateInfo = rotateSeconds > 0 ? ` · 🔁 rotazione ${rotateSeconds}s` : "";
  status.innerHTML = `<span class="live-dot"></span>${escapeHtml(text + rotateInfo)}`;
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

// Cleanup su unload
window.addEventListener("beforeunload", () => {
  try { unsubAtleti(); } catch (e) {}
  try { unsubRisultati(); } catch (e) {}
  if (rotateTimer) clearInterval(rotateTimer);
});
