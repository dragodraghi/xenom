# TUSK PROTOCOL — Bad Boars Edition: Design Spec

**Data spec:** 2026-05-08
**Evento:** 29-30 Maggio 2026 (21 giorni dalla data spec)
**Repo:** `progetti/xenom` (riuso e aggiornamento del sito esistente)

---

## 1. Contesto

Il sito XENOM esistente (deploy Netlify, HTML/CSS/JS vanilla) è una vetrina informativa per un evento previsto a Giugno 2026. Il TUSK PROTOCOL del 29-30 Maggio sostituisce quell'evento: stesso box (Bad Boars CrossFit, Sassari), nuove date, **6 categorie** (Ultimate / Advanced / Challenge / Essential per uomini, Performance / Intermediate per donne), costo 10€, e — la novità — una componente **interattiva live**: classifica EPI in tempo reale e iscrizione online con approvazione admin.

Il sito attuale viene aggiornato e arricchito: la landing resta come pagina informativa, vengono aggiunte tre pagine nuove (`live.html`, `admin.html`, `iscriviti.html`) e un backend Firebase Firestore per persistere atleti, risultati e iscrizioni.

## 2. Decisioni di scope

| Tema | Decisione |
|---|---|
| Identità progetto | TUSK PROTOCOL **sostituisce** XENOM esistente (non evento parallelo) |
| Tempo disponibile | ~10h/settimana (utente full-time INCA, lavoro serale + weekend) |
| Budget totale | ~26h di lavoro effettivo, deadline feature-complete 24-26 Maggio |
| Architettura | HTML/CSS/JS vanilla esistente + Firebase SDK via CDN (no build step, no React) |
| Auth giudici | Singolo account admin Firebase (email hardcoded, password condivisa); login via `signInWithEmailAndPassword` con sessione persistente Firebase |
| Eventi gara | I 10 eventi del `data.js` esistente, con campi TBD compilati durante la sessione benchmark |
| Benchmark EPI | Definiti insieme prima dell'implementazione (sessione 1.5h, Google Sheet) |
| Iscrizione atleti | Form pubblico online + workflow di approvazione admin (collezione `iscrizioni_pending`) |
| Presentazione PDF | Rimossa dal nav (non aggiornata, accessibile solo via URL diretto come archivio interno) |

### Cosa NON facciamo (tagliato dallo scope)
- Slot prenotabili Venerdì pomeriggio (gestiti con foglio Excel/cartaceo il giorno X)
- Heat head-to-head automatici Sabato (calcolati a mano la mattina dalla classifica del Venerdì)
- Profili atleti pubblici con foto biografica
- Notifiche push/email di conferma iscrizione (l'utente vede solo l'esito sul form al momento del submit)
- Storico edizioni precedenti
- Multi-lingua (solo italiano)

### Cosa rimane facilmente aggiungibile dopo l'evento
Tutte le feature tagliate sono **additive**: il data model è progettato per crescere senza migrazioni. Esempi:
- Foto atleti → aggiungi campo `fotoUrl` + Firebase Storage
- Slot prenotabili → nuova collezione `slot/{eventoId}`
- Head-to-head → algoritmo client-side che legge la classifica corrente
- Storico edizioni → campo `edizione: "2026-05"` ovunque

## 3. Architettura

### Stack
- **Frontend:** HTML/CSS/JS vanilla (esistente, riusato)
- **Firebase SDK v10** modulare, importato via CDN ES modules
- **Firestore** come database (realtime listeners per classifica live)
- **Email/password Auth** con un singolo account admin pre-creato nel Firebase Console; UX "una password" (l'email è hardcoded nel JS, ai giudici si distribuisce solo la password)
- **Hosting:** Netlify auto-deploy da `git push` (già configurato)

### Struttura file
```
progetti/xenom/
├── index.html             [aggiornato: date, 6 categorie, costo 10€, programma]
├── live.html              [NUOVO: classifica live pubblica, realtime]
├── admin.html             [NUOVO: gestione iscrizioni, atleti, risultati]
├── iscriviti.html         [NUOVO: form iscrizione pubblica]
├── presentazione.html     [non aggiornato, rimosso dal nav]
├── video.html             [invariato]
├── css/
│   ├── design-system.css  [invariato]
│   ├── website.css        [invariato]
│   ├── print.css          [invariato]
│   └── live.css           [NUOVO: stile classifica + form admin + form iscrizione]
└── js/
    ├── data.js            [aggiornato: 6 categorie, eventi, programma, costo]
    ├── animations.js      [invariato]
    ├── firebase-config.js [NUOVO: init Firebase, export db, gestione admin password]
    ├── epi-formulas.js    [NUOVO: formule calcolo EPI, pure functions]
    ├── live.js            [NUOVO: rendering classifica realtime con tab categorie]
    ├── admin.js           [NUOVO: gestione iscrizioni/atleti/risultati]
    └── iscriviti.js       [NUOVO: validazione form + scrittura Firestore]
```

### Linkatura tra pagine
- `index.html` (landing) → CTA "Iscriviti" punta a `iscriviti.html`, CTA "Classifica Live" punta a `live.html`
- `live.html` → tab classifica per categoria, link discreto in footer "Area Giudici" → `admin.html`
- `admin.html` → richiede password al primo accesso, salva flag in localStorage; tab Iscrizioni / Atleti / Inserimento risultati / Eventi / Strumenti
- `iscriviti.html` → form pubblico, scrive in `iscrizioni_pending`, mostra esito "Iscrizione ricevuta, attendi approvazione"

### Costi attesi Firebase
- Tier gratuito Spark (no carta di credito): 50K letture/giorno, 20K scritture/giorno
- 50 atleti × 10 eventi = 500 scritture totali nei 2 giorni di gara → margine enorme
- Pubblico: ~50 spettatori × 1 listener Firestore attivo = traffico trascurabile

## 4. Data model Firestore

Quattro collezioni principali + una pending.

### `categorie/{categoriaId}`
Pre-popolata con i 6 documenti, mai modificata da app.
```js
{
  id: "ultimate",            // doc id (slug)
  nome: "Ultimate",
  gender: "M",                // "M" | "F"
  ordine: 1,
  descrizione: "Carichi pesanti, ginnastica Pro (Muscle-up, HSW)"
}
```
6 categorie: `ultimate`, `advanced`, `challenge`, `essential` (M) + `performance`, `intermediate` (F).

### `eventi/{numero}` (id = "1"…"10")
Pre-popolata con i 10 eventi. Benchmarks definiti durante sessione M0.
```js
{
  numero: 1,
  nome: "1RM Snatch",
  nomeIT: "Strappo Massimale",
  descrizione: "...",
  formato: "...",
  scoringType: "weight",      // "weight" | "time" | "reps" | "rounds_reps" | "calories"
  scoringDirection: "higher", // "higher" | "lower"
  giorno: 1,                  // 1=Venerdì, 2=Sabato
  benchmarks: {
    ultimate: 130,
    advanced: 100,
    challenge: 80,
    essential: 60,
    performance: 75,
    intermediate: 55
  },
  // solo per scoringType "rounds_reps"
  repsPerRound: 30
}
```

### `atleti/{atletaId}` (id auto-generato)
Inserita da admin (sia tramite tab "Atleti" che tramite approvazione di `iscrizioni_pending`).
```js
{
  nome: "Mario Rossi",
  categoriaId: "ultimate",
  box: "Bad Boars",           // "Bad Boars" | nome box esterno
  createdAt: <timestamp>
}
```

### `iscrizioni_pending/{id}` (id auto-generato)
Scrivibile pubblicamente (solo create), letta/eliminata solo da admin.
```js
{
  nome: "Mario Rossi",
  categoriaId: "ultimate",
  box: "Bad Boars",
  contatto: "+39 333 1234567",  // tel o email
  note: "",                      // opzionale
  createdAt: <timestamp>
}
```
Su approvazione admin: documento copiato in `atleti/{id}` ed eliminato da `iscrizioni_pending`.
Su rifiuto admin: documento eliminato.

### `risultati/{atletaId}_{eventoId}` (id composito)
Un solo risultato per coppia atleta-evento. Sovrascrittura su edit, no duplicati.
```js
{
  atletaId: "abc123",
  eventoId: "1",
  categoriaId: "ultimate",    // duplicata per query veloci e indipendenza da atleti
  valore: 95,                 // performance grezza (kg/sec/reps/cal)
  valoreSecondario: null,     // usato solo per rounds_reps (reps extra round in corso)
  puntiEpi: 730.7,            // calcolato e salvato (storico fedele se cambia benchmark)
  inseritoIl: <timestamp>,
  inseritoDa: "admin"
}
```

### Classifica EPI
**Calcolata lato client**, non salvata. `live.html` legge tutti i `risultati` (max 500 documenti per evento), raggruppa per atletaId, somma `puntiEpi`, ordina per categoria. Listener realtime Firestore aggiorna automaticamente.

### Security rules Firestore
```
match /categorie/{doc}            { allow read: any;  allow write: false }
match /eventi/{doc}                { allow read: any;  allow write: false }
match /atleti/{doc}                { allow read: any;  allow write: if isAdmin() }
match /risultati/{doc}             { allow read: any;  allow write: if isAdmin() }
match /iscrizioni_pending/{doc}    { allow create: if validIscrizione(); allow read, delete: if isAdmin(); allow update: false }
```
- `isAdmin()`: `request.auth != null && request.auth.token.email == 'admin@tusk-badboars.local'` (l'unico account admin pre-creato; la password si distribuisce ai giudici)
- `validIscrizione()`: validazione campi obbligatori (`nome`, `categoriaId`, `box`, `contatto`) e lunghezze massime per evitare spam

## 5. Calcolo EPI

Tutta la logica vive in `epi-formulas.js`. Funzioni pure, testabili.

### Formule per scoringType

| `scoringType` | Direzione | Formula |
|---|---|---|
| `weight` | higher = better | `(performance / benchmark) × 1000` |
| `reps` | higher = better | `(performance / benchmark) × 1000` |
| `calories` | higher = better | `(performance / benchmark) × 1000` |
| `time` | lower = better | `(benchmark / performance) × 1000` |
| `rounds_reps` | higher = better | converti in reps totali (`round × repsPerRound + repsExtra`), poi formula `reps` |

### Esempi

- **1RM Snatch**, Ultimate (benchmark 130kg): atleta solleva 100kg → `100/130 × 1000 = 769 punti`
- **3K Run + 2K Ski**, Performance (benchmark 1080s): atleta in 1200s → `1080/1200 × 1000 = 900 punti`
- **Barbell Cycling AMRAP** (benchmark 180 reps, 30 reps/round): 5 round + 12 reps → `162/180 × 1000 = 900 punti`

### Casi limite
- DNF / nessun risultato → 0 punti per quell'evento, EPI parziale visibile in classifica con indicatore `⚠️`
- Performance > benchmark → punti > 1000, **nessun cap** (coerente con filosofia EPI)
- `performance = 0` o `benchmark = 0` → 0 punti, validazione form impedisce salvataggio

### Funzione principale (pseudocode)
```js
export function calcolaEpi(performance, evento, categoriaId) {
  const benchmark = evento.benchmarks[categoriaId];
  if (!benchmark || benchmark <= 0) return 0;
  if (!performance || performance <= 0) return 0;
  const ratio = evento.scoringDirection === "higher"
    ? performance / benchmark
    : benchmark / performance;
  return Math.round(ratio * 1000 * 10) / 10;  // 1 decimale
}

export function roundsRepsAReps(round, repsExtra, repsPerRound) {
  return round * repsPerRound + repsExtra;
}

export function tempoASecondi(min, sec) {
  return min * 60 + sec;
}
```

## 6. Flussi utente

### Flusso pubblico (spettatore / atleta)
1. Apre `index.html` (landing informativa)
2. Clicca "Iscriviti" → `iscriviti.html` → compila form → submit → vede "Iscrizione ricevuta, attendi approvazione"
3. Clicca "Classifica Live" → `live.html` → seleziona tab categoria → vede classifica realtime aggiornata automaticamente

### Flusso giudice (durante la gara)
1. Apre `admin.html` → primo accesso form login (campo password; email admin hardcoded) → Firebase Auth gestisce sessione persistente sul dispositivo
2. Tab "Inserisci Risultato": cerca atleta (filtro live mentre digita) → seleziona evento → inserisce performance → vede anteprima EPI calcolata in tempo reale → salva
3. Se l'atleta ha già un risultato per quell'evento, viene mostrato un avviso e il salvataggio sovrascrive il precedente

### Flusso organizzatore (tu)
**Pre-evento (entro 24 Maggio):**
- Apre `admin.html`, tab "Iscrizioni": approva/rifiuta atleti pending man mano che arrivano
- Tab "Atleti": eventuali aggiunte manuali (atleti dell'ultimo minuto)

**Durante evento:**
- Verifica che giudici non abbiano problemi
- Tab "Strumenti" → "Ricalcola EPI" se cambia un benchmark all'ultimo

**Post-evento:**
- Tab "Strumenti" → "Esporta classifica CSV" per archivio e cerimonia premiazione

## 7. Aggiornamento contenuti statici

### `data.js` — modifiche principali

**Sostituire campo `divisione: "RX / Scaled / Master"` con array `categorie` di 6 elementi.**

**Aggiornare:**
- `data: "29-30 Maggio 2026"`
- `numCategorie: 6`
- Aggiungere `costo: "10€"`
- Riempire i 4 eventi attualmente "Coming Soon" / "Da definire" durante sessione M0

**Aggiungere `programma` strutturato:**
```js
programma: [
  { ora: "14:00",       giorno: 1, attivita: "Apertura Box, registrazione" },
  { ora: "14:30-19:00", giorno: 1, attivita: "Eventi 1-4 (slot liberi prenotabili)" },
  { ora: "09:00",       giorno: 2, attivita: "Apertura, riscaldamento" },
  { ora: "10:00-17:00", giorno: 2, attivita: "Eventi 5-9 (heat strutturati)" },
  { ora: "18:00",       giorno: 2, attivita: "Finale (top 5/6 per categoria)" },
  { ora: "20:00",       giorno: 2, attivita: "Premiazioni + Party" }
]
```

### `index.html` — sezioni che cambiano

| Sezione | Modifica |
|---|---|
| Hero | Date "29-30 Maggio 2026", stat "Categorie" da 3 a 6 |
| Nav | Aggiunte voci "Live" → `live.html` e "Iscriviti" → `iscriviti.html`, rimossa "Risorse" (non c'è più presentazione linkata) |
| About | Testo aggiornato sulle 6 categorie + menzione costo 10€ |
| Eventi | Stessa struttura, riempi i TBD con dati reali |
| EPI | Invariato (concetto resta) |
| Atleti | Trasformata: CTA "Iscriviti via app" → `iscriviti.html` + "Vedi Classifica Live" → `live.html` |
| Schedule | Programma vero (4 WOD Venerdì + 5 Sabato + Finale + Party) |
| Location | Date aggiornate, riga "Costo: 10€ (in contanti al box)" |
| Risorse | Rimossa o trasformata in "Classifica Live" |

### `presentazione.html`
Non aggiornata. Rimossa dal nav. Resta accessibile via URL diretto come archivio interno.

## 8. Roadmap di esecuzione

Ritmo di lavoro target: **~10h/settimana** (utente operatore INCA full-time, sere + weekend). Margine di 4-5 giorni per testing finale.

| # | Milestone | Lavoro | Cumulato | Deadline |
|---|---|---|---|---|
| M0 | Sessione benchmark EPI insieme (Google Sheet 10 eventi × 6 categorie) | 1.5h | 1.5h | Sab 9 Mag |
| M1 | Aggiornamento contenuti statici (`data.js`, `index.html`) | 3h | 4.5h | Lun 11 Mag |
| M2 | Setup Firebase + `firebase-config.js` + security rules | 2h | 6.5h | Mer 13 Mag |
| M3 | `epi-formulas.js` + test manuale formule | 3h | 9.5h | Ven 15 Mag |
| M4 | `iscriviti.html` + validazione + scrittura Firestore | 2.5h | 12h | Dom 17 Mag |
| M5 | `admin.html` shell + auth password + tab Iscrizioni con approve/reject | 3h | 15h | Mer 20 Mag |
| M6 | Tab Atleti + Inserimento risultati con anteprima EPI | 4h | 19h | Sab 23 Mag |
| M7 | `live.html` classifica realtime con tab categorie + listener Firestore | 3.5h | 22.5h | Lun 25 Mag |
| M8 | Tab Strumenti (ricalcola, esporta CSV) + polish UI | 1.5h | 24h | Mar 26 Mag |
| M9 | Testing end-to-end + bugfix + deploy finale | 2.5h | 26.5h | Gio 28 Mag |
| M10 | Buffer / margine errore / rifiniture | — | — | Ven 29 Mag mattina |

### Asset/contenuti che servono dall'utente

| Cosa | Quando | Come |
|---|---|---|
| Tabella benchmark EPI 10×6 | Prima di M3 | Sessione M0 su Google Sheet |
| Descrizioni 4 eventi TBD | Durante M0 | Mi dici i dettagli reali |
| Programma orari approssimativo | Prima di M1 | Anche solo "Venerdì 14:00-19:00 eventi liberi" basta |
| Lista atleti pre-iscritti | Quando arrivano | Si caricano via tab Iscrizioni man mano |
| Logo/brand TUSK | Opzionale | Il design system XENOM esistente è già forte |

## 9. Rischi e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Ritardo sul ritmo 10h/sett | Media | Alto | M0-M3 (le fondamenta) entro 15 Maggio: se in ritardo, taglio Tab Strumenti e animazioni live |
| Benchmark EPI sbagliati il giorno X | Bassa | Medio | Bottone "Ricalcola tutti EPI" in Tab Strumenti permette correzione in 1 click |
| Spam su `iscrizioni_pending` (form pubblico) | Bassa | Basso | Validazione campi obbligatori + lunghezze max nelle security rules |
| Bug critico inserimento risultati il giorno X | Bassa | Critico | M9 dedicato a testing end-to-end con dati di prova realistici |
| Perdita password admin durante gara | Bassa | Medio | Sessione Firebase persistente sui telefoni dei giudici loggati; reset password possibile via Firebase Console in 30 secondi |
| Firebase down/quote raggiunte | Quasi nulla | Critico | Tier Spark 50K letture/giorno è 100x il fabbisogno reale |
