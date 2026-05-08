# TUSK PROTOCOL — Implementation Plan

> **Per agentic worker:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (raccomandato) oppure superpowers:executing-plans per implementare questo piano task-by-task. Gli step usano sintassi checkbox (`- [ ]`) per il tracking.

**Goal:** Trasformare il sito statico XENOM esistente in un'app interattiva per il TUSK PROTOCOL del 29-30 Maggio 2026, con iscrizione online + approvazione admin, inserimento risultati per giudici, e classifica EPI live realtime per le 6 categorie.

**Architecture:** Estensione del sito statico esistente (HTML/CSS/JS vanilla) aggiungendo Firebase SDK v10 modulare via CDN. Backend Firestore con 5 collezioni (`categorie`, `eventi`, `atleti`, `iscrizioni_pending`, `risultati`). Auth via singolo account admin Firebase email/password (UX "una password" con email hardcoded). Tre nuove pagine (`live.html`, `admin.html`, `iscriviti.html`) + aggiornamento di `index.html` e `data.js`. Calcolo EPI client-side con funzioni pure testabili. Deploy automatico Netlify da git push.

**Tech Stack:** HTML5, CSS3, JavaScript vanilla (ES modules), Firebase SDK v10 (Firestore + Auth) via CDN, Netlify hosting.

**Spec di riferimento:** `docs/superpowers/specs/2026-05-08-tusk-protocol-design.md`

**Repo root:** `progetti/xenom/` — tutti i path nei task sono relativi a questa cartella.

---

## File Structure

File modificati:
- `index.html` — landing page (date, categorie, programma, costo, nav, link a nuove pagine)
- `js/data.js` — sostituire campo `divisione` con array `categorie`, aggiungere `costo`, programma reale, riempire eventi TBD

File creati:
- `iscriviti.html` — form pubblico iscrizione
- `live.html` — classifica live realtime con tab categorie
- `admin.html` — area giudici/admin (5 tab: Iscrizioni, Atleti, Inserisci Risultato, Eventi, Strumenti)
- `css/live.css` — stile classifica + form admin + form iscrizione
- `js/firebase-config.js` — init Firebase, export `db` e `auth`, helper `isAdmin()`
- `js/epi-formulas.js` — funzioni pure calcolo EPI
- `js/iscriviti.js` — validazione form + scrittura Firestore
- `js/admin.js` — gestione iscrizioni/atleti/risultati/strumenti
- `js/live.js` — rendering classifica realtime con listener Firestore

File invariati:
- `presentazione.html`, `video.html`, `css/design-system.css`, `css/website.css`, `css/print.css`, `js/animations.js`

---

## M0 — Sessione benchmark EPI (manuale, insieme)

**Scopo:** definire i benchmark "1.000 punti" per i 10 eventi × 6 categorie prima di scrivere codice.

### Task 0.1: Creare Google Sheet condiviso

- [ ] **Step 1: Crea un Google Sheet nuovo** intitolato "TUSK Protocol — Benchmarks EPI"

- [ ] **Step 2: Imposta colonne**

| Colonna | Contenuto |
|---|---|
| A | Numero evento |
| B | Nome evento |
| C | scoringType |
| D | scoringDirection |
| E | Note (es. unità di misura) |
| F | Ultimate (M) |
| G | Advanced (M) |
| H | Challenge (M) |
| I | Essential (M) |
| J | Performance (F) |
| K | Intermediate (F) |

- [ ] **Step 3: Pre-compila righe da 1 a 10** con i nomi degli eventi attuali in `js/data.js` (1RM Snatch, Wall Walk + Rope Climb, Max Cal Echo Bike, Barbell Cycling, 3K Run + 2K Echo Ski, e i 4 attualmente "Coming Soon"/"Da definire" → completali con eventi reali del format)

- [ ] **Step 4: Compila i benchmark** (sessione 1-1.5h con il coach)

Per ogni cella benchmark (F-K), inserisci il valore numerico che rappresenta il livello "1000 punti elite" per quella categoria:
- `weight` events: kg (es. 130 per Ultimate Snatch)
- `time` events: secondi totali (es. 1080 = 18:00)
- `reps` events: numero ripetizioni totali
- `calories` events: calorie totali
- `rounds_reps` events: reps totali (round × repsPerRound + reps di benchmark)

- [ ] **Step 5: Per gli eventi `rounds_reps` aggiungi colonna L** "repsPerRound" (es. Barbell Cycling = 30: 12+9+6+3)

**Deliverable:** Google Sheet completo con 10 righe × 6 benchmark ciascuna, pronto per essere travasato in `js/data.js` e in Firestore.

---

## M1 — Aggiornamento contenuti statici

**Scopo:** aggiornare landing e dati con info nuove (date, 6 categorie, costo, programma, eventi).

### Task 1.1: Aggiornare metadati evento in data.js

**Files:**
- Modify: `js/data.js`

- [ ] **Step 1: Apri `js/data.js`** e modifica l'oggetto `evento`

```js
// SOSTITUISCI il blocco evento attuale con:
evento: {
  nome: "TUSK Protocol — Bad Boars Edition",
  sottotitolo: "Tusk Protocol",
  slogan: "10 Events. 2 Days. Zero Excuses.",
  data: "29-30 Maggio 2026",
  giorniSettimana: "Venerdì 29 e Sabato 30 Maggio",
  costo: "10€",
  costoNote: "Da consegnare al box in contanti",
  luogo: "Bad Boars CrossFit",
  indirizzo: "Predda Niedda Sud Str.40, 07100 Sassari (SS)",
  numAtleti: 0,
  numEventi: 10,
  numGiorni: 2,
  numCategorie: 6,
  disclaimer: "TUSK Protocol — Bad Boars CrossFit Sassari"
},
```

- [ ] **Step 2: Verifica salvataggio** aprendo `index.html` nel browser. La pagina deve caricare senza errori console.

- [ ] **Step 3: Commit**

```bash
git add js/data.js
git commit -m "data: aggiorna metadati evento TUSK Protocol (29-30 Mag, 6 categorie, costo 10€)"
```

### Task 1.2: Sostituire campo `divisione` con array `categorie`

**Files:**
- Modify: `js/data.js`

- [ ] **Step 1: Aggiungi nuovo array `categorie`** dopo l'oggetto `evento`

```js
categorie: [
  { id: "ultimate",     gender: "M", ordine: 1, nome: "Ultimate",     descrizione: "Il vertice. Carichi pesanti, ginnastica Pro (Muscle-up, HSW)." },
  { id: "advanced",     gender: "M", ordine: 2, nome: "Advanced",     descrizione: "Per chi vive il Box ogni giorno. Tutto RX, nessuna semplificazione." },
  { id: "challenge",    gender: "M", ordine: 3, nome: "Challenge",    descrizione: "Sei bravo, ma carichi élite o skill complesse sono ancora un obiettivo." },
  { id: "essential",    gender: "M", ordine: 4, nome: "Essential",    descrizione: "Zero barriere. Movimenti fondamentali, focus su intensità e qualità." },
  { id: "performance",  gender: "F", ordine: 1, nome: "Performance",  descrizione: "Prestazione pura. Tutte le skill tecniche nel repertorio." },
  { id: "intermediate", gender: "F", ordine: 2, nome: "Intermediate", descrizione: "Qualità del movimento e resistenza, senza lo stress dei carichi élite." }
],
```

- [ ] **Step 2: Commit**

```bash
git add js/data.js
git commit -m "data: aggiunge array categorie (4M + 2F)"
```

### Task 1.3: Aggiornare programma con orari reali

**Files:**
- Modify: `js/data.js`

- [ ] **Step 1: Sostituisci il blocco `programma`** attuale con:

```js
programma: [
  { ora: "14:00",       giorno: 1, attivita: "Apertura Box, registrazione atleti",        tipo: "admin" },
  { ora: "14:30-19:00", giorno: 1, attivita: "Eventi 1-4 (slot liberi prenotabili)",      tipo: "wod" },
  { ora: "09:00",       giorno: 2, attivita: "Apertura, riscaldamento collettivo",         tipo: "admin" },
  { ora: "10:00-17:00", giorno: 2, attivita: "Eventi 5-9 (heat strutturati)",              tipo: "wod" },
  { ora: "18:00",       giorno: 2, attivita: "Finale (top 5/6 per categoria)",             tipo: "wod" },
  { ora: "20:00",       giorno: 2, attivita: "Premiazioni + Party finale",                 tipo: "social" }
],
```

- [ ] **Step 2: Commit**

```bash
git add js/data.js
git commit -m "data: programma orari TUSK Protocol Ven 29 + Sab 30 Maggio"
```

### Task 1.4: Riempire i 4 eventi TBD in data.js

**Prerequisito:** sessione M0 completata (hai i nomi reali degli eventi 6, 8, 9 e i benchmark).

**Files:**
- Modify: `js/data.js`

- [ ] **Step 1: Per ciascun evento TBD nell'array `eventi`** (numeri 6, 8, 9 e qualunque altro con "Da definire"), sostituisci con i dati reali dal Google Sheet di M0:

```js
// ESEMPIO per evento 6 (sostituire con dati reali dal coach):
{
  numero: 6,
  nome: "Nome reale evento",
  nomeIT: "Nome italiano",
  categoria: "metcon",          // forza | ginnastica | cardio | metcon
  categoriaLabel: "Label da mostrare",
  tempo: "X minuti",
  formato: "Descrizione formato preciso",
  pesoRX_M: "Es. 60 kg",
  pesoRX_F: "Es. 42 kg",
  descrizione: "Descrizione completa per landing",
  scoring: "Es. Ripetizioni totali",
  giorno: 2,                    // 1=Venerdì, 2=Sabato
  icona: "🔥"
}
```

- [ ] **Step 2: Aggiungi a OGNI evento (anche quelli già definiti)** i nuovi campi necessari per il calcolo EPI:

```js
scoringType: "weight",        // "weight" | "time" | "reps" | "rounds_reps" | "calories"
scoringDirection: "higher",   // "higher" | "lower"
repsPerRound: null,           // solo se scoringType = "rounds_reps", altrimenti null
benchmarks: {
  ultimate: 130,
  advanced: 100,
  challenge: 80,
  essential: 60,
  performance: 75,
  intermediate: 55
}
```

Mappatura `scoringType` per i 10 eventi (riferimento):

| # | Nome | scoringType | scoringDirection |
|---|---|---|---|
| 1 | 1RM Snatch | weight | higher |
| 2 | Wall Walk + Rope Climb | reps | higher |
| 3 | Max Cal Echo Bike | calories | higher |
| 4 | Barbell Cycling AMRAP | rounds_reps | higher |
| 5 | 3K Run + 2K Echo Ski | time | lower |
| 6 | (TBD) | (definire) | (definire) |
| 7 | Gymnastics Triplet | reps o time | (definire) |
| 8 | Metcon AMRAP | reps | higher |
| 9 | Heavy Clean Ladder | weight | higher |
| 10 | The Finale | reps | higher |

- [ ] **Step 3: Verifica syntax** aprendo `index.html` nel browser, console DevTools deve essere pulita.

- [ ] **Step 4: Commit**

```bash
git add js/data.js
git commit -m "data: completa 10 eventi con scoringType, benchmarks per 6 categorie"
```

### Task 1.5: Aggiornare hero in index.html

**Files:**
- Modify: `index.html:67-95` (sezione `.hero__content`)

- [ ] **Step 1: Sostituisci hero badge e stat**

```html
<!-- TROVA: -->
<div class="hero__badge">XENOM // Tusk Protocol — 6-7 Giugno 2026, Sassari</div>

<!-- SOSTITUISCI CON: -->
<div class="hero__badge">TUSK PROTOCOL — 29-30 Maggio 2026, Sassari</div>
```

- [ ] **Step 2: Aggiorna stat "Categorie" da 3 a 6**

```html
<!-- TROVA: -->
<div class="hero__stat-number" data-counter="3">0</div>
<div class="hero__stat-label">Categorie</div>

<!-- SOSTITUISCI CON: -->
<div class="hero__stat-number" data-counter="6">0</div>
<div class="hero__stat-label">Categorie</div>
```

- [ ] **Step 3: Aggiungi CTA Iscriviti e Live**

```html
<!-- TROVA: -->
<div class="hero__cta">
  <a href="#events" class="btn btn--primary">Scopri gli Eventi</a>
  <a href="#epi" class="btn btn--outline">Come Funziona</a>
</div>

<!-- SOSTITUISCI CON: -->
<div class="hero__cta">
  <a href="iscriviti.html" class="btn btn--primary">Iscriviti — 10€</a>
  <a href="live.html" class="btn btn--outline">Classifica Live</a>
  <a href="#events" class="btn btn--ghost">Scopri gli Eventi</a>
</div>
```

- [ ] **Step 4: Verifica nel browser** che hero mostri date 29-30 Maggio, stat "6 categorie", e i 3 bottoni CTA.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "index: aggiorna hero con nuove date, 6 categorie, CTA Iscriviti/Live"
```

### Task 1.6: Aggiornare nav in index.html

**Files:**
- Modify: `index.html:30-46` (nav desktop) e `index.html:50-59` (mobile drawer)

- [ ] **Step 1: Aggiorna voce logo**

```html
<!-- TROVA: -->
<a href="#" class="nav__logo">XENOM <span>BB</span></a>

<!-- SOSTITUISCI CON: -->
<a href="#" class="nav__logo">TUSK <span>BB</span></a>
```

- [ ] **Step 2: Sostituisci `<ul class="nav__links">`** con:

```html
<ul class="nav__links">
  <li><a href="#about">Cos'è</a></li>
  <li><a href="#events">Eventi</a></li>
  <li><a href="#epi">Punteggio</a></li>
  <li><a href="#schedule">Programma</a></li>
  <li><a href="#location">Location</a></li>
  <li><a href="live.html" class="nav__cta">Live</a></li>
  <li><a href="iscriviti.html" class="nav__cta nav__cta--accent">Iscriviti</a></li>
</ul>
```

- [ ] **Step 3: Sostituisci mobile drawer** con stesse voci adattate:

```html
<div class="nav__mobile-drawer" id="mobile-drawer">
  <button class="nav__mobile-close" id="mobile-close" aria-label="Chiudi menu">✕</button>
  <a href="#about" class="mobile-link">Cos'è</a>
  <a href="#events" class="mobile-link">Eventi</a>
  <a href="#epi" class="mobile-link">Punteggio</a>
  <a href="#schedule" class="mobile-link">Programma</a>
  <a href="#location" class="mobile-link">Location</a>
  <a href="live.html" class="mobile-link mobile-link--cta">🏆 Classifica Live</a>
  <a href="iscriviti.html" class="mobile-link mobile-link--cta">📝 Iscriviti — 10€</a>
</div>
```

- [ ] **Step 4: Aggiungi stili minimi** per `nav__cta` e `mobile-link--cta`. Apri `css/website.css` e aggiungi in fondo:

```css
.nav__cta {
  background: var(--accent-primary);
  color: #fff !important;
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
}
.nav__cta--accent {
  background: var(--accent-gold);
}
.mobile-link--cta {
  color: var(--accent-primary) !important;
  font-weight: 700;
}
```

- [ ] **Step 5: Verifica visivamente** che nav mostri "Live" e "Iscriviti" come bottoni colorati.

- [ ] **Step 6: Commit**

```bash
git add index.html css/website.css
git commit -m "index: nav con voci Live/Iscriviti, rimossa Risorse"
```

### Task 1.7: Aggiornare sezione About con 6 categorie e costo

**Files:**
- Modify: `index.html:115-145` (sezione `.about__grid`)

- [ ] **Step 1: Sostituisci paragrafi `.about__text`** con:

```html
<div class="about__text reveal-left">
  <p style="font-family: var(--font-heading); font-size: 1.15rem; line-height: 1.6; color: var(--text-primary); border-left: 3px solid var(--accent-primary); padding-left: var(--space-md); margin-bottom: var(--space-lg);">
    Il tempo delle scuse è terminato. Il <strong>TUSK Protocol</strong> non è una gara, è un <strong>test di logoramento sistemico</strong>. Dieci prove progettate per trovare il tuo punto di rottura e superarlo. Al Bad Boars, non contano i "se", conta solo quanto sei disposto a scavare nel fango.
  </p>
  <p>
    <strong>10 eventi</strong> distribuiti su <strong>2 giornate</strong> (Venerdì 29 e Sabato 30 Maggio 2026), <strong>6 categorie</strong> per ogni livello atletico, <strong>una sola classifica</strong> aggiornata in tempo reale. Tutto governato dal sistema <strong>EPI (Elite Performance Index)</strong>: ogni performance diventa un punteggio comparabile.
  </p>
  <p>
    <strong>Iscrizione: 10€</strong> da consegnare al box. Aperto anche ad atleti esterni — sfida i tuoi limiti, scala la classifica live, festeggia al party finale.
  </p>
</div>
```

- [ ] **Step 2: Sostituisci `.about__categories`** con griglia 6 categorie

```html
<div class="about__categories reveal-right" style="grid-template-columns: repeat(2, 1fr);">
  <div class="about__category">
    <span class="about__category-icon">👑</span>
    <div class="about__category-name">Ultimate (M)</div>
    <div class="about__category-desc">Carichi pesanti, ginnastica Pro</div>
  </div>
  <div class="about__category">
    <span class="about__category-icon">🔥</span>
    <div class="about__category-name">Advanced (M)</div>
    <div class="about__category-desc">RX puro, niente semplificazioni</div>
  </div>
  <div class="about__category">
    <span class="about__category-icon">💪</span>
    <div class="about__category-name">Challenge (M)</div>
    <div class="about__category-desc">Carichi moderati, skill scalate</div>
  </div>
  <div class="about__category">
    <span class="about__category-icon">🎯</span>
    <div class="about__category-name">Essential (M)</div>
    <div class="about__category-desc">Movimenti fondamentali, intensità</div>
  </div>
  <div class="about__category">
    <span class="about__category-icon">⚡</span>
    <div class="about__category-name">Performance (F)</div>
    <div class="about__category-desc">Prestazione pura, skill tecniche</div>
  </div>
  <div class="about__category">
    <span class="about__category-icon">📈</span>
    <div class="about__category-name">Intermediate (F)</div>
    <div class="about__category-desc">Qualità del movimento</div>
  </div>
</div>
```

- [ ] **Step 3: Verifica nel browser** che la sezione About mostri 6 box categorie in griglia 2 colonne.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "index: About con 6 categorie e info costo 10€"
```

### Task 1.8: Trasformare sezione Atleti in CTA Iscriviti

**Files:**
- Modify: `index.html:217-231` (sezione `#athletes`)

- [ ] **Step 1: Sostituisci tutto il contenuto della sezione `#athletes`** con:

```html
<section class="section athletes" id="athletes">
  <div class="container">
    <div class="section__header reveal">
      <div class="section__number">04</div>
      <div class="section__label">Iscrizioni Aperte</div>
      <h2>Sfida il Protocollo</h2>
      <hr class="divider divider--center">
      <p class="text-center" style="margin: var(--space-md) auto 0; max-width: 600px;">
        Aperto a tutti gli atleti, anche esterni al box. Compila il form di iscrizione: dopo l'approvazione organizzatore riceverai conferma. Il giorno della gara consegna i 10€ al box. Vedi la tua classifica EPI muoversi in tempo reale.
      </p>
    </div>

    <div style="display: flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap; margin-top: var(--space-xl);">
      <a href="iscriviti.html" class="btn btn--primary btn--large" style="min-width: 220px;">📝 Iscriviti Adesso</a>
      <a href="live.html" class="btn btn--outline btn--large" style="min-width: 220px;">🏆 Vedi Classifica Live</a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Aggiungi stile `.btn--large` se non esiste.** In `css/website.css` aggiungi in fondo:

```css
.btn--large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}
```

- [ ] **Step 3: Verifica nel browser** che la sezione mostri due grandi bottoni CTA.

- [ ] **Step 4: Commit**

```bash
git add index.html css/website.css
git commit -m "index: sezione Atleti diventa CTA Iscriviti + Live"
```

### Task 1.9: Aggiornare sezione Schedule

**Files:**
- Modify: `index.html:235-249` (sezione `#schedule`)
- Modify: `js/animations.js` (verificare se renderizza programma da `data.js`)

- [ ] **Step 1: Apri `js/animations.js`** e cerca la funzione che popola `#schedule-timeline`. Se esiste, dovrebbe già leggere da `XENOM_DATA.programma` aggiornato in Task 1.3. Verifica nel browser.

- [ ] **Step 2: Se la sezione mostra correttamente il nuovo programma, salta a Step 3.** Altrimenti modifica la funzione di rendering per usare i campi `ora`, `giorno`, `attivita`, `tipo`.

- [ ] **Step 3: Aggiorna paragrafo intro sezione schedule** in `index.html`:

```html
<!-- TROVA: -->
<p class="text-center" style="margin: var(--space-md) auto 0; max-width: 560px;">10 eventi distribuiti su <strong>sabato 6</strong> e <strong>domenica 7 Giugno 2026</strong>. Scaletta dettagliata in fase di definizione — verrà pubblicata qui non appena confermata.</p>

<!-- SOSTITUISCI CON: -->
<p class="text-center" style="margin: var(--space-md) auto 0; max-width: 560px;">Venerdì 29: 4 WOD esplosivi a slot libero pomeridiano. Sabato 30: 5 WOD a heat strutturati + Finale per i top 5/6 di ogni categoria. Premiazioni e party a chiudere.</p>
```

- [ ] **Step 4: Commit**

```bash
git add index.html js/animations.js
git commit -m "index: aggiorna sezione Schedule con programma TUSK 29-30 Mag"
```

### Task 1.10: Aggiornare sezione Location

**Files:**
- Modify: `index.html:262-302` (sezione `.location__info`)

- [ ] **Step 1: Aggiorna data e aggiungi costo**

```html
<!-- TROVA il blocco Date e SOSTITUISCI CON: -->
<div class="location__detail">
  <div class="location__detail-icon">📅</div>
  <div class="location__detail-text">
    <h4>Date</h4>
    <p>Venerdì 29 e Sabato 30 Maggio 2026</p>
  </div>
</div>
```

- [ ] **Step 2: Aggiungi blocco Costo** subito dopo Date:

```html
<div class="location__detail">
  <div class="location__detail-icon">💸</div>
  <div class="location__detail-text">
    <h4>Costo Iscrizione</h4>
    <p>10€ — da consegnare al box in contanti</p>
  </div>
</div>
```

- [ ] **Step 3: Aggiorna blocco Orari**

```html
<!-- TROVA il blocco Orari e SOSTITUISCI CON: -->
<div class="location__detail">
  <div class="location__detail-icon">🕐</div>
  <div class="location__detail-text">
    <h4>Orari</h4>
    <p>
      Ven 29 Maggio: dalle 14:00<br>
      Sab 30 Maggio: dalle 09:00<br>
      Party finale: dalle 20:00
    </p>
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "index: Location con date 29-30 Mag, costo 10€, orari"
```

### Task 1.11: Rimuovere link presentazione dal nav e Risorse

**Files:**
- Modify: `index.html` (sezione Risorse `#risorse`)

- [ ] **Step 1: Rimuovi tutta la sezione `<section ... id="risorse">`** (le righe 318-349 nell'originale).

- [ ] **Step 2: Verifica che la voce "Risorse" sia già stata rimossa dal nav** (Task 1.6). Se è ancora presente, rimuovila.

- [ ] **Step 3: Verifica visivamente** che la pagina termini con sezione Location e poi footer.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "index: rimuove sezione Risorse (presentazione PDF non aggiornata)"
```

### Task 1.12: Deploy e verifica live del sito aggiornato

- [ ] **Step 1: Push su main** per triggerare deploy Netlify

```bash
git push origin main
```

- [ ] **Step 2: Apri https://benevolent-narwhal-1c8444.netlify.app/** dopo 1-2 minuti, verifica:
  - Hero mostra "29-30 Maggio 2026"
  - Stat "6 categorie"
  - Nav mostra "Live" e "Iscriviti" (anche se i link non funzionano ancora — è normale, le pagine non esistono)
  - Sezione About mostra 6 box categoria
  - Location mostra costo 10€
  - Niente errori in console DevTools

- [ ] **Step 3: Su mobile (Chrome DevTools responsive)** verifica che mobile drawer funzioni e mostri i nuovi link.

**Milestone M1 completato.** Sito informativo aggiornato e online.

---

## M2 — Setup Firebase

**Scopo:** creare progetto Firebase, configurare Auth + Firestore + security rules, popolare collezioni `categorie` e `eventi`.

### Task 2.1: Creare progetto Firebase

- [ ] **Step 1: Vai su https://console.firebase.google.com/** e fai login con account Google.

- [ ] **Step 2: Click "Add project"** → nome progetto: `tusk-protocol-badboars`. Disabilita Google Analytics (non serve).

- [ ] **Step 3: Aspetta creazione progetto** (30 secondi).

- [ ] **Step 4: Nel dashboard Firebase, vai a "Build > Authentication"** → Get started → tab "Sign-in method" → abilita "Email/Password" (non abilitare email link).

- [ ] **Step 5: Vai a "Build > Firestore Database"** → Create database → Modalità: **production** (NON test) → Location: `eur3 (europe-west)`.

### Task 2.2: Creare account admin

- [ ] **Step 1: In Firebase Console > Authentication > Users** → click "Add user".

- [ ] **Step 2: Inserisci credenziali admin:**
  - Email: `admin@tusk-badboars.local`
  - Password: scegli una password forte (es. `TuskBoars2026!Admin`) e **annotala in un posto sicuro** (password manager). La distribuirai ai giudici il giorno della gara.

- [ ] **Step 3: Click "Add user"**. Verifica che l'utente appaia nella lista con UID assegnato.

### Task 2.3: Registrare web app e ottenere config

- [ ] **Step 1: Firebase Console > Project Settings (icona ingranaggio)** → tab "General" → scrolla fino a "Your apps" → click icona Web (`</>`).

- [ ] **Step 2: Nickname app:** `tusk-web` → NON spuntare "Firebase Hosting" → click "Register app".

- [ ] **Step 3: Copia il blocco config** che appare. Avrà questa forma:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tusk-protocol-badboars.firebaseapp.com",
  projectId: "tusk-protocol-badboars",
  storageBucket: "tusk-protocol-badboars.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123:web:abc..."
};
```

**Salvalo temporaneamente in un file di testo** — lo userai nel Task 2.4. Le `apiKey` Firebase web sono sicure da committare in repo pubblici (non danno accesso senza che tu autorizzi domini in Authentication).

### Task 2.4: Creare js/firebase-config.js

**Files:**
- Create: `js/firebase-config.js`

- [ ] **Step 1: Crea `js/firebase-config.js`** con questo contenuto (sostituisci i valori `firebaseConfig` con quelli copiati nel Task 2.3):

```js
// firebase-config.js — Init Firebase + helper auth
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  // INCOLLA QUI il config copiato dal Task 2.3
  apiKey: "AIza...",
  authDomain: "tusk-protocol-badboars.firebaseapp.com",
  projectId: "tusk-protocol-badboars",
  storageBucket: "tusk-protocol-badboars.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

export const ADMIN_EMAIL = "admin@tusk-badboars.local";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper: login admin con la sola password (email hardcoded)
export async function loginAdmin(password) {
  return signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
}

// Helper: logout
export async function logoutAdmin() {
  return signOut(auth);
}

// Helper: callback chiamato quando lo stato auth cambia
// callback(user) — user è null se logged out
export function onAdminAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Helper: utente corrente è admin?
export function isAdminLoggedIn() {
  return auth.currentUser !== null && auth.currentUser.email === ADMIN_EMAIL;
}
```

- [ ] **Step 2: Verifica syntax** aprendo un file HTML di test che importa il modulo, oppure aspetta Task 2.6.

- [ ] **Step 3: Commit**

```bash
git add js/firebase-config.js
git commit -m "feat: aggiunge firebase-config.js con auth e Firestore init"
```

### Task 2.5: Configurare security rules Firestore

- [ ] **Step 1: Firebase Console > Firestore Database > Rules** tab.

- [ ] **Step 2: Sostituisci tutto il contenuto** con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == "admin@tusk-badboars.local";
    }

    function validIscrizione() {
      return request.resource.data.keys().hasAll(['nome', 'categoriaId', 'box', 'contatto'])
        && request.resource.data.nome is string
        && request.resource.data.nome.size() > 1
        && request.resource.data.nome.size() < 100
        && request.resource.data.categoriaId is string
        && request.resource.data.categoriaId.size() < 50
        && request.resource.data.box is string
        && request.resource.data.box.size() < 100
        && request.resource.data.contatto is string
        && request.resource.data.contatto.size() < 100;
    }

    match /categorie/{doc} {
      allow read: if true;
      allow write: if false;
    }

    match /eventi/{doc} {
      allow read: if true;
      allow write: if false;
    }

    match /atleti/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /risultati/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /iscrizioni_pending/{doc} {
      allow create: if validIscrizione();
      allow read: if isAdmin();
      allow delete: if isAdmin();
      allow update: if false;
    }
  }
}
```

- [ ] **Step 3: Click "Publish"**. Le rules entrano in vigore in 30 secondi.

### Task 2.6: Popolare collezione `categorie` (manuale via Console)

- [ ] **Step 1: Firebase Console > Firestore Database > Data tab** → click "Start collection".

- [ ] **Step 2: Collection ID:** `categorie` → Next.

- [ ] **Step 3: Crea il primo documento** con questi campi (Document ID = "ultimate"):

| Field | Type | Value |
|---|---|---|
| nome | string | Ultimate |
| gender | string | M |
| ordine | number | 1 |
| descrizione | string | Carichi pesanti, ginnastica Pro |

→ Save.

- [ ] **Step 4: Aggiungi altri 5 documenti** con stessa struttura (icona "Add document" nella collection):

| Doc ID | nome | gender | ordine | descrizione |
|---|---|---|---|---|
| advanced | Advanced | M | 2 | RX puro, nessuna semplificazione |
| challenge | Challenge | M | 3 | Carichi moderati, skill scalate |
| essential | Essential | M | 4 | Movimenti fondamentali, intensità |
| performance | Performance | F | 1 | Tutte le skill tecniche |
| intermediate | Intermediate | F | 2 | Qualità movimento, no carichi élite |

- [ ] **Step 5: Verifica** che la collezione `categorie` mostri 6 documenti.

### Task 2.7: Popolare collezione `eventi` con benchmarks

**Prerequisito:** Google Sheet di M0 completo con tutti i benchmark.

- [ ] **Step 1: Firebase Console > Firestore > Start collection** → ID `eventi`.

- [ ] **Step 2: Per ciascuno dei 10 eventi**, crea un documento con Document ID = `"1"`, `"2"`, ... `"10"` e questi campi (esempio per evento 1):

| Field | Type | Value |
|---|---|---|
| numero | number | 1 |
| nome | string | 1RM Snatch |
| nomeIT | string | Strappo Massimale |
| descrizione | string | (testo lungo dal data.js) |
| formato | string | 4 tentativi, 1 ogni 90 secondi |
| scoringType | string | weight |
| scoringDirection | string | higher |
| giorno | number | 1 |
| repsPerRound | number | (null o 0 se non rounds_reps) |

Poi aggiungi un campo `benchmarks` di tipo **map** con sotto-campi number:
- `ultimate`: 130
- `advanced`: 100
- `challenge`: 80
- `essential`: 60
- `performance`: 75
- `intermediate`: 55

- [ ] **Step 3: Ripeti per gli altri 9 eventi** usando i valori dal Google Sheet di M0.

- [ ] **Step 4: Verifica** che la collezione `eventi` abbia 10 documenti, ognuno con map `benchmarks` valorizzato per tutte le 6 categorie.

**Milestone M2 completato.** Firebase configurato, account admin creato, dati statici (categorie + eventi) caricati.

---

## M3 — Calcolo EPI

**Scopo:** scrivere `epi-formulas.js` con funzioni pure testate per calcolo punteggio EPI.

### Task 3.1: Creare epi-formulas.js con funzione principale

**Files:**
- Create: `js/epi-formulas.js`

- [ ] **Step 1: Crea `js/epi-formulas.js`** con questo contenuto:

```js
// epi-formulas.js — Funzioni pure per calcolo EPI (Elite Performance Index)
// Tutte le funzioni sono pure: stesso input → stesso output, no side effects.

/**
 * Calcola i punti EPI per una performance.
 * @param {number} performance - Valore numerico della performance (kg, secondi, reps, calorie)
 * @param {Object} evento - Documento evento da Firestore con scoringDirection e benchmarks
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
 * @param {number} min - Minuti (intero >= 0)
 * @param {number} sec - Secondi (intero 0-59)
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
 * @returns {string} Es. "12:30"
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
 * @param {number} repsExtra - Reps del round in corso non completato
 * @param {number} repsPerRound - Reps per round completo (da evento.repsPerRound)
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
 * @param {Array<Object>} risultatiAtleta - Array di documenti `risultati` per quell'atleta
 * @returns {number} Somma puntiEpi (1 decimale)
 */
export function totaleEpiAtleta(risultatiAtleta) {
  if (!Array.isArray(risultatiAtleta)) return 0;
  const totale = risultatiAtleta.reduce((acc, r) => acc + (r.puntiEpi || 0), 0);
  return Math.round(totale * 10) / 10;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/epi-formulas.js
git commit -m "feat: aggiunge epi-formulas.js con calcolaEpi e helper"
```

### Task 3.2: Test manuale formule via console browser

**Files:**
- Create temporary: `test-epi.html` (file di test, non committato)

- [ ] **Step 1: Crea `test-epi.html`** in root del repo:

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Test EPI</title></head>
<body>
<h1>Test EPI Formulas</h1>
<pre id="output"></pre>
<script type="module">
import {
  calcolaEpi, tempoASecondi, secondiATempo, roundsRepsAReps, totaleEpiAtleta
} from "./js/epi-formulas.js";

const out = document.getElementById("output");
const log = (msg) => { out.textContent += msg + "\n"; };

// Test 1: weight, higher = better
const evSnatch = { scoringDirection: "higher", benchmarks: { ultimate: 130 } };
log(`Snatch 100kg, Ultimate (bm 130): ${calcolaEpi(100, evSnatch, "ultimate")} (atteso 769.2)`);
log(`Snatch 130kg, Ultimate (bm 130): ${calcolaEpi(130, evSnatch, "ultimate")} (atteso 1000)`);
log(`Snatch 140kg, Ultimate (bm 130): ${calcolaEpi(140, evSnatch, "ultimate")} (atteso 1076.9)`);

// Test 2: time, lower = better
const evRun = { scoringDirection: "lower", benchmarks: { performance: 1080 } };
log(`Run 1200s, Performance (bm 1080): ${calcolaEpi(1200, evRun, "performance")} (atteso 900)`);
log(`Run 1080s, Performance (bm 1080): ${calcolaEpi(1080, evRun, "performance")} (atteso 1000)`);
log(`Run 960s, Performance (bm 1080): ${calcolaEpi(960, evRun, "performance")} (atteso 1125)`);

// Test 3: edge cases
log(`Performance 0: ${calcolaEpi(0, evSnatch, "ultimate")} (atteso 0)`);
log(`Categoria inesistente: ${calcolaEpi(100, evSnatch, "xyz")} (atteso 0)`);
log(`Evento null: ${calcolaEpi(100, null, "ultimate")} (atteso 0)`);

// Test 4: helper time
log(`tempoASecondi(18, 0): ${tempoASecondi(18, 0)} (atteso 1080)`);
log(`tempoASecondi(20, 30): ${tempoASecondi(20, 30)} (atteso 1230)`);
log(`secondiATempo(1230): ${secondiATempo(1230)} (atteso 20:30)`);

// Test 5: rounds_reps
log(`roundsRepsAReps(5, 12, 30): ${roundsRepsAReps(5, 12, 30)} (atteso 162)`);

// Test 6: aggregato atleta
const ris = [{ puntiEpi: 769.2 }, { puntiEpi: 900 }, { puntiEpi: 1000 }];
log(`totaleEpiAtleta(3 risultati): ${totaleEpiAtleta(ris)} (atteso 2669.2)`);
log(`totaleEpiAtleta([]): ${totaleEpiAtleta([])} (atteso 0)`);
</script>
</body>
</html>
```

- [ ] **Step 2: Apri `test-epi.html` nel browser** (doppio clic o `start "" test-epi.html` da terminale).

- [ ] **Step 3: Verifica che ogni riga di output mostri il valore atteso.** Se qualcosa non matcha, controlla la formula in `epi-formulas.js`.

- [ ] **Step 4: Elimina `test-epi.html`** (file di test temporaneo, non va in repo)

```bash
rm test-epi.html
```

**Milestone M3 completato.** Logica calcolo EPI testata e funzionante.

---

## M4 — Iscrizione pubblica

**Scopo:** form pubblico in `iscriviti.html` che scrive in `iscrizioni_pending`.

### Task 4.1: Creare iscriviti.html

**Files:**
- Create: `iscriviti.html`

- [ ] **Step 1: Crea `iscriviti.html`** con questa struttura:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Iscriviti — TUSK Protocol Bad Boars Edition</title>
  <meta name="description" content="Iscriviti al TUSK Protocol del 29-30 Maggio 2026 al Bad Boars CrossFit Sassari. 10€ in contanti al box.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;700&family=Oswald:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="css/design-system.css">
  <link rel="stylesheet" href="css/website.css">
  <link rel="stylesheet" href="css/live.css">

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>">
</head>
<body>

  <nav class="nav nav--simple">
    <div class="nav__inner">
      <a href="index.html" class="nav__logo">TUSK <span>BB</span></a>
      <a href="index.html" class="btn btn--ghost btn--small">← Home</a>
    </div>
  </nav>

  <section class="form-section">
    <div class="container container--narrow">
      <header class="form-header">
        <div class="section__label">Iscrizione</div>
        <h1>Iscriviti al TUSK Protocol</h1>
        <p>29-30 Maggio 2026 — Bad Boars CrossFit, Sassari. <strong>10€</strong> in contanti al box il giorno della gara.</p>
      </header>

      <form id="form-iscrizione" class="form" novalidate>
        <div class="form__field">
          <label for="nome">Nome e Cognome *</label>
          <input type="text" id="nome" name="nome" required maxlength="80" autocomplete="name">
          <span class="form__error" data-error-for="nome"></span>
        </div>

        <div class="form__field">
          <label for="categoriaId">Categoria *</label>
          <select id="categoriaId" name="categoriaId" required>
            <option value="">— Seleziona categoria —</option>
            <optgroup label="Uomini">
              <option value="ultimate">Ultimate (M) — Vertice, ginnastica Pro</option>
              <option value="advanced">Advanced (M) — RX puro</option>
              <option value="challenge">Challenge (M) — Carichi moderati</option>
              <option value="essential">Essential (M) — Movimenti fondamentali</option>
            </optgroup>
            <optgroup label="Donne">
              <option value="performance">Performance (F) — Skill tecniche complete</option>
              <option value="intermediate">Intermediate (F) — Senza carichi élite</option>
            </optgroup>
          </select>
          <span class="form__error" data-error-for="categoriaId"></span>
        </div>

        <div class="form__field">
          <label for="box">Box di provenienza *</label>
          <input type="text" id="box" name="box" required maxlength="80" placeholder="Es. Bad Boars, Iron Olbia, ..." autocomplete="organization">
          <span class="form__error" data-error-for="box"></span>
        </div>

        <div class="form__field">
          <label for="contatto">Contatto (telefono o email) *</label>
          <input type="text" id="contatto" name="contatto" required maxlength="80" placeholder="Es. +39 333 1234567 oppure mario@example.com" autocomplete="tel">
          <span class="form__error" data-error-for="contatto"></span>
        </div>

        <div class="form__field">
          <label for="note">Note (opzionale)</label>
          <textarea id="note" name="note" maxlength="300" rows="3" placeholder="Allergie, infortuni, richieste particolari..."></textarea>
          <span class="form__hint">Max 300 caratteri</span>
        </div>

        <button type="submit" class="btn btn--primary btn--large btn--full" id="btn-submit">Invia Iscrizione</button>

        <p class="form__disclaimer">
          Le iscrizioni vengono <strong>approvate manualmente</strong> dall'organizzatore. Riceverai conferma via il contatto fornito. Il pagamento di 10€ avviene al box il giorno della gara.
        </p>
      </form>

      <div id="iscrizione-success" class="form-success" hidden>
        <div class="form-success__icon">✅</div>
        <h2>Iscrizione ricevuta!</h2>
        <p>La tua richiesta è stata inviata. L'organizzatore ti contatterà a breve per confermare. Grazie!</p>
        <a href="index.html" class="btn btn--outline">← Torna alla Home</a>
        <a href="live.html" class="btn btn--primary">Vedi Classifica Live</a>
      </div>

      <div id="iscrizione-error" class="form-error" hidden>
        <div class="form-error__icon">❌</div>
        <h2>Errore</h2>
        <p id="iscrizione-error-msg">Qualcosa è andato storto. Riprova tra qualche secondo.</p>
        <button type="button" class="btn btn--outline" onclick="location.reload()">Ricarica pagina</button>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer__logo">TUSK PROTOCOL <span>BAD BOARS</span> EDITION</div>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-md);">&copy; 2026 Bad Boars CrossFit — Sassari</p>
    </div>
  </footer>

  <script type="module" src="js/iscriviti.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verifica nel browser** (apri `iscriviti.html`) — il form viene mostrato. Lo stile può essere ancora rough, lo sistemiamo nel Task 4.3.

### Task 4.2: Creare css/live.css con stili form e classifica

**Files:**
- Create: `css/live.css`

- [ ] **Step 1: Crea `css/live.css`** con stili condivisi tra `iscriviti.html`, `live.html`, `admin.html`:

```css
/* live.css — Stili per app live, form iscrizione, area admin */

/* Container narrow per form */
.container--narrow {
  max-width: 640px;
}

/* Nav semplificato (per pagine app) */
.nav--simple {
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Form section */
.form-section {
  padding-top: 8rem;
  padding-bottom: 4rem;
  min-height: 100vh;
}

.form-header {
  text-align: center;
  margin-bottom: 3rem;
}
.form-header h1 {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  margin: 0.5rem 0 1rem;
  text-transform: uppercase;
}
.form-header p {
  color: var(--text-secondary);
  max-width: 480px;
  margin: 0 auto;
}

/* Form field */
.form__field {
  margin-bottom: 1.5rem;
}
.form__field label {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.form__field input,
.form__field select,
.form__field textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 1rem;
  border-radius: 4px;
  transition: border-color 0.2s, background 0.2s;
}
.form__field input:focus,
.form__field select:focus,
.form__field textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.08);
}
.form__field input.is-invalid,
.form__field select.is-invalid,
.form__field textarea.is-invalid {
  border-color: #ff4444;
}
.form__field textarea {
  resize: vertical;
  min-height: 80px;
}

.form__error {
  display: block;
  color: #ff6666;
  font-size: 0.85rem;
  margin-top: 0.3rem;
  min-height: 1.2em;
}
.form__hint {
  display: block;
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-top: 0.3rem;
}

.form__disclaimer {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.5;
}

.btn--full {
  width: 100%;
}
.btn--small {
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
}
.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.btn--ghost:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* Success/error states */
.form-success,
.form-error {
  text-align: center;
  padding: 3rem 1rem;
}
.form-success__icon,
.form-error__icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.form-success h2,
.form-error h2 {
  font-family: var(--font-heading);
  text-transform: uppercase;
  margin-bottom: 1rem;
}
.form-success p,
.form-error p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}
.form-success a,
.form-success button,
.form-error a,
.form-error button {
  margin: 0 0.5rem;
}

/* Disabled / loading state */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.is-loading {
  position: relative;
  color: transparent !important;
}
.btn.is-loading::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border: 2px solid currentColor;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
  color: #fff;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 2: Verifica nel browser** che `iscriviti.html` ora abbia stile coerente.

- [ ] **Step 3: Commit**

```bash
git add iscriviti.html css/live.css
git commit -m "feat: aggiunge iscriviti.html shell e css/live.css condiviso"
```

### Task 4.3: Creare js/iscriviti.js con validazione e scrittura Firestore

**Files:**
- Create: `js/iscriviti.js`

- [ ] **Step 1: Crea `js/iscriviti.js`**:

```js
// iscriviti.js — Validazione form iscrizione + scrittura Firestore
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const form = document.getElementById("form-iscrizione");
const successBox = document.getElementById("iscrizione-success");
const errorBox = document.getElementById("iscrizione-error");
const errorMsg = document.getElementById("iscrizione-error-msg");
const btnSubmit = document.getElementById("btn-submit");

const VALID_CATEGORIE = ["ultimate", "advanced", "challenge", "essential", "performance", "intermediate"];

// --- Validazione ---
function validateField(name, value) {
  const v = (value || "").trim();
  switch (name) {
    case "nome":
      if (v.length < 2) return "Inserisci nome e cognome (minimo 2 caratteri)";
      if (v.length > 80) return "Massimo 80 caratteri";
      return null;
    case "categoriaId":
      if (!VALID_CATEGORIE.includes(v)) return "Seleziona una categoria";
      return null;
    case "box":
      if (v.length < 2) return "Inserisci il box di provenienza";
      if (v.length > 80) return "Massimo 80 caratteri";
      return null;
    case "contatto":
      if (v.length < 5) return "Inserisci telefono o email";
      if (v.length > 80) return "Massimo 80 caratteri";
      return null;
    default:
      return null;
  }
}

function showError(name, message) {
  const input = form.elements[name];
  const errEl = form.querySelector(`[data-error-for="${name}"]`);
  if (input) input.classList.toggle("is-invalid", !!message);
  if (errEl) errEl.textContent = message || "";
}

function validateAll(formData) {
  let firstError = null;
  for (const name of ["nome", "categoriaId", "box", "contatto"]) {
    const err = validateField(name, formData.get(name));
    showError(name, err);
    if (err && !firstError) firstError = name;
  }
  return firstError;
}

// Validazione live mentre l'utente esce dal campo
for (const name of ["nome", "categoriaId", "box", "contatto"]) {
  const input = form.elements[name];
  if (input) {
    input.addEventListener("blur", () => {
      const err = validateField(name, input.value);
      showError(name, err);
    });
  }
}

// --- Submit ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const firstError = validateAll(formData);
  if (firstError) {
    form.elements[firstError].focus();
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.classList.add("is-loading");

  try {
    const data = {
      nome: formData.get("nome").trim(),
      categoriaId: formData.get("categoriaId"),
      box: formData.get("box").trim(),
      contatto: formData.get("contatto").trim(),
      note: (formData.get("note") || "").trim().slice(0, 300),
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "iscrizioni_pending"), data);

    // Successo
    form.hidden = true;
    successBox.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("Errore iscrizione:", err);
    errorMsg.textContent = err.message || "Errore di rete. Verifica la connessione e riprova.";
    form.hidden = true;
    errorBox.hidden = false;
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.classList.remove("is-loading");
  }
});
```

- [ ] **Step 2: Test end-to-end** — apri `iscriviti.html` nel browser, compila form con dati di test (es. "Mario Test", Ultimate, "Bad Boars", "+39 333 0000000"), submit.

  - **Atteso:** appare schermata "Iscrizione ricevuta!"

- [ ] **Step 3: Verifica scrittura su Firestore** → Firebase Console > Firestore Database > collection `iscrizioni_pending`. Deve apparire un documento con i dati inseriti + `createdAt` timestamp.

- [ ] **Step 4: Test validazione** — apri di nuovo `iscriviti.html`, prova a submittare vuoto (devono apparire errori sotto ogni campo), prova categoria non selezionata, ecc.

- [ ] **Step 5: Test sicurezza** — apri DevTools console e prova a scrivere in una collezione protetta:

```js
// Da console su iscriviti.html
const { db } = await import("./js/firebase-config.js");
const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js");
await addDoc(collection(db, "atleti"), { nome: "hack", categoriaId: "ultimate", box: "x" });
// Atteso: Promise reject con "Missing or insufficient permissions"
```

- [ ] **Step 6: Commit**

```bash
git add js/iscriviti.js
git commit -m "feat: form iscrizione scrive in iscrizioni_pending con validazione"
```

**Milestone M4 completato.** Pubblico può iscriversi, dati arrivano in Firestore, sicurezza Firestore impedisce scritture non autorizzate.

---

## M5 — Admin shell + tab Iscrizioni

**Scopo:** `admin.html` con login email/password, sistema tab navigation, tab Iscrizioni con approve/reject.

### Task 5.1: Creare admin.html shell con login

**Files:**
- Create: `admin.html`

- [ ] **Step 1: Crea `admin.html`** con login screen e tab navigation:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — TUSK Protocol</title>
  <meta name="robots" content="noindex,nofollow">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;700&family=Oswald:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="css/design-system.css">
  <link rel="stylesheet" href="css/website.css">
  <link rel="stylesheet" href="css/live.css">

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔐</text></svg>">
</head>
<body>

  <!-- LOGIN SCREEN -->
  <section id="screen-login" class="form-section">
    <div class="container container--narrow">
      <header class="form-header">
        <div class="section__label">Area Riservata</div>
        <h1>Login Giudici</h1>
        <p>Inserisci la password fornita dall'organizzatore.</p>
      </header>

      <form id="form-login" class="form" novalidate>
        <div class="form__field">
          <label for="password">Password Admin</label>
          <input type="password" id="password" name="password" required autocomplete="current-password">
          <span class="form__error" data-error-for="password"></span>
        </div>
        <button type="submit" class="btn btn--primary btn--large btn--full" id="btn-login">Accedi</button>
        <p class="form__disclaimer">
          <a href="index.html" style="color: var(--text-muted);">← Torna alla home</a>
        </p>
      </form>
    </div>
  </section>

  <!-- ADMIN APP -->
  <div id="screen-admin" class="admin-app" hidden>
    <header class="admin-header">
      <div class="container">
        <div class="admin-header__inner">
          <a href="index.html" class="admin-header__logo">TUSK <span>BB</span> · Admin</a>
          <button id="btn-logout" class="btn btn--ghost btn--small">Logout</button>
        </div>

        <nav class="admin-tabs">
          <button class="admin-tab is-active" data-tab="iscrizioni">
            Iscrizioni <span class="admin-tab__badge" id="badge-iscrizioni" hidden>0</span>
          </button>
          <button class="admin-tab" data-tab="atleti">Atleti</button>
          <button class="admin-tab" data-tab="risultati">Inserisci Risultato</button>
          <button class="admin-tab" data-tab="eventi">Eventi</button>
          <button class="admin-tab" data-tab="strumenti">Strumenti</button>
        </nav>
      </div>
    </header>

    <main class="admin-main">
      <div class="container">
        <section class="admin-panel is-active" data-panel="iscrizioni">
          <h2>Iscrizioni in attesa di approvazione</h2>
          <div id="lista-iscrizioni" class="admin-list">
            <p class="admin-empty">Nessuna iscrizione pending.</p>
          </div>
        </section>

        <section class="admin-panel" data-panel="atleti">
          <h2>Atleti registrati</h2>
          <p class="admin-empty">Tab Atleti — implementato in Task 6.1</p>
        </section>

        <section class="admin-panel" data-panel="risultati">
          <h2>Inserisci risultato</h2>
          <p class="admin-empty">Tab Inserimento Risultato — implementato in Task 6.2-6.4</p>
        </section>

        <section class="admin-panel" data-panel="eventi">
          <h2>Eventi e benchmark (sola lettura)</h2>
          <p class="admin-empty">Tab Eventi — implementato in Task 8.3</p>
        </section>

        <section class="admin-panel" data-panel="strumenti">
          <h2>Strumenti</h2>
          <p class="admin-empty">Tab Strumenti — implementato in Task 8.1-8.2</p>
        </section>
      </div>
    </main>
  </div>

  <script type="module" src="js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: Aggiungi a `css/live.css`** stili per admin shell:

```css
/* Admin app */
.admin-app {
  min-height: 100vh;
  padding-bottom: 4rem;
}
.admin-header {
  position: sticky;
  top: 0;
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  z-index: 100;
  padding-top: 1rem;
}
.admin-header__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.admin-header__logo {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;
  letter-spacing: 1px;
}
.admin-header__logo span {
  color: var(--accent-primary);
}

.admin-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin: 0 -1rem;
  padding: 0 1rem 0.5rem;
}
.admin-tab {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.7rem 1.2rem;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.admin-tab:hover {
  color: var(--text-primary);
}
.admin-tab.is-active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
.admin-tab__badge {
  background: var(--accent-primary);
  color: #fff;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  margin-left: 0.3rem;
}

.admin-main {
  padding-top: 2rem;
}
.admin-panel {
  display: none;
}
.admin-panel.is-active {
  display: block;
}
.admin-panel h2 {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
}
.admin-empty {
  color: var(--text-muted);
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.admin-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}
.admin-card__info {
  flex: 1;
  min-width: 200px;
}
.admin-card__title {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
}
.admin-card__meta {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.admin-card__actions {
  display: flex;
  gap: 0.5rem;
}
.btn--success {
  background: #2d8a4e;
  color: #fff;
}
.btn--success:hover {
  background: #34a05c;
}
.btn--danger {
  background: rgba(255, 80, 80, 0.15);
  color: #ff8888;
  border: 1px solid rgba(255, 80, 80, 0.3);
}
.btn--danger:hover {
  background: rgba(255, 80, 80, 0.25);
}
```

### Task 5.2: Creare js/admin.js con auth e tab navigation

**Files:**
- Create: `js/admin.js`

- [ ] **Step 1: Crea `js/admin.js`** (versione iniziale con login + tab switching):

```js
// admin.js — App admin TUSK Protocol
import {
  db,
  loginAdmin,
  logoutAdmin,
  onAdminAuthChange,
  isAdminLoggedIn
} from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const screenLogin = document.getElementById("screen-login");
const screenAdmin = document.getElementById("screen-admin");
const formLogin = document.getElementById("form-login");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const errorPassword = formLogin.querySelector('[data-error-for="password"]');

// --- Auth flow ---
onAdminAuthChange((user) => {
  if (user && isAdminLoggedIn()) {
    screenLogin.hidden = true;
    screenAdmin.hidden = false;
    initAdminApp();
  } else {
    screenLogin.hidden = false;
    screenAdmin.hidden = true;
  }
});

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = formLogin.elements.password.value;
  errorPassword.textContent = "";

  btnLogin.disabled = true;
  btnLogin.classList.add("is-loading");

  try {
    await loginAdmin(password);
    // success: onAdminAuthChange si occupa del resto
  } catch (err) {
    console.warn("Login fallito:", err.code);
    errorPassword.textContent = "Password non valida.";
  } finally {
    btnLogin.disabled = false;
    btnLogin.classList.remove("is-loading");
  }
});

btnLogout.addEventListener("click", async () => {
  await logoutAdmin();
});

// --- Tab navigation ---
const tabs = document.querySelectorAll(".admin-tab");
const panels = document.querySelectorAll(".admin-panel");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === target));
  });
});

// --- Init app dopo login ---
let unsubscribers = [];

function initAdminApp() {
  // Cleanup eventuali listener precedenti
  unsubscribers.forEach((u) => u());
  unsubscribers = [];

  initTabIscrizioni();
  // initTabAtleti() — Task 6.1
  // initTabRisultati() — Task 6.2
  // initTabStrumenti() — Task 8.1
}

// --- TAB ISCRIZIONI ---
const listaIscrizioni = document.getElementById("lista-iscrizioni");
const badgeIscrizioni = document.getElementById("badge-iscrizioni");

const NOMI_CATEGORIE = {
  ultimate: "Ultimate (M)",
  advanced: "Advanced (M)",
  challenge: "Challenge (M)",
  essential: "Essential (M)",
  performance: "Performance (F)",
  intermediate: "Intermediate (F)"
};

function initTabIscrizioni() {
  const q = query(collection(db, "iscrizioni_pending"), orderBy("createdAt", "asc"));
  const unsub = onSnapshot(q, (snap) => {
    renderIscrizioni(snap);
  }, (err) => {
    console.error("Errore listener iscrizioni:", err);
    listaIscrizioni.innerHTML = `<p class="admin-empty">Errore caricamento: ${err.message}</p>`;
  });
  unsubscribers.push(unsub);
}

function renderIscrizioni(snap) {
  const docs = snap.docs;
  if (docs.length === 0) {
    listaIscrizioni.innerHTML = `<p class="admin-empty">Nessuna iscrizione pending.</p>`;
    badgeIscrizioni.hidden = true;
    return;
  }

  badgeIscrizioni.hidden = false;
  badgeIscrizioni.textContent = docs.length;

  listaIscrizioni.innerHTML = "";
  docs.forEach((d) => {
    const data = d.data();
    const card = document.createElement("div");
    card.className = "admin-card";
    card.innerHTML = `
      <div class="admin-card__info">
        <div class="admin-card__title">${escapeHtml(data.nome)}</div>
        <div class="admin-card__meta">
          ${escapeHtml(NOMI_CATEGORIE[data.categoriaId] || data.categoriaId)} ·
          ${escapeHtml(data.box)} ·
          ${escapeHtml(data.contatto)}
          ${data.note ? `<br><em>${escapeHtml(data.note)}</em>` : ""}
        </div>
      </div>
      <div class="admin-card__actions">
        <button class="btn btn--success btn--small" data-action="approva">✅ Approva</button>
        <button class="btn btn--danger btn--small" data-action="rifiuta">❌ Rifiuta</button>
      </div>
    `;

    card.querySelector('[data-action="approva"]').addEventListener("click", () => approvaIscrizione(d.id, data));
    card.querySelector('[data-action="rifiuta"]').addEventListener("click", () => rifiutaIscrizione(d.id, data.nome));
    listaIscrizioni.appendChild(card);
  });
}

async function approvaIscrizione(idPending, dati) {
  if (!confirm(`Approvare l'iscrizione di ${dati.nome}?`)) return;
  try {
    // Crea documento atleta con ID auto-generato
    const atletaId = crypto.randomUUID();
    await setDoc(doc(db, "atleti", atletaId), {
      nome: dati.nome,
      categoriaId: dati.categoriaId,
      box: dati.box,
      createdAt: serverTimestamp()
    });
    await deleteDoc(doc(db, "iscrizioni_pending", idPending));
  } catch (err) {
    console.error("Errore approvazione:", err);
    alert("Errore durante l'approvazione: " + err.message);
  }
}

async function rifiutaIscrizione(idPending, nome) {
  if (!confirm(`Rifiutare e cancellare l'iscrizione di ${nome}?`)) return;
  try {
    await deleteDoc(doc(db, "iscrizioni_pending", idPending));
  } catch (err) {
    console.error("Errore rifiuto:", err);
    alert("Errore durante il rifiuto: " + err.message);
  }
}

// Helper: escape HTML per evitare XSS in stringhe utente
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

- [ ] **Step 2: Test login** — apri `admin.html` nel browser, inserisci password admin (definita Task 2.2). Verifica che:
  - Password sbagliata → "Password non valida"
  - Password giusta → schermata admin appare con tab "Iscrizioni"

- [ ] **Step 3: Test approve flow** — vai su `iscriviti.html`, fai una nuova iscrizione di test. Torna su `admin.html` (tab Iscrizioni) → la nuova iscrizione appare con badge counter. Click "Approva" → iscrizione sparisce, va in `atleti` (verifica su Firebase Console).

- [ ] **Step 4: Test reject** — fai un'altra iscrizione, click "Rifiuta" → sparisce sia da pending che da atleti.

- [ ] **Step 5: Test logout** → schermata login riappare.

- [ ] **Step 6: Commit**

```bash
git add admin.html js/admin.js css/live.css
git commit -m "feat: admin.html con login Firebase e tab Iscrizioni con approve/reject"
```

**Milestone M5 completato.** Admin può loggarsi e approvare/rifiutare iscrizioni in tempo reale.

---

## M6 — Tab Atleti + Inserimento Risultati

**Scopo:** completare i tab admin più operativi: gestione atleti e inserimento risultati per evento.

### Task 6.1: Tab Atleti (lista, ricerca, edit, delete)

**Files:**
- Modify: `admin.html` (panel `data-panel="atleti"`)
- Modify: `js/admin.js` (aggiungere `initTabAtleti`)

- [ ] **Step 1: Sostituisci il panel `data-panel="atleti"`** in `admin.html` con:

```html
<section class="admin-panel" data-panel="atleti">
  <div class="admin-panel__header">
    <h2>Atleti registrati <span id="count-atleti">0</span></h2>
    <button class="btn btn--primary btn--small" id="btn-aggiungi-atleta">+ Aggiungi atleta</button>
  </div>

  <input type="search" id="search-atleti" class="search-input" placeholder="Cerca per nome o box..." autocomplete="off">

  <div id="lista-atleti" class="admin-list">
    <p class="admin-empty">Nessun atleta registrato.</p>
  </div>
</section>

<!-- Modal aggiungi/modifica atleta -->
<div class="modal" id="modal-atleta" hidden>
  <div class="modal__backdrop" data-close="modal-atleta"></div>
  <div class="modal__content">
    <button class="modal__close" data-close="modal-atleta" aria-label="Chiudi">✕</button>
    <h3 id="modal-atleta-title">Aggiungi atleta</h3>
    <form id="form-atleta" class="form" novalidate>
      <input type="hidden" id="atleta-id">
      <div class="form__field">
        <label for="atleta-nome">Nome e Cognome</label>
        <input type="text" id="atleta-nome" required maxlength="80">
      </div>
      <div class="form__field">
        <label for="atleta-categoria">Categoria</label>
        <select id="atleta-categoria" required>
          <option value="">— Seleziona —</option>
          <option value="ultimate">Ultimate (M)</option>
          <option value="advanced">Advanced (M)</option>
          <option value="challenge">Challenge (M)</option>
          <option value="essential">Essential (M)</option>
          <option value="performance">Performance (F)</option>
          <option value="intermediate">Intermediate (F)</option>
        </select>
      </div>
      <div class="form__field">
        <label for="atleta-box">Box</label>
        <input type="text" id="atleta-box" required maxlength="80">
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button type="submit" class="btn btn--primary">Salva</button>
        <button type="button" class="btn btn--ghost" data-close="modal-atleta">Annulla</button>
      </div>
    </form>
  </div>
</div>
```

- [ ] **Step 2: Aggiungi a `css/live.css`** stili modal e search:

```css
.admin-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.search-input {
  width: 100%;
  padding: 0.7rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  font-size: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}
.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}
.modal__content {
  position: relative;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
}
.modal h3 {
  font-family: var(--font-heading);
  margin-bottom: 1.5rem;
}
```

- [ ] **Step 3: Aggiungi in `js/admin.js`** queste funzioni e chiamate (dopo le funzioni iscrizioni esistenti):

```js
// --- TAB ATLETI ---
const countAtleti = document.getElementById("count-atleti");
const searchAtleti = document.getElementById("search-atleti");
const listaAtleti = document.getElementById("lista-atleti");
const btnAggiungiAtleta = document.getElementById("btn-aggiungi-atleta");
const modalAtleta = document.getElementById("modal-atleta");
const formAtleta = document.getElementById("form-atleta");
const modalAtletaTitle = document.getElementById("modal-atleta-title");

let atletiCache = []; // array di {id, nome, categoriaId, box, ...}

function initTabAtleti() {
  const q = query(collection(db, "atleti"), orderBy("nome", "asc"));
  const unsub = onSnapshot(q, (snap) => {
    atletiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderAtleti();
  });
  unsubscribers.push(unsub);
}

function renderAtleti() {
  const filtro = (searchAtleti.value || "").trim().toLowerCase();
  const filtrati = filtro
    ? atletiCache.filter((a) =>
        a.nome.toLowerCase().includes(filtro) ||
        (a.box || "").toLowerCase().includes(filtro))
    : atletiCache;

  countAtleti.textContent = `(${filtrati.length})`;

  if (filtrati.length === 0) {
    listaAtleti.innerHTML = `<p class="admin-empty">${filtro ? "Nessun atleta trovato." : "Nessun atleta registrato."}</p>`;
    return;
  }

  listaAtleti.innerHTML = "";
  filtrati.forEach((a) => {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.innerHTML = `
      <div class="admin-card__info">
        <div class="admin-card__title">${escapeHtml(a.nome)}</div>
        <div class="admin-card__meta">
          ${escapeHtml(NOMI_CATEGORIE[a.categoriaId] || a.categoriaId)} · ${escapeHtml(a.box)}
        </div>
      </div>
      <div class="admin-card__actions">
        <button class="btn btn--ghost btn--small" data-action="edit">Modifica</button>
        <button class="btn btn--danger btn--small" data-action="delete">Elimina</button>
      </div>
    `;
    card.querySelector('[data-action="edit"]').addEventListener("click", () => apriModalEdit(a));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => eliminaAtleta(a));
    listaAtleti.appendChild(card);
  });
}

searchAtleti.addEventListener("input", renderAtleti);

function apriModalNuovo() {
  modalAtletaTitle.textContent = "Aggiungi atleta";
  formAtleta.reset();
  document.getElementById("atleta-id").value = "";
  modalAtleta.hidden = false;
}

function apriModalEdit(a) {
  modalAtletaTitle.textContent = "Modifica atleta";
  document.getElementById("atleta-id").value = a.id;
  document.getElementById("atleta-nome").value = a.nome;
  document.getElementById("atleta-categoria").value = a.categoriaId;
  document.getElementById("atleta-box").value = a.box;
  modalAtleta.hidden = false;
}

btnAggiungiAtleta.addEventListener("click", apriModalNuovo);

document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener("click", () => {
    const targetId = el.dataset.close;
    document.getElementById(targetId).hidden = true;
  });
});

formAtleta.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("atleta-id").value;
  const dati = {
    nome: document.getElementById("atleta-nome").value.trim(),
    categoriaId: document.getElementById("atleta-categoria").value,
    box: document.getElementById("atleta-box").value.trim()
  };
  if (!dati.nome || !dati.categoriaId || !dati.box) return;

  try {
    if (id) {
      // Update
      await setDoc(doc(db, "atleti", id), { ...dati }, { merge: true });
    } else {
      // Create
      const newId = crypto.randomUUID();
      await setDoc(doc(db, "atleti", newId), { ...dati, createdAt: serverTimestamp() });
    }
    modalAtleta.hidden = true;
  } catch (err) {
    console.error("Errore salvataggio atleta:", err);
    alert("Errore: " + err.message);
  }
});

async function eliminaAtleta(a) {
  if (!confirm(`Eliminare ${a.nome} e tutti i suoi risultati?`)) return;
  try {
    // Elimina atleta
    await deleteDoc(doc(db, "atleti", a.id));
    // Nota: eventuali risultati orfani vengono filtrati lato classifica
    // Per pulizia completa servirebbe un batch delete dei risultati.
    // Per scope spartano lasciamo che restino orfani (atleta non c'è più → non appaiono).
  } catch (err) {
    console.error("Errore eliminazione:", err);
    alert("Errore: " + err.message);
  }
}
```

- [ ] **Step 4: Aggiorna `initAdminApp()`** per chiamare `initTabAtleti()`:

```js
function initAdminApp() {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];

  initTabIscrizioni();
  initTabAtleti();
  // initTabRisultati() — Task 6.2
  // initTabStrumenti() — Task 8.1
}
```

- [ ] **Step 5: Test** — apri admin → tab Atleti → vedi gli atleti approvati nei task M5. Click "+ Aggiungi atleta", compila modal, salva. Click "Modifica", cambia box, salva. Click "Elimina", conferma. Verifica che search filtri.

- [ ] **Step 6: Commit**

```bash
git add admin.html js/admin.js css/live.css
git commit -m "feat: tab Atleti con CRUD, search, modal aggiungi/modifica"
```

### Task 6.2: Tab Risultati — search atleta + select evento

**Files:**
- Modify: `admin.html` (panel `data-panel="risultati"`)
- Modify: `js/admin.js`

- [ ] **Step 1: Sostituisci il panel `data-panel="risultati"`** con:

```html
<section class="admin-panel" data-panel="risultati">
  <h2>Inserisci risultato</h2>

  <div class="form__field">
    <label for="ris-search-atleta">1. Cerca atleta</label>
    <input type="search" id="ris-search-atleta" class="search-input" placeholder="Inizia a digitare il nome..." autocomplete="off">
    <div id="ris-suggerimenti" class="suggerimenti" hidden></div>
    <div id="ris-atleta-selezionato" class="atleta-pill" hidden>
      <span id="ris-atleta-nome"></span>
      <button type="button" id="ris-deseleziona" aria-label="Deseleziona">✕</button>
    </div>
  </div>

  <div class="form__field">
    <label for="ris-evento">2. Seleziona evento</label>
    <select id="ris-evento">
      <option value="">— Seleziona evento —</option>
    </select>
  </div>

  <div id="ris-form-dinamico" hidden>
    <!-- Iniettato dal JS in base a scoringType -->
  </div>

  <div id="ris-anteprima" class="ris-anteprima" hidden>
    <div class="ris-anteprima__label">Punteggio EPI calcolato:</div>
    <div class="ris-anteprima__valore" id="ris-anteprima-valore">—</div>
  </div>

  <div id="ris-esistente" class="ris-warning" hidden>
    <strong>⚠️ Risultato esistente</strong>
    <span id="ris-esistente-detail"></span>
    <em>Salvando, sovrascriverai il precedente.</em>
  </div>

  <button type="button" class="btn btn--primary btn--large" id="ris-btn-salva" disabled>Salva risultato</button>
</section>
```

- [ ] **Step 2: Aggiungi stili** in `css/live.css`:

```css
.suggerimenti {
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-top: 0.3rem;
  max-height: 240px;
  overflow-y: auto;
}
.suggerimenti__item {
  padding: 0.7rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.suggerimenti__item:hover {
  background: rgba(255, 60, 0, 0.1);
}
.suggerimenti__item:last-child {
  border-bottom: none;
}
.suggerimenti__nome {
  font-weight: 600;
}
.suggerimenti__meta {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 0.2rem;
}

.atleta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--accent-primary);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 600;
  margin-top: 0.5rem;
}
.atleta-pill button {
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.ris-anteprima {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: rgba(212, 168, 67, 0.08);
  border: 1px solid rgba(212, 168, 67, 0.3);
  border-radius: 6px;
  text-align: center;
}
.ris-anteprima__label {
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}
.ris-anteprima__valore {
  font-family: var(--font-heading);
  font-size: 3rem;
  color: var(--accent-gold);
  font-weight: 700;
}

.ris-warning {
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 165, 0, 0.1);
  border-left: 3px solid orange;
  border-radius: 4px;
  font-size: 0.9rem;
}
.ris-warning strong {
  display: block;
  margin-bottom: 0.3rem;
}
.ris-warning em {
  display: block;
  margin-top: 0.3rem;
  color: var(--text-muted);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
```

- [ ] **Step 3: Aggiungi in `js/admin.js`** import e logica search atleta + select evento (la logica completa form dinamico va nel Task 6.3):

```js
import { calcolaEpi, tempoASecondi, secondiATempo, roundsRepsAReps } from "./epi-formulas.js";
import { getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
```

E in fondo al file aggiungi:

```js
// --- TAB RISULTATI ---
const risSearchAtleta = document.getElementById("ris-search-atleta");
const risSuggerimenti = document.getElementById("ris-suggerimenti");
const risAtletaSelezionato = document.getElementById("ris-atleta-selezionato");
const risAtletaNome = document.getElementById("ris-atleta-nome");
const risDeseleziona = document.getElementById("ris-deseleziona");
const risEvento = document.getElementById("ris-evento");
const risFormDinamico = document.getElementById("ris-form-dinamico");
const risAnteprima = document.getElementById("ris-anteprima");
const risAnteprimaValore = document.getElementById("ris-anteprima-valore");
const risEsistente = document.getElementById("ris-esistente");
const risEsistenteDetail = document.getElementById("ris-esistente-detail");
const risBtnSalva = document.getElementById("ris-btn-salva");

let eventiCache = []; // {id, ...data}
let atletaCorrente = null; // {id, nome, categoriaId, box}
let eventoCorrente = null;

function initTabRisultati() {
  // Carica eventi una volta
  getDocs(query(collection(db, "eventi"), orderBy("numero", "asc"))).then((snap) => {
    eventiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    risEvento.innerHTML = '<option value="">— Seleziona evento —</option>';
    eventiCache.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e.id;
      opt.textContent = `E${e.numero} — ${e.nome} (giorno ${e.giorno})`;
      risEvento.appendChild(opt);
    });
  });
}

// Search atleta con filtro live
risSearchAtleta.addEventListener("input", () => {
  const q = risSearchAtleta.value.trim().toLowerCase();
  if (q.length < 2) {
    risSuggerimenti.hidden = true;
    return;
  }
  const matches = atletiCache.filter((a) =>
    a.nome.toLowerCase().includes(q) || (a.box || "").toLowerCase().includes(q)
  ).slice(0, 8);

  if (matches.length === 0) {
    risSuggerimenti.innerHTML = '<div class="suggerimenti__item">Nessun atleta trovato</div>';
  } else {
    risSuggerimenti.innerHTML = matches.map((a) => `
      <div class="suggerimenti__item" data-id="${a.id}">
        <div class="suggerimenti__nome">${escapeHtml(a.nome)}</div>
        <div class="suggerimenti__meta">${escapeHtml(NOMI_CATEGORIE[a.categoriaId] || a.categoriaId)} · ${escapeHtml(a.box)}</div>
      </div>
    `).join("");
    risSuggerimenti.querySelectorAll(".suggerimenti__item").forEach((item) => {
      item.addEventListener("click", () => {
        const a = atletiCache.find((x) => x.id === item.dataset.id);
        if (a) selezionaAtleta(a);
      });
    });
  }
  risSuggerimenti.hidden = false;
});

function selezionaAtleta(a) {
  atletaCorrente = a;
  risAtletaNome.textContent = `${a.nome} — ${NOMI_CATEGORIE[a.categoriaId] || a.categoriaId}`;
  risAtletaSelezionato.hidden = false;
  risSearchAtleta.value = "";
  risSearchAtleta.hidden = true;
  risSuggerimenti.hidden = true;
  aggiornaFormDinamico();
}

risDeseleziona.addEventListener("click", () => {
  atletaCorrente = null;
  risAtletaSelezionato.hidden = true;
  risSearchAtleta.hidden = false;
  risSearchAtleta.focus();
  aggiornaFormDinamico();
});

risEvento.addEventListener("change", () => {
  const id = risEvento.value;
  eventoCorrente = id ? eventiCache.find((e) => e.id === id) : null;
  aggiornaFormDinamico();
});
```

- [ ] **Step 4: Aggiorna `initAdminApp()`** per chiamare `initTabRisultati()`.

- [ ] **Step 5: Verifica nel browser** — apri admin → tab Inserisci Risultato → digita 2 caratteri di un nome atleta → vedi suggerimenti → click su uno → atleta selezionato (pill colorata). Click ✕ → torni a search. Select evento dal dropdown.

- [ ] **Step 6: Commit**

```bash
git add admin.html js/admin.js css/live.css
git commit -m "feat: tab Risultati con search atleta live + select evento"
```

### Task 6.3: Form dinamico per scoringType

**Files:**
- Modify: `js/admin.js`

- [ ] **Step 1: Aggiungi a `js/admin.js`** la funzione `aggiornaFormDinamico()` che genera input diversi in base allo `scoringType` dell'evento:

```js
function aggiornaFormDinamico() {
  risFormDinamico.innerHTML = "";
  risAnteprima.hidden = true;
  risEsistente.hidden = true;
  risBtnSalva.disabled = true;

  if (!atletaCorrente || !eventoCorrente) {
    risFormDinamico.hidden = true;
    return;
  }

  risFormDinamico.hidden = false;

  // Verifica esistenza risultato precedente
  const risId = `${atletaCorrente.id}_${eventoCorrente.id}`;
  getDoc(doc(db, "risultati", risId)).then((d) => {
    if (d.exists()) {
      const r = d.data();
      const valStr = formatValoreEsistente(r, eventoCorrente);
      risEsistenteDetail.textContent = `${valStr} → ${r.puntiEpi} punti EPI (inserito ${formatTimestamp(r.inseritoIl)})`;
      risEsistente.hidden = false;
    }
  });

  // Genera HTML form in base a scoringType
  const t = eventoCorrente.scoringType;
  let html = "";

  if (t === "weight") {
    html = `
      <div class="form__field">
        <label for="ris-input-weight">3. Peso sollevato (kg)</label>
        <input type="number" id="ris-input-weight" min="0" step="0.5" placeholder="Es. 100" data-input>
      </div>`;
  } else if (t === "reps" || t === "calories") {
    const lbl = t === "reps" ? "Ripetizioni totali" : "Calorie totali";
    html = `
      <div class="form__field">
        <label for="ris-input-num">3. ${lbl}</label>
        <input type="number" id="ris-input-num" min="0" step="1" placeholder="Es. 60" data-input>
      </div>`;
  } else if (t === "time") {
    html = `
      <div class="form__field">
        <label>3. Tempo di completamento</label>
        <div class="form-row">
          <input type="number" id="ris-input-min" min="0" step="1" placeholder="Minuti" data-input>
          <input type="number" id="ris-input-sec" min="0" max="59" step="1" placeholder="Secondi" data-input>
        </div>
      </div>`;
  } else if (t === "rounds_reps") {
    const rpr = eventoCorrente.repsPerRound || 0;
    html = `
      <div class="form__field">
        <label>3. Round + reps extra (${rpr} reps per round)</label>
        <div class="form-row">
          <input type="number" id="ris-input-round" min="0" step="1" placeholder="Round completati" data-input>
          <input type="number" id="ris-input-extra" min="0" step="1" placeholder="Reps extra" data-input>
        </div>
      </div>`;
  }

  risFormDinamico.innerHTML = html;

  // Attacca listener per anteprima EPI live
  risFormDinamico.querySelectorAll("[data-input]").forEach((input) => {
    input.addEventListener("input", aggiornaAnteprima);
  });
}

function aggiornaAnteprima() {
  if (!atletaCorrente || !eventoCorrente) return;
  const valore = leggiPerformance();
  if (valore === null || valore <= 0) {
    risAnteprima.hidden = true;
    risBtnSalva.disabled = true;
    return;
  }
  const punti = calcolaEpi(valore, eventoCorrente, atletaCorrente.categoriaId);
  risAnteprimaValore.textContent = punti;
  risAnteprima.hidden = false;
  risBtnSalva.disabled = false;
}

function leggiPerformance() {
  const t = eventoCorrente.scoringType;
  if (t === "weight") {
    return parseFloat(document.getElementById("ris-input-weight")?.value) || null;
  }
  if (t === "reps" || t === "calories") {
    return parseInt(document.getElementById("ris-input-num")?.value, 10) || null;
  }
  if (t === "time") {
    const m = document.getElementById("ris-input-min")?.value;
    const s = document.getElementById("ris-input-sec")?.value;
    if (!m && !s) return null;
    return tempoASecondi(m, s);
  }
  if (t === "rounds_reps") {
    const r = document.getElementById("ris-input-round")?.value;
    const e = document.getElementById("ris-input-extra")?.value;
    if (!r && !e) return null;
    return roundsRepsAReps(r, e, eventoCorrente.repsPerRound);
  }
  return null;
}

function formatValoreEsistente(r, evento) {
  const t = evento.scoringType;
  if (t === "weight") return `${r.valore} kg`;
  if (t === "reps") return `${r.valore} reps`;
  if (t === "calories") return `${r.valore} cal`;
  if (t === "time") return secondiATempo(r.valore);
  if (t === "rounds_reps") {
    const round = Math.floor(r.valore / (evento.repsPerRound || 1));
    const extra = r.valore % (evento.repsPerRound || 1);
    return `${round} round + ${extra} reps (${r.valore} totali)`;
  }
  return r.valore;
}

function formatTimestamp(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
```

- [ ] **Step 2: Test** — seleziona un atleta, seleziona un evento `weight` (es. Snatch). Vedi un input "kg". Digita 100. Vedi anteprima EPI live (es. "769.2"). Bottone "Salva" si abilita.

- [ ] **Step 3: Test scoringType diversi** — prova un evento `time` (Run+Ski) → vedi 2 input min/sec. Prova `rounds_reps` (Barbell Cycling) → vedi 2 input round/extra.

- [ ] **Step 4: Commit**

```bash
git add js/admin.js
git commit -m "feat: form dinamico inserimento risultato per i 5 scoringType + anteprima EPI"
```

### Task 6.4: Salvataggio risultato + warning sovrascrittura

**Files:**
- Modify: `js/admin.js`

- [ ] **Step 1: Aggiungi a `js/admin.js`** il listener per il bottone Salva:

```js
risBtnSalva.addEventListener("click", async () => {
  if (!atletaCorrente || !eventoCorrente) return;
  const valore = leggiPerformance();
  if (valore === null || valore <= 0) return;

  const t = eventoCorrente.scoringType;
  const valoreSecondario =
    t === "rounds_reps"
      ? parseInt(document.getElementById("ris-input-extra").value, 10) || 0
      : null;

  const puntiEpi = calcolaEpi(valore, eventoCorrente, atletaCorrente.categoriaId);
  const risId = `${atletaCorrente.id}_${eventoCorrente.id}`;

  risBtnSalva.disabled = true;
  risBtnSalva.classList.add("is-loading");

  try {
    await setDoc(doc(db, "risultati", risId), {
      atletaId: atletaCorrente.id,
      eventoId: eventoCorrente.id,
      categoriaId: atletaCorrente.categoriaId,
      valore: valore,
      valoreSecondario: valoreSecondario,
      puntiEpi: puntiEpi,
      inseritoIl: serverTimestamp(),
      inseritoDa: "admin"
    });
    // Reset form
    risFormDinamico.innerHTML = "";
    risFormDinamico.hidden = true;
    risAnteprima.hidden = true;
    risEsistente.hidden = true;
    risEvento.value = "";
    eventoCorrente = null;
    atletaCorrente = null;
    risAtletaSelezionato.hidden = true;
    risSearchAtleta.hidden = false;
    risSearchAtleta.value = "";
    risSearchAtleta.focus();
    showToast(`✅ Salvato: ${puntiEpi} punti EPI`);
  } catch (err) {
    console.error("Errore salvataggio risultato:", err);
    alert("Errore: " + err.message);
  } finally {
    risBtnSalva.disabled = false;
    risBtnSalva.classList.remove("is-loading");
  }
});

// Toast notification semplice
function showToast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("is-visible"), 10);
  setTimeout(() => {
    t.classList.remove("is-visible");
    setTimeout(() => t.remove(), 300);
  }, 2500);
}
```

- [ ] **Step 2: Aggiungi stile toast** in `css/live.css`:

```css
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: #2d8a4e;
  color: #fff;
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  z-index: 2000;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.toast.is-visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
```

- [ ] **Step 3: Test end-to-end inserimento risultato:**
  1. Vai su admin → tab Risultati
  2. Cerca atleta "Mario", click sul match
  3. Seleziona evento Snatch (weight)
  4. Digita 100 kg → anteprima 769.2
  5. Click Salva → toast "✅ Salvato: 769.2 punti EPI"
  6. Verifica in Firebase Console: `risultati/{atletaId}_{eventoId}` esiste con dati corretti

- [ ] **Step 4: Test sovrascrittura** — ripeti con stesso atleta + stesso evento ma valore diverso (es. 110 kg). Dopo aver selezionato atleta+evento, deve apparire warning "⚠️ Risultato esistente: 100 kg → 769.2 punti EPI". Conferma → sovrascrive.

- [ ] **Step 5: Commit**

```bash
git add js/admin.js css/live.css
git commit -m "feat: salvataggio risultato con sovrascrittura, toast conferma"
```

**Milestone M6 completato.** Workflow completo di inserimento risultati funzionante.

---

## M7 — Classifica Live

**Scopo:** `live.html` con tab categorie e classifica realtime aggiornata via listener Firestore.

### Task 7.1: Creare live.html shell

**Files:**
- Create: `live.html`

- [ ] **Step 1: Crea `live.html`**:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Classifica Live — TUSK Protocol Bad Boars</title>
  <meta name="description" content="Classifica EPI in tempo reale del TUSK Protocol del 29-30 Maggio 2026 al Bad Boars CrossFit Sassari.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;600;700&family=Oswald:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="css/design-system.css">
  <link rel="stylesheet" href="css/website.css">
  <link rel="stylesheet" href="css/live.css">

  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏆</text></svg>">
</head>
<body>

  <nav class="nav nav--simple">
    <div class="nav__inner">
      <a href="index.html" class="nav__logo">TUSK <span>BB</span></a>
      <a href="index.html" class="btn btn--ghost btn--small">← Home</a>
    </div>
  </nav>

  <header class="live-hero">
    <div class="container">
      <div class="section__label">Classifica Live</div>
      <h1>TUSK Protocol — Leaderboard EPI</h1>
      <p>29-30 Maggio 2026 · Bad Boars CrossFit Sassari · Aggiornata in tempo reale</p>
    </div>
  </header>

  <section class="live-section">
    <div class="container">
      <div class="live-tabs" role="tablist" id="live-tabs">
        <button class="live-tab is-active" data-cat="ultimate" role="tab">Ultimate (M)</button>
        <button class="live-tab" data-cat="advanced" role="tab">Advanced (M)</button>
        <button class="live-tab" data-cat="challenge" role="tab">Challenge (M)</button>
        <button class="live-tab" data-cat="essential" role="tab">Essential (M)</button>
        <button class="live-tab" data-cat="performance" role="tab">Performance (F)</button>
        <button class="live-tab" data-cat="intermediate" role="tab">Intermediate (F)</button>
      </div>

      <div class="live-status" id="live-status">Caricamento...</div>

      <div class="live-table-wrapper">
        <table class="live-table" id="live-table">
          <thead>
            <tr>
              <th class="live-table__rank">#</th>
              <th class="live-table__atleta">Atleta</th>
              <th class="live-table__box">Box</th>
              <th class="live-table__ev" data-ev="1">E1</th>
              <th class="live-table__ev" data-ev="2">E2</th>
              <th class="live-table__ev" data-ev="3">E3</th>
              <th class="live-table__ev" data-ev="4">E4</th>
              <th class="live-table__ev" data-ev="5">E5</th>
              <th class="live-table__ev" data-ev="6">E6</th>
              <th class="live-table__ev" data-ev="7">E7</th>
              <th class="live-table__ev" data-ev="8">E8</th>
              <th class="live-table__ev" data-ev="9">E9</th>
              <th class="live-table__ev" data-ev="10">E10</th>
              <th class="live-table__epi">EPI Totale</th>
            </tr>
          </thead>
          <tbody id="live-tbody">
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer__logo">TUSK PROTOCOL <span>BAD BOARS</span> EDITION</div>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-md);">
        &copy; 2026 Bad Boars CrossFit · Sassari ·
        <a href="admin.html" style="color: var(--text-muted);">🔒 Area Giudici</a>
      </p>
    </div>
  </footer>

  <script type="module" src="js/live.js"></script>
</body>
</html>
```

- [ ] **Step 2: Aggiungi stili classifica** in `css/live.css`:

```css
.live-hero {
  padding: 6rem 0 2rem;
  text-align: center;
}
.live-hero h1 {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  text-transform: uppercase;
  margin: 0.5rem 0 1rem;
}
.live-hero p {
  color: var(--text-secondary);
}

.live-section {
  padding: 2rem 0 4rem;
}

.live-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.live-tab {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.85rem 1.4rem;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}
.live-tab:hover {
  color: var(--text-primary);
}
.live-tab.is-active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

.live-status {
  text-align: center;
  color: var(--text-muted);
  padding: 1rem;
  font-size: 0.9rem;
}

.live-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.live-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
}
.live-table th,
.live-table td {
  padding: 0.85rem 0.6rem;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.live-table th {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.02);
  position: sticky;
  top: 0;
}
.live-table__rank {
  width: 50px;
  font-weight: 700;
}
.live-table__atleta {
  text-align: left !important;
  min-width: 180px;
  font-weight: 600;
}
.live-table__box {
  text-align: left !important;
  color: var(--text-secondary);
  font-size: 0.85rem;
  min-width: 100px;
}
.live-table__ev {
  width: 70px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.live-table__epi {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-gold);
  width: 100px;
  background: rgba(212, 168, 67, 0.05);
}

.live-table tr.is-podio-1 .live-table__rank { color: gold; }
.live-table tr.is-podio-2 .live-table__rank { color: silver; }
.live-table tr.is-podio-3 .live-table__rank { color: #cd7f32; }

.live-table tr.is-updated {
  animation: rowFlash 1.5s ease-out;
}
@keyframes rowFlash {
  0% { background: rgba(255, 60, 0, 0.3); }
  100% { background: transparent; }
}

.live-table__cell-vuota {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .live-table__atleta { position: sticky; left: 0; background: #0a0a0a; z-index: 1; }
  .live-table th.live-table__atleta { background: #181818; z-index: 2; }
  .live-table__rank { position: sticky; left: 0; background: #0a0a0a; z-index: 1; }
  .live-table th.live-table__rank { background: #181818; z-index: 2; }
}
```

### Task 7.2: Creare js/live.js con listener realtime

**Files:**
- Create: `js/live.js`

- [ ] **Step 1: Crea `js/live.js`**:

```js
// live.js — Classifica EPI realtime
import { db } from "./firebase-config.js";
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

let categoriaCorrente = "ultimate";
let atletiCache = [];      // Array<{id, nome, categoriaId, box}>
let risultatiCache = [];   // Array<{id, atletaId, eventoId, puntiEpi, ...}>
let prevPosizioni = {};    // {atletaId: posizione precedente, per animazione is-updated}

// --- Listeners realtime ---
const unsubAtleti = onSnapshot(
  query(collection(db, "atleti"), orderBy("nome", "asc")),
  (snap) => {
    atletiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  },
  (err) => { console.error("Atleti listener:", err); status.textContent = "Errore caricamento atleti"; }
);

const unsubRisultati = onSnapshot(
  collection(db, "risultati"),
  (snap) => {
    risultatiCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  },
  (err) => { console.error("Risultati listener:", err); status.textContent = "Errore caricamento risultati"; }
);

// --- Tab switching ---
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    categoriaCorrente = tab.dataset.cat;
    prevPosizioni = {}; // reset per non flashare al cambio tab
    render();
  });
});

// --- Render classifica ---
function render() {
  if (atletiCache.length === 0) {
    status.textContent = "Nessun atleta registrato per questa categoria.";
    tbody.innerHTML = "";
    return;
  }

  const atletiCategoria = atletiCache.filter((a) => a.categoriaId === categoriaCorrente);
  if (atletiCategoria.length === 0) {
    status.textContent = "Nessun atleta in questa categoria.";
    tbody.innerHTML = "";
    return;
  }

  // Aggrega risultati per atleta: { atletaId: { eventoId: puntiEpi, totale: number } }
  const aggregato = {};
  for (const a of atletiCategoria) {
    aggregato[a.id] = { atleta: a, perEvento: {}, totale: 0 };
  }
  for (const r of risultatiCache) {
    if (aggregato[r.atletaId]) {
      aggregato[r.atletaId].perEvento[r.eventoId] = r.puntiEpi;
    }
  }
  // Calcola totali
  for (const id in aggregato) {
    const punti = Object.values(aggregato[id].perEvento);
    aggregato[id].totale = totaleEpiAtleta(punti.map((p) => ({ puntiEpi: p })));
  }

  // Ordina per totale desc
  const classifica = Object.values(aggregato).sort((x, y) => y.totale - x.totale);

  // Status
  const numEventiCompleti = classifica.length > 0
    ? Math.max(...classifica.map((x) => Object.keys(x.perEvento).length))
    : 0;
  status.textContent = `${classifica.length} atleti · ${numEventiCompleti}/10 eventi monitorati · aggiornamento live`;

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
      <td class="live-table__box">${escapeHtml(row.atleta.box || "")}</td>
    `;
    for (let n = 1; n <= 10; n++) {
      const punti = row.perEvento[String(n)];
      const txt = punti !== undefined ? Math.round(punti) : "—";
      const cls = punti !== undefined ? "live-table__ev" : "live-table__ev live-table__cell-vuota";
      cells += `<td class="${cls}">${txt}</td>`;
    }
    cells += `<td class="live-table__epi">${row.totale.toLocaleString("it-IT")}</td>`;
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });

  prevPosizioni = newPosizioni;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Cleanup su unload (best practice)
window.addEventListener("beforeunload", () => {
  unsubAtleti();
  unsubRisultati();
});
```

- [ ] **Step 2: Test classifica** — apri `live.html` nel browser. Vedi tab categorie, status "atleti registrati", tabella vuota o popolata.

- [ ] **Step 3: Test realtime** — tieni `live.html` aperto in una tab del browser, apri `admin.html` in un'altra tab. Inserisci un nuovo risultato. Torna su `live.html` → la riga deve aggiornarsi entro ~1 secondo (con flash arancione "is-updated").

- [ ] **Step 4: Test cambio tab categoria** — verifica che cliccando su tab diverso (es. Performance) la tabella mostri solo atleti di quella categoria.

- [ ] **Step 5: Test mobile** — DevTools responsive, verifica che colonne #+nome restino sticky e tabella scrolli orizzontalmente.

- [ ] **Step 6: Commit**

```bash
git add live.html js/live.js css/live.css
git commit -m "feat: classifica live realtime con tab categorie e flash riga aggiornata"
```

**Milestone M7 completato.** Classifica EPI live online, aggiornata in tempo reale a ogni inserimento.

---

## M8 — Tab Strumenti + polish UI

**Scopo:** tab Strumenti (ricalcola EPI, esporta CSV), tab Eventi (read-only), polish finale.

### Task 8.1: Tab Strumenti — Ricalcola EPI

**Files:**
- Modify: `admin.html` (panel `data-panel="strumenti"`)
- Modify: `js/admin.js`

- [ ] **Step 1: Sostituisci panel `data-panel="strumenti"`** in `admin.html`:

```html
<section class="admin-panel" data-panel="strumenti">
  <h2>Strumenti</h2>

  <div class="tools-grid">
    <div class="tool-card">
      <h3>🔁 Ricalcola tutti gli EPI</h3>
      <p>Rilegge tutti i risultati e ricalcola i punti EPI usando i benchmark correnti. Usalo se hai modificato un benchmark dopo aver inserito risultati.</p>
      <button class="btn btn--primary" id="btn-ricalcola">Ricalcola</button>
      <div class="tool-output" id="ricalcola-output"></div>
    </div>

    <div class="tool-card">
      <h3>📊 Esporta classifica CSV</h3>
      <p>Esporta in CSV la classifica completa di una categoria, una riga per atleta con punteggi per evento e totale EPI.</p>
      <select id="export-categoria" class="search-input" style="margin-bottom: 0.5rem;">
        <option value="ultimate">Ultimate (M)</option>
        <option value="advanced">Advanced (M)</option>
        <option value="challenge">Challenge (M)</option>
        <option value="essential">Essential (M)</option>
        <option value="performance">Performance (F)</option>
        <option value="intermediate">Intermediate (F)</option>
      </select>
      <button class="btn btn--primary" id="btn-export">Scarica CSV</button>
    </div>

    <div class="tool-card">
      <h3>📋 Esporta atleti CSV</h3>
      <p>Lista atleti registrati con nome, categoria, box.</p>
      <button class="btn btn--ghost" id="btn-export-atleti">Scarica atleti.csv</button>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Aggiungi stile** in `css/live.css`:

```css
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
.tool-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 1.5rem;
}
.tool-card h3 {
  font-family: var(--font-heading);
  margin-bottom: 0.75rem;
}
.tool-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}
.tool-output {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  white-space: pre-wrap;
  display: none;
}
.tool-output.is-visible {
  display: block;
}
```

- [ ] **Step 3: Aggiungi in `js/admin.js`**:

```js
import { writeBatch } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
```

E in fondo:

```js
// --- TAB STRUMENTI ---
const btnRicalcola = document.getElementById("btn-ricalcola");
const ricalcolaOutput = document.getElementById("ricalcola-output");

btnRicalcola.addEventListener("click", async () => {
  if (!confirm("Ricalcolare TUTTI gli EPI? Operazione richiede ~30 secondi.")) return;
  ricalcolaOutput.classList.add("is-visible");
  ricalcolaOutput.textContent = "Lettura risultati...";
  btnRicalcola.disabled = true;

  try {
    // Carica tutti gli eventi (per benchmark aggiornati)
    const eventiSnap = await getDocs(collection(db, "eventi"));
    const eventi = {};
    eventiSnap.docs.forEach((d) => { eventi[d.id] = d.data(); });

    // Carica tutti i risultati
    const risSnap = await getDocs(collection(db, "risultati"));
    let aggiornati = 0;
    let invariati = 0;

    // Batch write (Firestore limita a 500 operazioni per batch)
    const docs = risSnap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 400);
      chunk.forEach((d) => {
        const r = d.data();
        const evento = eventi[r.eventoId];
        if (!evento) return;
        const nuovi = calcolaEpi(r.valore, evento, r.categoriaId);
        if (Math.abs(nuovi - (r.puntiEpi || 0)) > 0.05) {
          batch.update(doc(db, "risultati", d.id), { puntiEpi: nuovi });
          aggiornati++;
        } else {
          invariati++;
        }
      });
      await batch.commit();
      ricalcolaOutput.textContent = `Processati ${Math.min(i + 400, docs.length)}/${docs.length}...`;
    }
    ricalcolaOutput.textContent = `✅ Ricalcolo completato.\nAggiornati: ${aggiornati}\nInvariati: ${invariati}\nTotale: ${docs.length}`;
  } catch (err) {
    ricalcolaOutput.textContent = `❌ Errore: ${err.message}`;
  } finally {
    btnRicalcola.disabled = false;
  }
});
```

- [ ] **Step 4: Test** — Click "Ricalcola" → conferma → vedi progress text → fine "✅ Aggiornati: X, Invariati: Y".

- [ ] **Step 5: Commit**

```bash
git add admin.html js/admin.js css/live.css
git commit -m "feat: tab Strumenti con bottone Ricalcola tutti gli EPI"
```

### Task 8.2: Tab Strumenti — Esporta CSV

**Files:**
- Modify: `js/admin.js`

- [ ] **Step 1: Aggiungi in `js/admin.js`**:

```js
// Export classifica per categoria
const btnExport = document.getElementById("btn-export");
const exportCategoria = document.getElementById("export-categoria");

btnExport.addEventListener("click", async () => {
  const cat = exportCategoria.value;
  try {
    const [atletiSnap, risSnap] = await Promise.all([
      getDocs(collection(db, "atleti")),
      getDocs(collection(db, "risultati"))
    ]);
    const atleti = atletiSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((a) => a.categoriaId === cat);
    const risultati = risSnap.docs.map((d) => d.data());

    // Header
    const headers = ["Pos", "Nome", "Box"];
    for (let n = 1; n <= 10; n++) headers.push(`E${n}`);
    headers.push("EPI Totale");

    // Aggrega
    const rows = atleti.map((a) => {
      const perEv = {};
      risultati.filter((r) => r.atletaId === a.id).forEach((r) => {
        perEv[r.eventoId] = r.puntiEpi;
      });
      const totale = Object.values(perEv).reduce((acc, p) => acc + (p || 0), 0);
      return { atleta: a, perEv, totale };
    }).sort((x, y) => y.totale - x.totale);

    // Build CSV
    let csv = headers.join(";") + "\n";
    rows.forEach((row, idx) => {
      const cells = [
        idx + 1,
        `"${row.atleta.nome.replace(/"/g, '""')}"`,
        `"${(row.atleta.box || "").replace(/"/g, '""')}"`
      ];
      for (let n = 1; n <= 10; n++) {
        cells.push(row.perEv[String(n)] !== undefined ? row.perEv[String(n)].toFixed(1) : "");
      }
      cells.push(row.totale.toFixed(1));
      csv += cells.join(";") + "\n";
    });

    // Download
    downloadCsv(csv, `classifica-${cat}-${nowStr()}.csv`);
  } catch (err) {
    alert("Errore export: " + err.message);
  }
});

// Export atleti
document.getElementById("btn-export-atleti").addEventListener("click", async () => {
  try {
    const snap = await getDocs(query(collection(db, "atleti"), orderBy("nome", "asc")));
    let csv = "Nome;Categoria;Box\n";
    snap.docs.forEach((d) => {
      const a = d.data();
      csv += `"${a.nome.replace(/"/g, '""')}";${a.categoriaId};"${(a.box || "").replace(/"/g, '""')}"\n`;
    });
    downloadCsv(csv, `atleti-${nowStr()}.csv`);
  } catch (err) {
    alert("Errore: " + err.message);
  }
});

function downloadCsv(content, filename) {
  // BOM per Excel italiano
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function nowStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
}
```

- [ ] **Step 2: Test** — Tab Strumenti → seleziona categoria → "Scarica CSV" → file `classifica-ultimate-20260508-1430.csv` scaricato. Apri in Excel, verifica colonne e valori.

- [ ] **Step 3: Commit**

```bash
git add js/admin.js
git commit -m "feat: tab Strumenti con esporta classifica CSV per categoria + atleti CSV"
```

### Task 8.3: Tab Eventi (read-only)

**Files:**
- Modify: `admin.html` (panel `data-panel="eventi"`)
- Modify: `js/admin.js`

- [ ] **Step 1: Sostituisci panel `data-panel="eventi"`**:

```html
<section class="admin-panel" data-panel="eventi">
  <h2>Eventi e benchmark</h2>
  <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Sola lettura. Per modificare i benchmark, modifica i documenti in Firebase Console > Firestore > <code>eventi</code>.</p>
  <div id="lista-eventi" class="admin-list"></div>
</section>
```

- [ ] **Step 2: Aggiungi in `js/admin.js`**:

```js
function initTabEventi() {
  getDocs(query(collection(db, "eventi"), orderBy("numero", "asc"))).then((snap) => {
    const lista = document.getElementById("lista-eventi");
    if (snap.empty) {
      lista.innerHTML = '<p class="admin-empty">Nessun evento configurato.</p>';
      return;
    }
    lista.innerHTML = "";
    snap.docs.forEach((d) => {
      const e = d.data();
      const card = document.createElement("div");
      card.className = "admin-card";
      const benchmarksStr = Object.entries(e.benchmarks || {})
        .map(([k, v]) => `<span style="margin-right:1rem;"><strong>${k}:</strong> ${v}</span>`)
        .join("");
      card.innerHTML = `
        <div class="admin-card__info" style="flex-basis: 100%;">
          <div class="admin-card__title">E${e.numero} — ${escapeHtml(e.nome)}</div>
          <div class="admin-card__meta">
            ${escapeHtml(e.scoringType)} · ${escapeHtml(e.scoringDirection)} · giorno ${e.giorno}<br>
            <small>${benchmarksStr}</small>
          </div>
        </div>
      `;
      lista.appendChild(card);
    });
  });
}
```

- [ ] **Step 3: Aggiorna `initAdminApp()`** per chiamare `initTabEventi()`.

- [ ] **Step 4: Commit**

```bash
git add admin.html js/admin.js
git commit -m "feat: tab Eventi read-only con benchmarks visibili"
```

### Task 8.4: Polish UI finale

- [ ] **Step 1: Verifica meta tags Open Graph** in `index.html`, `live.html`, `iscriviti.html`. Aggiungi se mancanti dopo `<title>`:

```html
<meta property="og:title" content="TUSK Protocol — Bad Boars Edition">
<meta property="og:description" content="29-30 Maggio 2026, Sassari. 10 eventi, 6 categorie, classifica EPI live.">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
```

- [ ] **Step 2: Verifica favicon** consistente. Tutte le pagine usano emoji SVG inline (già presenti nei task precedenti).

- [ ] **Step 3: Verifica responsive** — DevTools mobile (375px width) per tutte le pagine: index, iscriviti, live, admin. Niente overflow orizzontale, bottoni cliccabili (min 44px).

- [ ] **Step 4: Console check** — apri ogni pagina in DevTools, verifica zero errori in Console.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "polish: meta tag OG, verifica responsive, fix minor issues"
```

**Milestone M8 completato.** Tutti i tab admin funzionanti, esportazioni CSV, polish UI.

---

## M9 — Testing end-to-end + deploy finale

**Scopo:** scenario di gara simulato, bugfix, deploy production.

### Task 9.1: Pulizia dati di test e seed produzione

- [ ] **Step 1: Firebase Console > Firestore Database** — elimina manualmente tutti i documenti di test creati durante lo sviluppo:
  - `iscrizioni_pending` → svuota tutto
  - `atleti` → svuota tutto
  - `risultati` → svuota tutto
  - `categorie` e `eventi` → **NON toccare**, restano

- [ ] **Step 2: Verifica che le collezioni `categorie` e `eventi`** abbiano i 6 + 10 documenti corretti dal Task 2.6 e 2.7.

### Task 9.2: Test end-to-end con scenario realistico

- [ ] **Step 1: Test iscrizione pubblica**
  1. Apri `iscriviti.html` in modalità **incognito** (per non avere session admin attiva)
  2. Compila form: "Mario Rossi", Ultimate, "Bad Boars", "+39 333 1111111"
  3. Submit → vedi schermata success
  4. Apri Firebase Console → conferma documento in `iscrizioni_pending`

- [ ] **Step 2: Test approvazione admin**
  1. Apri `admin.html` in tab normale, login con password
  2. Tab Iscrizioni → vedi Mario Rossi pending
  3. Click "Approva" → conferma → sparisce
  4. Tab Atleti → vedi Mario Rossi nella lista

- [ ] **Step 3: Test inserimento risultati**
  1. Apri `live.html` in seconda tab del browser (puoi rimanere admin)
  2. Tab Ultimate → vedi Mario nella tabella, tutti i campi evento "—", EPI "0"
  3. Torna su admin → tab Inserisci Risultato
  4. Cerca "Mario", select "E1 — 1RM Snatch", inserisci 100 kg → vedi anteprima 769 → Salva
  5. **Live tab si deve aggiornare automaticamente** entro 1-2 secondi: cella E1 diventa "769", EPI Totale diventa "769.2"
  6. Inserisci E2, E3, ..., E10 con valori diversi
  7. Verifica che EPI Totale sia somma di tutti i punti
  8. Inserisci risultato per altri 2-3 atleti di test (creali via tab Atleti) → verifica ordinamento per EPI desc

- [ ] **Step 4: Test sovrascrittura**
  1. Re-inserisci E1 con 110 kg per Mario Rossi
  2. Vedi warning "Risultato esistente"
  3. Salva → live mostra il nuovo valore (846 invece di 769)

- [ ] **Step 5: Test ricalcola EPI**
  1. Modifica un benchmark in Firebase Console > eventi/1 (es. ultimate da 130 a 140)
  2. Admin > tab Strumenti > Ricalcola
  3. Live: i punti E1 cambiano automaticamente

- [ ] **Step 6: Test export CSV**
  1. Tab Strumenti → seleziona Ultimate → Scarica CSV
  2. Apri in Excel: verifica colonne e ordinamento

- [ ] **Step 7: Test sicurezza**
  1. Apri DevTools console su `live.html` (non loggato come admin):
  ```js
  const { db } = await import("./js/firebase-config.js");
  const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js");
  await addDoc(collection(db, "risultati"), { atletaId: "x", puntiEpi: 99999 });
  ```
  2. **Atteso:** Promise reject con "permission denied"

- [ ] **Step 8: Test mobile**
  1. Apri `admin.html` su smartphone (collegati al deploy Netlify, non localhost)
  2. Login funziona, tab navigation scrollabile
  3. Inserisci un risultato → completi flusso
  4. Apri `live.html` su altro telefono → vedi aggiornamento

- [ ] **Step 9: Pulisci dati di test post-test** — elimina tutti gli atleti/risultati/iscrizioni di prova da Firebase Console.

### Task 9.3: Documentazione operativa per il giorno della gara

**Files:**
- Create: `docs/GIORNO_GARA.md`

- [ ] **Step 1: Crea `docs/GIORNO_GARA.md`** con istruzioni operative:

```markdown
# TUSK Protocol — Guida Giorno Gara

## Credenziali
- **URL admin:** https://benevolent-narwhal-1c8444.netlify.app/admin.html
- **URL live (pubblico):** https://benevolent-narwhal-1c8444.netlify.app/live.html
- **URL iscrizioni (pubblico):** https://benevolent-narwhal-1c8444.netlify.app/iscriviti.html
- **Password admin:** [annota qui la password Firebase, NON committare in git]

## Pre-gara (mattina del 29 Maggio)
1. Apri admin > tab Iscrizioni: approva tutte le iscrizioni rimaste pending
2. Tab Atleti: verifica numero totale, controlla che ognuno abbia categoria corretta
3. Apri live.html su un monitor/tv del box per il pubblico

## Durante la gara
1. Distribuisci la password admin SOLO ai giudici designati (max 5-6 persone)
2. Ogni giudice apre admin.html sul proprio telefono e fa login una volta (resta loggato)
3. Inserimento risultato:
   - Tab Inserisci Risultato
   - Cerca atleta per nome
   - Seleziona evento dal dropdown
   - Inserisci performance, vedi anteprima EPI
   - Salva
4. Se un atleta DNF (non finisce/non riesce): non inserire risultato per quell'evento, l'EPI totale sarà parziale

## Risoluzione problemi
- **Giudice non si logga:** verifica password (case-sensitive). Reset password possibile da Firebase Console > Authentication > Users > Mario Rossi (atleta admin) > kebab menu > Reset password
- **Risultato sbagliato:** seleziona stesso atleta + stesso evento, inserisci nuovo valore, conferma sovrascrittura
- **Benchmark errato per categoria:** modifica in Firebase Console > Firestore > eventi/{N} > benchmarks > {categoria}, poi tab Strumenti > Ricalcola

## Post-gara
1. Tab Strumenti > Esporta CSV per ogni categoria → archivio premiazioni
2. Tab Strumenti > Esporta atleti CSV → backup
3. Spegni tutto, sopravvivi al party
```

- [ ] **Step 2: Aggiungi entry a `.gitignore`** se vuoi tenere la guida senza la password reale committata, oppure scrivi solo "annota qui la password" e tienila offline.

- [ ] **Step 3: Commit**

```bash
git add docs/GIORNO_GARA.md
git commit -m "docs: guida operativa giorno gara con credenziali e troubleshooting"
```

### Task 9.4: Deploy finale e verifica live

- [ ] **Step 1: Push tutto su main**

```bash
git push origin main
```

- [ ] **Step 2: Aspetta deploy Netlify** (1-2 minuti) e visita https://benevolent-narwhal-1c8444.netlify.app/

- [ ] **Step 3: Smoke test sul deploy live:**
  - Landing carica
  - Click "Iscriviti" → form pubblico funziona
  - Click "Live" → classifica vuota ma carica
  - `/admin.html` → login funziona
  - Inserisci 1 atleta + 1 risultato test → vedi live aggiornarsi

- [ ] **Step 4: Pulisci atleti/risultati di test prima del 29 Maggio.**

**Milestone M9 completato. PROGETTO LIVE E PRONTO.**

---

## Self-Review notes

Ho mappato ogni sezione dello spec a uno o più task:
- §1 Contesto, §2 Decisioni di scope → riflessi nelle scelte tecniche dei vari task (no separato)
- §3 Architettura → Task 2.4 (firebase-config), 4.1-4.3 (iscriviti), 5.1-5.2 (admin), 7.1-7.2 (live)
- §4 Data model Firestore → Task 2.6 (categorie), 2.7 (eventi), 4.3 (iscrizioni_pending), 5.2 (atleti via approve), 6.4 (risultati). Security rules → Task 2.5
- §5 Calcolo EPI → Task 3.1, 3.2; uso in 6.3, 6.4, 7.2
- §6 Flussi utente → coperti dai task admin (5, 6, 8) e live (7) e iscrizione (4)
- §7 Aggiornamento contenuti statici → tutti i task M1
- §8 Roadmap → struttura del piano stesso
- §9 Rischi e mitigazioni → Task 8.1 (ricalcola EPI), 9.3 (documentazione recovery), security rules in 2.5

Coperto tutto. Niente placeholder. Tipi consistenti (es. `categoriaId` minuscolo ovunque, `eventoId` come stringa "1"-"10"). Firmato.

---

**Plan complete and saved to `progetti/xenom/docs/superpowers/plans/2026-05-08-tusk-protocol-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (raccomandato)** — Dispatcho un subagent per task, review tra un task e l'altro, iterazione veloce.

**2. Inline Execution** — Eseguo i task in questa sessione, batch con checkpoint per review.

Quale approccio preferisci?
