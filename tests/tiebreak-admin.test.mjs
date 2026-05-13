// Test mirato sulle regressioni admin/pubblico del Tie-break.
// Esegui con: node tests/tiebreak-admin.test.mjs

import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const adminSource = readFileSync(new URL("../js/admin.js", import.meta.url), "utf8");
const rulesSource = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");

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

function assertEqual(actual, expected, descr) {
  assert(actual === expected, `${descr} — atteso ${JSON.stringify(expected)}, ottenuto ${JSON.stringify(actual)}`);
}

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Funzione non trovata: ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Fine funzione non trovata: ${name}`);
}

const helpersSource = [
  "function isDnfRisultato(r) { return !!r?.dnf; }",
  "function timestampKey(ts) { return ts && typeof ts.key === 'string' ? ts.key : ''; }",
  extractFunction(adminSource, "datiRisultatoPubblico"),
  extractFunction(adminSource, "tieBreakSecondi"),
  extractFunction(adminSource, "risultatoPubblicoUguale"),
  extractFunction(adminSource, "firmaRisultato"),
  "({ datiRisultatoPubblico, tieBreakSecondi, risultatoPubblicoUguale, firmaRisultato });"
].join("\n\n");

const {
  datiRisultatoPubblico,
  risultatoPubblicoUguale,
  firmaRisultato
} = new Script(helpersSource).runInNewContext({});

function isValidPublicResultSchema(data) {
  const allowed = new Set(["atletaId", "eventoId", "categoriaId", "puntiEpi", "tieBreak"]);
  const categories = new Set(["ultimate", "advanced", "challenger", "performance", "essential", "intermediate"]);
  const keys = Object.keys(data);
  return keys.every((k) => allowed.has(k))
    && ["atletaId", "eventoId", "categoriaId", "puntiEpi"].every((k) => keys.includes(k))
    && typeof data.atletaId === "string"
    && data.atletaId.length > 0
    && data.atletaId.length <= 80
    && typeof data.eventoId === "string"
    && data.eventoId.length > 0
    && data.eventoId.length <= 20
    && typeof data.categoriaId === "string"
    && categories.has(data.categoriaId)
    && typeof data.puntiEpi === "number"
    && data.puntiEpi >= 0
    && data.puntiEpi <= 20000
    && (
      !keys.includes("tieBreak")
      || data.tieBreak === null
      || (typeof data.tieBreak === "number" && data.tieBreak >= 0 && data.tieBreak <= 3600)
    );
}

console.log("\n=== TEST: payload pubblico T.B. compatibile con rules ===");
{
  const payload = datiRisultatoPubblico({
    atletaId: " atleta-1 ",
    eventoId: " wod-2 ",
    categoriaId: "performance",
    puntiEpi: "1000.5",
    tieBreak: 89,
    campoNonPubblico: "x"
  });

  assertEqual(payload.atletaId, "atleta-1", "atletaId viene normalizzato");
  assertEqual(payload.eventoId, "wod-2", "eventoId viene normalizzato");
  assertEqual(payload.puntiEpi, 1000.5, "puntiEpi viene convertito a numero");
  assertEqual(payload.tieBreak, 89, "tieBreak numerico resta nel payload pubblico");
  assert(!Object.hasOwn(payload, "campoNonPubblico"), "il payload pubblico non include campi privati");
  assert(isValidPublicResultSchema(payload), "il payload pubblico con T.B. passa lo schema equivalente alle rules");
}

console.log("\n=== TEST: T.B. opzionale nelle rules ===");
{
  const senzaTb = datiRisultatoPubblico({
    atletaId: "a1",
    eventoId: "e1",
    categoriaId: "ultimate",
    puntiEpi: 1000
  });
  const troppoAlto = { ...senzaTb, tieBreak: 3601 };
  const extra = { ...senzaTb, extra: true };

  assertEqual(senzaTb.tieBreak, null, "tieBreak assente diventa null");
  assert(isValidPublicResultSchema(senzaTb), "tieBreak null e' accettato");
  assert(!isValidPublicResultSchema(troppoAlto), "tieBreak oltre 3600 secondi viene rifiutato");
  assert(!isValidPublicResultSchema(extra), "campi extra restano rifiutati");
}

console.log("\n=== TEST: sync pubblico rileva cambi solo T.B. ===");
{
  const base = {
    atletaId: "a1",
    eventoId: "e1",
    categoriaId: "advanced",
    puntiEpi: 900,
    tieBreak: 120
  };

  assert(risultatoPubblicoUguale(base, { ...base }), "risultati identici sono uguali");
  assert(!risultatoPubblicoUguale(base, { ...base, tieBreak: 121 }), "cambio solo T.B. viene rilevato");
  assert(risultatoPubblicoUguale({ ...base, tieBreak: null }, { ...base, tieBreak: 0 }), "T.B. nullo e zero sono trattati come nessun T.B.");
}

console.log("\n=== TEST: firma anti-concorrenza include T.B. ===");
{
  const base = {
    valore: 100,
    valoreSecondario: null,
    dnf: false,
    puntiEpi: 1000,
    tieBreak: 60,
    aggiornatoDa: "Judge",
    aggiornatoIl: { key: "same-time" }
  };

  assert(firmaRisultato(base) !== firmaRisultato({ ...base, tieBreak: 61 }), "la firma cambia quando cambia solo il T.B.");
  assert(firmaRisultato({ ...base, tieBreak: null }) === firmaRisultato({ ...base, tieBreak: 0 }), "T.B. null e zero hanno la stessa firma");
}

console.log("\n=== TEST: sorgenti allineati ===");
{
  assert(/hasOnly\(\['atletaId', 'eventoId', 'categoriaId', 'puntiEpi', 'tieBreak'\]\)/.test(rulesSource), "firestore.rules consente tieBreak nei risultati pubblici");
  assert(/request\.resource\.data\.keys\(\)\.hasAny\(\['tieBreak'\]\)/.test(rulesSource), "firestore.rules valida tieBreak come campo opzionale");
  assert(/request\.resource\.data\.tieBreak <= 3600/.test(rulesSource), "firestore.rules limita il T.B. a 3600 secondi");
  assert(adminSource.includes('"T.B. mm:ss"') && adminSource.includes('"T.B. secondi"'), "export CSV include le colonne T.B.");
}

console.log("\n=== RIEPILOGO ===");
console.log(`Test passati: ${passed}`);
console.log(`Test falliti: ${failed}`);

if (failed > 0) {
  console.log("\nFallimenti:");
  fails.forEach((f) => console.log(` - ${f}`));
  process.exit(1);
}

console.log("\nTUTTI I TEST ADMIN T.B. PASSANO");
process.exit(0);
