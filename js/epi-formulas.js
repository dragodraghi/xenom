// epi-formulas.js — Funzioni pure per calcolo EPI (Elite Performance Index)
// Tutte le funzioni sono pure: stesso input -> stesso output, no side effects.
// Testate in tests/epi-formulas.test.mjs

/**
 * Calcola i punti EPI per una performance.
 * @param {number} performance - Valore numerico (kg, secondi, reps, calorie)
 * @param {Object} evento - Documento evento Firestore con scoringDirection e benchmarks
 * @param {string} categoriaId - ID categoria atleta (es. "ultimate", "performance")
 * @returns {number} Punti EPI con 1 decimale, 0 se input invalido
 */
export function calcolaEpi(performance, evento, categoriaId) {
  if (!evento || !evento.benchmarks) return 0;
  const benchmark = evento.benchmarks[categoriaId];
  if (!benchmark || benchmark <= 0) return 0;
  if (!performance || performance <= 0) return 0;

  const ratio = evento.scoringDirection === "higher"
    ? performance / benchmark
    : benchmark / performance;

  return Math.round(ratio * 1000 * 10) / 10;
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
