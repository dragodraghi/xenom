# TUSK Protocol — Guida Operativa Giorno Gara

**Evento:** 29-30 Maggio 2026 · Bad Boars CrossFit Sassari
**App live:** https://benevolent-narwhal-1c8444.netlify.app/

---

## URL utili

| Pagina | URL | Pubblico/Riservato |
|---|---|---|
| Landing | `/index.html` | Pubblico |
| Form iscrizione | `/iscriviti.html` | Pubblico |
| Classifica live | `/live.html` | Pubblico |
| Area giudici | `/admin.html` | Riservata (login) |
| Setup iniziale | `/setup.html` | Riservata (login) |

## Credenziali admin

- **Email admin (hardcoded):** `tusk.admin@gmail.com`
- **Password:** _annota qui la password vera prima dell'evento — NON committarla in git_

⚠️ Distribuisci la password **solo** ai giudici designati (max 5-6 persone). Chi ha la password può inserire/modificare risultati e gestire atleti.

---

## Pre-evento (entro Mercoledì 27 Maggio)

### 1. Verifica eventi e benchmark
1. Apri `admin.html` → tab **Eventi**
2. Controlla che i 10 eventi abbiano i benchmark **veri** (non più placeholder) per le 6 categorie
3. Se devi modificare un benchmark:
   - Firebase Console → Firestore → `tusk_eventi` → seleziona evento (1-10) → modifica campo `benchmarks.{categoria}`
   - Torna in `admin.html` → tab **Strumenti** → click **"Ricalcola tutti gli EPI"**

### 2. Approva tutte le iscrizioni rimaste
1. Tab **Iscrizioni** → ci sono iscrizioni pending?
2. Per ognuna: verifica dati, click **✅ Approva** oppure **✕ Rifiuta**
3. Conferma totale atleti in tab **Atleti**

### 3. (Opzionale) Inserisci atleti dell'ultimo minuto manualmente
1. Tab **Atleti** → **+ Aggiungi atleta** → compila → Salva

### 4. Test classifica live
1. Apri `live.html` su un secondo browser/dispositivo
2. Inserisci un risultato di prova in admin
3. Verifica che la classifica si aggiorni automaticamente

### 5. Stampa cose utili
- Lista atleti per categoria (Tab Strumenti → Esporta atleti CSV → stampa)
- Password admin grande su un foglio per i giudici

---

## Durante la gara

### Setup giudici (mattina del 29 Maggio)
1. Distribuisci la password admin ai giudici designati
2. Ogni giudice apre `admin.html` sul proprio telefono e fa login una volta
3. Firebase mantiene la sessione: NON serve ri-loggare durante la giornata
4. Ogni giudice tiene aperta la pagina su tab **Inserisci Risultato**

### Workflow inserimento risultato (giudice)
1. Tab **Inserisci Risultato**
2. **Cerca atleta**: digita 2-3 lettere del nome → click sul suggerimento
3. **Seleziona evento** dal dropdown
4. **Inserisci performance**:
   - Eventi `weight`: 1 campo kg
   - Eventi `reps` / `calories`: 1 campo numerico
   - Eventi `time`: 2 campi minuti+secondi
   - Eventi `rounds_reps`: 2 campi round + reps extra
5. **Anteprima EPI** appare in tempo reale (riquadro dorato)
6. Click **"Salva risultato"**
7. Toast verde di conferma → form si resetta automaticamente

### Sovrascrittura risultato (es. correzione errore)
1. Stesso flusso: cerca atleta → seleziona stesso evento
2. Apparirà warning arancione "⚠️ Risultato già presente: ..."
3. Inserisci il valore corretto → Salva → conferma sovrascrittura

### Display classifica per il pubblico
- Apri `live.html` su un monitor/TV nel box (Chromecast o cavo HDMI)
- La classifica si aggiorna automaticamente a ogni inserimento (entro ~1-2 secondi)
- Cambia tab categoria a seconda del momento (es. durante WOD Ultimate, mostra Ultimate)

---

## Risoluzione problemi

| Problema | Soluzione |
|---|---|
| Giudice non riesce a fare login | Verifica password (case-sensitive). Se persiste, reset da Firebase Console → Authentication → user `tusk.admin@gmail.com` → menu kebab → "Reset password" |
| Risultato sbagliato salvato | Stesso flusso di inserimento: ricerca atleta + stesso evento → modifica valore → conferma sovrascrittura |
| Atleta non appare nella search | Verifica in tab **Atleti** che esista (potrebbe essere in `tusk_iscrizioni_pending`, va prima approvato) |
| Benchmark errato per una categoria | Firebase Console → `tusk_eventi/{N}` → modifica campo `benchmarks.{categoria}` → tab **Strumenti** → "Ricalcola tutti gli EPI" |
| Classifica live non si aggiorna | Hard refresh della pagina live (Ctrl+Shift+R). Se persiste, controlla connessione internet |
| Atleta cancellato per errore | Tab **Atleti** → **+ Aggiungi atleta** → ricrealo. I risultati esistenti restano orfani in DB ma non visibili: vanno re-inseriti |
| Iscrizioni online non funzionano (form pubblico) | Verifica `iscriviti.html` da incognito. Probabili cause: browser molto vecchio (no ES modules), AdBlocker aggressivo |

---

## Post-evento

### 1. Esporta classifiche
1. Tab **Strumenti** → seleziona categoria → "Scarica CSV"
2. Ripeti per tutte le 6 categorie
3. Salva in cartella archivio per cerimonia premiazione

### 2. Esporta lista atleti finale
- Tab **Strumenti** → "Scarica atleti.csv"

### 3. (Opzionale) Pulizia dati per archivio
- Se vuoi conservare i dati dell'edizione 2026: NON cancellare nulla, sono già archiviati in Firestore
- Se vuoi resettare per un'edizione futura: **DOPO aver scaricato i CSV**, vai su Firebase Console e svuota `tusk_atleti`, `tusk_risultati`, `tusk_iscrizioni_pending`. NON svuotare `tusk_categorie` e `tusk_eventi`.

### 4. Sicurezza post-evento
- Cambia la password admin (Firebase Console → Authentication → kebab → "Reset password")
- Revoca eventuali Personal Access Token Netlify creati per il deploy

---

## Architettura tecnica (riferimento)

- **Frontend:** HTML/CSS/JS vanilla + Firebase SDK v10 via CDN. No build step.
- **Backend:** Firebase Firestore (riuso progetto `schedinone-2026` con prefisso collezioni `tusk_*`)
- **Auth:** Firebase Email/Password (singolo account admin, email hardcoded)
- **Hosting:** Netlify (auto-deploy disattivato, deploy manuale via `netlify deploy --prod`)
- **Repo:** https://github.com/dragodraghi/xenom

### Collezioni Firestore
- `tusk_categorie` (6 docs, read-only) — id = slug categoria
- `tusk_eventi` (10 docs, read-only via UI; modificabili via Console) — id = "1"-"10"
- `tusk_atleti` (CRUD admin) — id auto-generato
- `tusk_iscrizioni_pending` (write pubblico, read/delete admin) — id auto-generato
- `tusk_risultati` (CRUD admin) — id composito `{atletaId}_{eventoId}`

### Schedinone è isolato
Le rules garantiscono che l'admin TUSK NON possa scrivere su collezioni Schedinone (`games`, `users`). Test verificabile via `setup.html` → "Tenta scrittura su Schedinone".
