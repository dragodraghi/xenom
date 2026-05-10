// Test automatizzato delle formule EPI
// Esegui con: node tests/epi-formulas.test.mjs
// Exit code 0 = tutti i test passano, 1 = almeno un fallimento.
//
// La formula EPI usa una curva di potenza decathlon-style:
//   higher: punti = 1000 * ((perf - B) / (bm - B))^C
//   lower:  punti = 1000 * ((B - time) / (B - bm))^C
// con B = soglia zero (sotto bm) o tetto (sopra bm), C < 1 per saturazione.

import {
  calcolaEpi,
  tempoASecondi,
  secondiATempo,
  roundsRepsAReps,
  totaleEpiAtleta
} from "../js/epi-formulas.js";

let passed = 0;
let failed = 0;
const fails = [];

function assertEqual(actual, expected, descr) {
  // Tolleranza 0.5 pt (la curva di potenza ha decimali sensibili)
  const ok = typeof expected === "number"
    ? Math.abs(actual - expected) < 0.5
    : actual === expected;
  if (ok) {
    passed++;
    console.log(`  ✓ ${descr}`);
  } else {
    failed++;
    const msg = `  ✗ ${descr}\n      atteso: ${expected}\n      ottenuto: ${actual}`;
    console.error(msg);
    fails.push(descr);
  }
}

console.log("\n=== TEST: calcolaEpi (weight, higher) — curva C=0.55, B=20% bm ===");
const evSnatch = { scoringType: "weight", scoringDirection: "higher", benchmarks: { ultimate: 130, performance: 75 } };
assertEqual(calcolaEpi(130, evSnatch, "ultimate"), 1000.0, "Snatch 130kg, Ultimate (bm 130) -> 1000 esatti");
assertEqual(calcolaEpi(75, evSnatch, "performance"), 1000.0, "Snatch 75kg, Performance (bm 75) -> 1000 esatti");
assertEqual(calcolaEpi(100, evSnatch, "ultimate"), 829.3, "Snatch 100kg, Ult bm=130 -> 829 (era 769 lineare)");
assertEqual(calcolaEpi(140, evSnatch, "ultimate"), 1051.8, "Snatch 140kg -> 1052 (era 1077 lineare, oltre elite più gentile)");
assertEqual(calcolaEpi(160, evSnatch, "ultimate"), 1149.6, "Snatch 160kg -> 1150 (saturazione visibile)");
assertEqual(calcolaEpi(200, evSnatch, "ultimate"), 1327.2, "Snatch 200kg -> 1327 (era 1538 lineare)");
assertEqual(calcolaEpi(260, evSnatch, "ultimate"), 1562.1, "Snatch 260kg (2x bm) -> 1562 (era 2000 lineare!)");
assertEqual(calcolaEpi(65, evSnatch, "ultimate"), 583.1, "Snatch 65kg (50% bm) -> 583 (era 500 lineare)");
assertEqual(calcolaEpi(26, evSnatch, "ultimate"), 0, "Snatch 26kg (= soglia 20% bm) -> 0");
assertEqual(calcolaEpi(20, evSnatch, "ultimate"), 0, "Snatch 20kg (sotto soglia) -> 0");

console.log("\n=== TEST: calcolaEpi (time, lower) — curva C=0.55, B=2.5x bm ===");
const evRun = { scoringType: "time", scoringDirection: "lower", benchmarks: { performance: 1080, ultimate: 900 } };
assertEqual(calcolaEpi(1080, evRun, "performance"), 1000.0, "Run 1080s, Perf (bm 1080) -> 1000 esatti");
assertEqual(calcolaEpi(900, evRun, "ultimate"), 1000.0, "Run 900s, Ult (bm 900) -> 1000 esatti");
assertEqual(calcolaEpi(1200, evRun, "performance"), 958.6, "Run 1200s vs bm 1080 -> 959 (era 900 lineare)");
assertEqual(calcolaEpi(960, evRun, "performance"), 1040.1, "Run 960s vs bm 1080 -> 1040 (era 1125 lineare)");
assertEqual(calcolaEpi(540, evRun, "performance"), 1171.4, "Run 540s (½ bm) vs bm 1080 -> 1171 (era 2000 lineare!)");
assertEqual(calcolaEpi(2160, evRun, "performance"), 546.5, "Run 2160s (2x bm) vs bm 1080 -> 547 (era 500 lineare)");
assertEqual(calcolaEpi(2700, evRun, "performance"), 0, "Run 2700s (= tetto 2.5x bm) -> 0");
assertEqual(calcolaEpi(3000, evRun, "performance"), 0, "Run 3000s (oltre tetto) -> 0");

console.log("\n=== TEST: calcolaEpi (reps, higher) — curva C=0.65, B=0 ===");
const evReps = { scoringType: "reps", scoringDirection: "higher", benchmarks: { ultimate: 60 } };
assertEqual(calcolaEpi(60, evReps, "ultimate"), 1000.0, "Reps 60/60 -> 1000 esatti");
assertEqual(calcolaEpi(45, evReps, "ultimate"), 829.4, "Reps 45/60 -> 829 (era 750 lineare)");
assertEqual(calcolaEpi(30, evReps, "ultimate"), 637.3, "Reps 30/60 (½) -> 637 (era 500 lineare)");
assertEqual(calcolaEpi(90, evReps, "ultimate"), 1301.5, "Reps 90/60 (1.5x) -> 1301 (era 1500 lineare)");
assertEqual(calcolaEpi(120, evReps, "ultimate"), 1569.2, "Reps 120/60 (2x) -> 1569 (era 2000 lineare)");
assertEqual(calcolaEpi(180, evReps, "ultimate"), 2042.3, "Reps 180/60 (3x irrealistico) -> 2042 (era 3000 lineare)");

console.log("\n=== TEST: calcolaEpi (calories, higher) — curva C=0.60, B=10% bm ===");
const evCal = { scoringType: "calories", scoringDirection: "higher", benchmarks: { ultimate: 35 } };
assertEqual(calcolaEpi(35, evCal, "ultimate"), 1000.0, "Cal 35/35 -> 1000 esatti");
assertEqual(calcolaEpi(28, evCal, "ultimate"), 859.7, "Cal 28/35 -> 860 (era 800 lineare)");
assertEqual(calcolaEpi(50, evCal, "ultimate"), 1263.2, "Cal 50/35 (1.43x) -> 1263 (era 1429 lineare)");
assertEqual(calcolaEpi(3, evCal, "ultimate"), 0, "Cal 3 (sotto soglia 10%) -> 0");

console.log("\n=== TEST: calcolaEpi (rounds_reps, higher) — stesso C=0.65 dei reps ===");
const evRoundsReps = { scoringType: "rounds_reps", scoringDirection: "higher", benchmarks: { ultimate: 180 } };
assertEqual(calcolaEpi(180, evRoundsReps, "ultimate"), 1000.0, "RR 180/180 -> 1000 esatti");
assertEqual(calcolaEpi(150, evRoundsReps, "ultimate"), 888.2, "RR 150/180 -> 888");
assertEqual(calcolaEpi(240, evRoundsReps, "ultimate"), 1205.6, "RR 240/180 (1.33x) -> 1206");

console.log("\n=== TEST: calcolaEpi (edge cases) ===");
assertEqual(calcolaEpi(0, evSnatch, "ultimate"), 0, "Performance 0 -> 0");
assertEqual(calcolaEpi(-50, evSnatch, "ultimate"), 0, "Performance negativa -> 0");
assertEqual(calcolaEpi(100, evSnatch, "categoria_inesistente"), 0, "Categoria inesistente -> 0");
assertEqual(calcolaEpi(100, null, "ultimate"), 0, "Evento null -> 0");
assertEqual(calcolaEpi(100, { benchmarks: null }, "ultimate"), 0, "benchmarks null -> 0");
assertEqual(calcolaEpi(100, { scoringType: "weight", scoringDirection: "higher", benchmarks: { ultimate: 0 } }, "ultimate"), 0, "Benchmark 0 -> 0");
assertEqual(calcolaEpi(100, { scoringType: "weight", scoringDirection: "higher", benchmarks: { ultimate: -10 } }, "ultimate"), 0, "Benchmark negativo -> 0");
assertEqual(calcolaEpi(100, { scoringType: "weight", scoringDirection: "invalid", benchmarks: { ultimate: 100 } }, "ultimate"), 0, "Direzione scoring non valida -> 0");
assertEqual(calcolaEpi(null, evSnatch, "ultimate"), 0, "Performance null -> 0");
assertEqual(calcolaEpi(undefined, evSnatch, "ultimate"), 0, "Performance undefined -> 0");

console.log("\n=== TEST: tempoASecondi ===");
assertEqual(tempoASecondi(18, 0), 1080, "18:00 -> 1080");
assertEqual(tempoASecondi(20, 30), 1230, "20:30 -> 1230");
assertEqual(tempoASecondi(0, 45), 45, "0:45 -> 45");
assertEqual(tempoASecondi(0, 0), 0, "0:00 -> 0");
assertEqual(tempoASecondi("12", "30"), 750, 'string "12:30" parsato -> 750');
assertEqual(tempoASecondi(-5, 30), 30, "Minuti negativi clampati a 0");
assertEqual(tempoASecondi(NaN, 30), 30, "NaN minuti -> 0");
assertEqual(tempoASecondi(undefined, undefined), 0, "Entrambi undefined -> 0");

console.log("\n=== TEST: secondiATempo ===");
assertEqual(secondiATempo(1230), "20:30", "1230 -> '20:30'");
assertEqual(secondiATempo(60), "1:00", "60 -> '1:00'");
assertEqual(secondiATempo(45), "0:45", "45 -> '0:45'");
assertEqual(secondiATempo(0), "0:00", "0 -> '0:00'");
assertEqual(secondiATempo(3661), "61:01", "3661 -> '61:01'");
assertEqual(secondiATempo(-10), "0:00", "Negativo -> '0:00'");

console.log("\n=== TEST: roundsRepsAReps ===");
assertEqual(roundsRepsAReps(5, 12, 30), 162, "5 round + 12 reps × 30/round -> 162");
assertEqual(roundsRepsAReps(0, 0, 30), 0, "0 round + 0 reps -> 0");
assertEqual(roundsRepsAReps(10, 0, 21), 210, "10 round + 0 reps × 21/round -> 210");
assertEqual(roundsRepsAReps(3, 5, 0), 5, "repsPerRound=0 (config invalido) -> ritorna solo reps extra");
assertEqual(roundsRepsAReps("5", "12", "30"), 162, "Input stringa parsato correttamente");

console.log("\n=== TEST: totaleEpiAtleta ===");
assertEqual(totaleEpiAtleta([{ puntiEpi: 829.4 }, { puntiEpi: 958.5 }, { puntiEpi: 1000 }]), 2787.9, "3 risultati -> somma 2787.9");
assertEqual(totaleEpiAtleta([]), 0, "Array vuoto -> 0");
assertEqual(totaleEpiAtleta(null), 0, "null -> 0");
assertEqual(totaleEpiAtleta([{ puntiEpi: 100 }, { puntiEpi: undefined }, { puntiEpi: 200 }]), 300.0, "Risultati con puntiEpi undefined trattati come 0");

console.log("\n=== RIEPILOGO ===");
console.log(`Test passati: ${passed}`);
console.log(`Test falliti: ${failed}`);
if (failed > 0) {
  console.log("\nFallimenti:");
  fails.forEach((f) => console.log(` - ${f}`));
  process.exit(1);
}
console.log("\n✅ TUTTI I TEST PASSANO");
process.exit(0);
