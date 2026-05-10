// epi-formulas.js — Funzioni pure per calcolo EPI (Elite Performance Index)
// Tutte le funzioni sono pure: stesso input -> stesso output, no side effects.
// Testate in tests/epi-formulas.test.mjs

// Parametri della curva di potenza EPI (stile decathlon IAAF).
// Per ogni scoringType, definiscono:
//  - thresholdRatio (higher): la "soglia zero" come frazione del benchmark.
//    Sotto questa soglia il punteggio è 0 (es. weight: serve almeno 20% del bm per avere punti).
//  - ceilingRatio (lower=time): il "tetto temporale" come multiplo del benchmark.
//    Oltre questo tempo il punteggio è 0 (es. time: a 2.5x il bm = 0 punti).
//  - exponent (C): esponente della curva. C < 1 produce saturazione realistica:
//    record straordinari (≥ 2x elite) saturano a ~1300-1500 pt invece di esplodere.
//
// Calibrato per: benchmark esatto = 1000 pt, oltre elite cresce sub-linearmente,
// sotto elite scende in modo gentile (no zeri a 50% benchmark).
const EPI_CURVE_PARAMS = {
  weight:      { thresholdRatio: 0.20, exponent: 0.55 },
  reps:        { thresholdRatio: 0.00, exponent: 0.65 },
  calories:    { thresholdRatio: 0.10, exponent: 0.60 },
  rounds_reps: { thresholdRatio: 0.00, exponent: 0.65 },
  time:        { ceilingRatio:   2.50, exponent: 0.55 }
};

/**
 * Calcola i punti EPI per una performance usando una curva di potenza decathlon-style.
 * Formula: punti = A * (perf - B)^C  (higher) oppure A * (B - time)^C  (lower)
 * con A calibrato in modo che bm = 1000 pt esatti.
 * @param {number} performance - Valore numerico (kg, secondi, reps, calorie)
 * @param {Object} evento - Documento evento Firestore con scoringType, scoringDirection, benchmarks
 * @param {string} categoriaId - ID categoria atleta (es. "ultimate", "performance")
 * @returns {number} Punti EPI con 1 decimale, 0 se input invalido o sotto/sopra la soglia
 */
export function calcolaEpi(performance, evento, categoriaId) {
  if (!evento || !evento.benchmarks) return 0;
  const benchmark = evento.benchmarks[categoriaId];
  if (!benchmark || benchmark <= 0) return 0;
  if (!performance || performance <= 0) return 0;
  if (!["higher", "lower"].includes(evento.scoringDirection)) return 0;

  const params = EPI_CURVE_PARAMS[evento.scoringType] || EPI_CURVE_PARAMS.reps;
  const C = params.exponent;

  let gain, normalizer;
  if (evento.scoringDirection === "higher") {
    const B = benchmark * (params.thresholdRatio || 0);
    if (performance <= B) return 0;
    gain = performance - B;
    normalizer = benchmark - B;
  } else {
    // time / lower-is-better: B = tetto temporale; oltre B = 0 punti (DNF di fatto)
    const B = benchmark * (params.ceilingRatio || 2.5);
    if (performance >= B) return 0;
    gain = B - performance;
    normalizer = B - benchmark;
  }

  if (normalizer <= 0) return 0;
  const punti = 1000 * Math.pow(gain / normalizer, C);
  return Math.round(punti * 10) / 10;
}

/**
 * Converte minuti+secondi in secondi totali.
 * @param {number} min - Minuti (>= 0)
 * @param {number} sec - Secondi (0-59)
 * @returns {number} Secondi totali
 */
export function tempoASecondi(min, sec) {
  const m = Math.max(0, parseInt(min, 10) || 0);
  const s = Math.max(0, parseInt(sec, 10) || 0);
  return m * 60 + s;
}

/**
 * Converte secondi in stringa "MM:SS".
 * @param {number} secondi
 * @returns {string} Es. "20:30"
 */
export function secondiATempo(secondi) {
  const s = Math.max(0, parseInt(secondi, 10) || 0);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

/**
 * Converte rounds + reps extra in reps totali (per scoringType "rounds_reps").
 * @param {number} round - Round completati
 * @param {number} repsExtra - Reps del round in corso
 * @param {number} repsPerRound - Reps per round completo
 * @returns {number} Reps totali
 */
export function roundsRepsAReps(round, repsExtra, repsPerRound) {
  const r = Math.max(0, parseInt(round, 10) || 0);
  const e = Math.max(0, parseInt(repsExtra, 10) || 0);
  const rpr = Math.max(0, parseInt(repsPerRound, 10) || 0);
  return r * rpr + e;
}

/**
 * Aggrega l'EPI totale di un atleta sommando i punti dei suoi risultati.
 * @param {Array<{puntiEpi: number}>} risultatiAtleta
 * @returns {number} Somma puntiEpi (1 decimale)
 */
export function totaleEpiAtleta(risultatiAtleta) {
  if (!Array.isArray(risultatiAtleta)) return 0;
  const totale = risultatiAtleta.reduce((acc, r) => acc + (r.puntiEpi || 0), 0);
  return Math.round(totale * 10) / 10;
}
