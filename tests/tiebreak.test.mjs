// Test della logica Tie-break per la classifica live e podio.
// Replica le funzioni di sort di js/live.js e js/podio.js, verifica
// che lo spareggio funzioni in 5 scenari chiave.
//
// Esegui con: node tests/tiebreak.test.mjs
// Exit code 0 = pass, 1 = almeno un fallimento.

import { totaleEpiAtleta } from "../js/epi-formulas.js";

let passed = 0;
let failed = 0;
const fails = [];

function assert(condition, descr) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${descr}`);
  } else {
    failed++;
    console.error(`  ✗ ${descr}`);
    fails.push(descr);
  }
}

// === Replica esatta di sommaTieBreak da live.js ===
function sommaTieBreak(perEventoTb) {
  const valori = Object.values(perEventoTb).filter((v) => typeof v === "number" && v > 0);
  if (valori.length === 0) return Infinity;
  return valori.reduce((acc, v) => acc + v, 0);
}

// === Replica esatta del sort di live.js ===
function ordinaClassifica(aggregato) {
  return Object.values(aggregato).sort((x, y) => {
    if (y.totale !== x.totale) return y.totale - x.totale;
    const xTb = sommaTieBreak(x.perEventoTb);
    const yTb = sommaTieBreak(y.perEventoTb);
    if (xTb !== yTb) return xTb - yTb;
    return x.atleta.nome.localeCompare(y.atleta.nome, "it");
  });
}

// === Helper per costruire un atleta ===
function buildAtleta(id, nome, risultati) {
  const perEvento = {};
  const perEventoTb = {};
  for (const r of risultati) {
    perEvento[r.eventoId] = r.puntiEpi;
    if (typeof r.tieBreak === "number" && r.tieBreak > 0) {
      perEventoTb[r.eventoId] = r.tieBreak;
    }
  }
  const punti = Object.values(perEvento).map((p) => ({ puntiEpi: p }));
  return {
    atleta: { id, nome },
    perEvento,
    perEventoTb,
    totale: totaleEpiAtleta(punti)
  };
}

// ============================================================
// TEST 1 — EPI diversi: vince chi ha EPI più alto (T.B. ignorato)
// ============================================================
console.log("\n=== TEST 1: EPI diversi (T.B. non conta) ===");
{
  const aggregato = {
    a1: buildAtleta("a1", "Anna", [
      { eventoId: "1", puntiEpi: 900, tieBreak: 600 },  // T.B. alto
      { eventoId: "2", puntiEpi: 800, tieBreak: 500 }
    ]),
    a2: buildAtleta("a2", "Bruno", [
      { eventoId: "1", puntiEpi: 1000, tieBreak: 100 }, // T.B. basso
      { eventoId: "2", puntiEpi: 900, tieBreak: 50 }
    ])
  };
  const classifica = ordinaClassifica(aggregato);
  assert(classifica[0].atleta.nome === "Bruno", "Bruno (EPI 1900) primo davanti ad Anna (EPI 1700)");
  assert(classifica[0].totale === 1900, "Bruno totale 1900");
  assert(classifica[1].totale === 1700, "Anna totale 1700");
}

// ============================================================
// TEST 2 — EPI uguali, entrambi T.B.: vince chi ha somma T.B. più bassa
// ============================================================
console.log("\n=== TEST 2: EPI uguali, T.B. su entrambi ===");
{
  const aggregato = {
    a1: buildAtleta("a1", "Carlo", [
      { eventoId: "1", puntiEpi: 1000, tieBreak: 300 },
      { eventoId: "2", puntiEpi: 1000, tieBreak: 200 }
    ]),
    a2: buildAtleta("a2", "Diana", [
      { eventoId: "1", puntiEpi: 1000, tieBreak: 250 },
      { eventoId: "2", puntiEpi: 1000, tieBreak: 200 }
    ])
  };
  const classifica = ordinaClassifica(aggregato);
  assert(classifica[0].atleta.nome === "Diana", "Diana primo (T.B. tot 450) davanti a Carlo (T.B. tot 500)");
  assert(classifica[0].totale === 2000 && classifica[1].totale === 2000, "Entrambi EPI 2000");
}

// ============================================================
// TEST 3 — EPI uguali, solo uno ha T.B.: vince chi ha T.B.
// ============================================================
console.log("\n=== TEST 3: EPI uguali, T.B. solo su uno ===");
{
  const aggregato = {
    a1: buildAtleta("a1", "Elena", [
      { eventoId: "1", puntiEpi: 800, tieBreak: 400 }
    ]),
    a2: buildAtleta("a2", "Franco", [
      { eventoId: "1", puntiEpi: 800 } // niente T.B.
    ])
  };
  const classifica = ordinaClassifica(aggregato);
  assert(classifica[0].atleta.nome === "Elena", "Elena primo (T.B. 400) davanti a Franco (nessun T.B. = Infinity)");
}

// ============================================================
// TEST 4 — EPI uguali, nessun T.B.: ordine alfabetico
// ============================================================
console.log("\n=== TEST 4: EPI uguali, nessun T.B. → alfabetico ===");
{
  const aggregato = {
    a1: buildAtleta("a1", "Zoe", [
      { eventoId: "1", puntiEpi: 500 }
    ]),
    a2: buildAtleta("a2", "Andrea", [
      { eventoId: "1", puntiEpi: 500 }
    ])
  };
  const classifica = ordinaClassifica(aggregato);
  assert(classifica[0].atleta.nome === "Andrea", "Andrea primo (alfabetico) davanti a Zoe");
}

// ============================================================
// TEST 5 — Caso completo: 4 atleti, vari scenari
// ============================================================
console.log("\n=== TEST 5: 4 atleti, casi misti ===");
{
  const aggregato = {
    // Gianni: EPI 1500, T.B. tot 200
    g: buildAtleta("g", "Gianni", [
      { eventoId: "1", puntiEpi: 800, tieBreak: 120 },
      { eventoId: "2", puntiEpi: 700, tieBreak: 80 }
    ]),
    // Marco: EPI 1500, T.B. tot 150 → batte Gianni a parità
    m: buildAtleta("m", "Marco", [
      { eventoId: "1", puntiEpi: 900, tieBreak: 90 },
      { eventoId: "2", puntiEpi: 600, tieBreak: 60 }
    ]),
    // Luca: EPI 1600 → primo assoluto
    l: buildAtleta("l", "Luca", [
      { eventoId: "1", puntiEpi: 1000, tieBreak: 500 }, // T.B. alto, irrelevant
      { eventoId: "2", puntiEpi: 600 }
    ]),
    // Sofia: EPI 1500, nessun T.B. → ultima dei tre a 1500
    s: buildAtleta("s", "Sofia", [
      { eventoId: "1", puntiEpi: 750 },
      { eventoId: "2", puntiEpi: 750 }
    ])
  };
  const classifica = ordinaClassifica(aggregato);
  const ordine = classifica.map((c) => c.atleta.nome);
  assert(ordine[0] === "Luca", `1°: Luca (EPI 1600) — atteso "Luca", got "${ordine[0]}"`);
  assert(ordine[1] === "Marco", `2°: Marco (EPI 1500, T.B. 150) — atteso "Marco", got "${ordine[1]}"`);
  assert(ordine[2] === "Gianni", `3°: Gianni (EPI 1500, T.B. 200) — atteso "Gianni", got "${ordine[2]}"`);
  assert(ordine[3] === "Sofia", `4°: Sofia (EPI 1500, nessun T.B.) — atteso "Sofia", got "${ordine[3]}"`);
}

// ============================================================
// TEST 6 — Edge: T.B. = 0 (non deve contare come T.B. valido)
// ============================================================
console.log("\n=== TEST 6: T.B. = 0 trattato come 'nessun T.B.' ===");
{
  const aggregato = {
    a1: buildAtleta("a1", "Tizio", [
      { eventoId: "1", puntiEpi: 700, tieBreak: 0 } // 0 filtrato, conta come nessuno
    ]),
    a2: buildAtleta("a2", "Caio", [
      { eventoId: "1", puntiEpi: 700, tieBreak: 1 } // 1 sec, valido
    ])
  };
  const classifica = ordinaClassifica(aggregato);
  assert(classifica[0].atleta.nome === "Caio", "Caio (T.B. 1s) batte Tizio (T.B. 0 = invalido)");
}

// ============================================================
// RIEPILOGO
// ============================================================
console.log("\n=== RIEPILOGO ===");
console.log(`Test passati: ${passed}`);
console.log(`Test falliti: ${failed}`);
if (failed > 0) {
  console.log("\nFallimenti:");
  fails.forEach((f) => console.log(` - ${f}`));
  process.exit(1);
}
console.log("\n✅ TUTTI I TEST T.B. PASSANO");
process.exit(0);
