// Test automatizzato delle formule EPI
// Esegui con: node tests/epi-formulas.test.mjs
// Exit code 0 = tutti i test passano, 1 = almeno un fallimento.

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
  // Tolleranza 0.05 per arrotondamenti floating point
  const ok = typeof expected === "number"
    ? Math.abs(actual - expected) < 0.05
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

console.log("\n=== TEST: calcolaEpi (weight, higher = better) ===");
const evSnatch = { scoringDirection: "higher", benchmarks: { ultimate: 130, performance: 75 } };
assertEqual(calcolaEpi(100, evSnatch, "ultimate"), 769.2, "Snatch 100kg, Ultimate (bm 130) -> 769.2");
assertEqual(calcolaEpi(130, evSnatch, "ultimate"), 1000.0, "Snatch 130kg, Ultimate (bm 130) -> 1000");
assertEqual(calcolaEpi(140, evSnatch, "ultimate"), 1076.9, "Snatch 140kg, Ultimate (bm 130) -> 1076.9 (oltre elite)");
assertEqual(calcolaEpi(75, evSnatch, "performance"), 1000.0, "Snatch 75kg, Performance (bm 75) -> 1000");

console.log("\n=== TEST: calcolaEpi (time, lower = better) ===");
const evRun = { scoringDirection: "lower", benchmarks: { performance: 1080, ultimate: 900 } };
assertEqual(calcolaEpi(1200, evRun, "performance"), 900.0, "Run 1200s, Performance (bm 1080) -> 900");
assertEqual(calcolaEpi(1080, evRun, "performance"), 1000.0, "Run 1080s, Performance (bm 1080) -> 1000");
assertEqual(calcolaEpi(960, evRun, "performance"), 1125.0, "Run 960s, Performance (bm 1080) -> 1125 (oltre elite)");
assertEqual(calcolaEpi(900, evRun, "ultimate"), 1000.0, "Run 900s, Ultimate (bm 900) -> 1000");

console.log("\n=== TEST: calcolaEpi (reps, calories) ===");
const evReps = { scoringDirection: "higher", benchmarks: { ultimate: 60 } };
assertEqual(calcolaEpi(45, evReps, "ultimate"), 750.0, "Reps 45/60 -> 750");
const evCal = { scoringDirection: "higher", benchmarks: { ultimate: 35 } };
assertEqual(calcolaEpi(28, evCal, "ultimate"), 800.0, "Cal 28/35 -> 800");

console.log("\n=== TEST: calcolaEpi (edge cases) ===");
assertEqual(calcolaEpi(0, evSnatch, "ultimate"), 0, "Performance 0 -> 0 punti");
assertEqual(calcolaEpi(-50, evSnatch, "ultimate"), 0, "Performance negativa -> 0 punti");
assertEqual(calcolaEpi(100, evSnatch, "categoria_inesistente"), 0, "Categoria inesistente -> 0 punti");
assertEqual(calcolaEpi(100, null, "ultimate"), 0, "Evento null -> 0 punti");
assertEqual(calcolaEpi(100, { benchmarks: null }, "ultimate"), 0, "benchmarks null -> 0 punti");
assertEqual(calcolaEpi(100, { scoringDirection: "higher", benchmarks: { ultimate: 0 } }, "ultimate"), 0, "Benchmark 0 -> 0 punti");
assertEqual(calcolaEpi(100, { scoringDirection: "higher", benchmarks: { ultimate: -10 } }, "ultimate"), 0, "Benchmark negativo -> 0 punti");
assertEqual(calcolaEpi(null, evSnatch, "ultimate"), 0, "Performance null -> 0 punti");
assertEqual(calcolaEpi(undefined, evSnatch, "ultimate"), 0, "Performance undefined -> 0 punti");

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
// Nota: con repsPerRound=0 la formula round*0+extra=extra, comportamento atteso (caso edge non realistico in produzione)
assertEqual(roundsRepsAReps(3, 5, 0), 5, "repsPerRound=0 (config invalido) -> ritorna solo reps extra");
assertEqual(roundsRepsAReps("5", "12", "30"), 162, "Input stringa parsato correttamente");

console.log("\n=== TEST: totaleEpiAtleta ===");
assertEqual(totaleEpiAtleta([{ puntiEpi: 769.2 }, { puntiEpi: 900 }, { puntiEpi: 1000 }]), 2669.2, "3 risultati -> somma 2669.2");
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
