# 🐗 TUSK Protocol — Share Kit Social

Testi pronti da copia-incollare per spammare l'evento su WhatsApp, Instagram e dove vuoi.

**Link ufficiale iscrizione:** https://benevolent-narwhal-1c8444.netlify.app/iscriviti.html

---

## 📸 Immagini

Vai su `tools/share-preview.html`, apri in browser, click su "Scarica PNG":
- `tusk-square-1080.png` — **post Instagram feed** + chat WhatsApp
- `tusk-story-1080x1920.png` — **Instagram story** + WhatsApp status (verticale)
- `tusk-og-1200x630.png` — **anteprima link** quando incolli URL su WhatsApp/Telegram

Il QR code dentro l'immagine porta direttamente a iscriviti.html.

### 🔌 Cablare l'anteprima link sulle pagine

I meta-tag OG su `index.html`, `iscriviti.html`, `live.html`, `podio.html` puntano a `/assets/social/tusk-og-1200x630.png`. Per attivare l'anteprima:

1. Genera l'immagine landscape da `tools/share-preview.html`
2. Crea la cartella `assets/social/` se non esiste
3. Salva il file scaricato come `assets/social/tusk-og-1200x630.png`
4. Deploy: `npx netlify-cli deploy --prod --dir .`
5. Test anteprima: incolla il link in una chat WhatsApp con te stesso

WhatsApp cacha le anteprime aggressivamente. Se cambi l'immagine dopo aver già condiviso, aggiungi `?v=2` all'URL per forzare il refresh dell'anteprima.

---

## 1️⃣ Lancio iscrizioni — "Apertura"

### Instagram (feed)

> **TUSK PROTOCOL — BAD BOARS EDITION 🐗**
>
> 29-30 Maggio 2026 — Bad Boars CrossFit, Sassari.
> 10 eventi. 2 giorni. 6 categorie. Una sola classifica EPI live.
>
> 🏋️‍♂️ Ultimate · Advanced · Challenge · Essential
> 🏋️‍♀️ Performance · Intermediate
>
> 💰 10€ in contanti al box · Iscrizioni online aperte adesso.
> 🔗 Link in bio (oppure scansiona il QR nella story).
>
> Chi sale sul podio scrive il proprio EPI nella storia di Bad Boars.
>
> #tuskprotocol #badboarscrossfit #crossfitsassari #crossfitsardegna #crossfit #wod #competition #crossfititalia #sassari #crossfitcommunity #epi #badboars

### Instagram (story)

Usa l'immagine **story 1080×1920**. Sopra metti:
- Sticker conto alla rovescia → "29 Maggio 2026"
- Sticker link → iscriviti.html
- Sticker domanda → "Quale categoria farai?"

### WhatsApp (broadcast / gruppo)

```
🐗 TUSK PROTOCOL — Bad Boars Edition

29-30 Maggio 2026 · Bad Boars CrossFit Sassari
10 eventi · 2 giorni · 6 categorie · 10€ al box

Iscriviti subito (form online, approvazione manuale):
https://benevolent-narwhal-1c8444.netlify.app/iscriviti.html

Salva l'immagine e girala a chi pensi sia pronto.
```

### WhatsApp (status / stato)

Usa l'immagine story 9:16. Caption opzionale: `🐗 29-30 Mag · iscrizioni aperte ⬆️`

---

## 2️⃣ Reminder pre-evento (T-7 giorni)

### Instagram (feed)

> ⚡ **MENO 7 GIORNI AL TUSK PROTOCOL** ⚡
>
> Le iscrizioni si chiudono nei prossimi giorni. Ultimo treno per Bad Boars.
>
> 6 categorie pensate per ogni livello — dall'Ultimate al Challenge, dalla Performance all'Intermediate. Tu in quale ti vedi?
>
> 🔗 Link in bio · 10€ al box
>
> #tuskprotocol #lastcall #badboarscrossfit #crossfitsassari #crossfit

### WhatsApp

```
⚡ Tra una settimana TUSK PROTOCOL.

Hai mandato il modulo? Se non l'hai fatto, ora è il momento — i posti per categoria sono limitati.

🔗 https://benevolent-narwhal-1c8444.netlify.app/iscriviti.html

Domande sui WOD o sulle categorie? Rispondi qui.
```

---

## 3️⃣ Durante l'evento — "Live in corso"

### Instagram (story / feed)

> 🔴 **LIVE — TUSK PROTOCOL day 1**
>
> La classifica EPI si aggiorna in tempo reale dopo ogni WOD. Vai a vederla:
> 🔗 link in bio → CLASSIFICA LIVE
>
> O passa al box per fare il tifo. Atmosfera elettrica.
>
> #tuskprotocol #live #badboarscrossfit #crossfit #sassari

### WhatsApp (status durante il giorno)

```
🔴 Stiamo gareggiando.
Classifica live: https://benevolent-narwhal-1c8444.netlify.app/live.html
```

---

## 4️⃣ Annuncio podio — "Ringraziamenti"

### Instagram (carosello: foto vincitori + immagine podio)

> 🥇 **TUSK PROTOCOL — È andato in archivio.**
>
> Grazie a tutti gli atleti che hanno spinto fino all'ultimo metro, ai giudici che hanno tenuto il timing, allo staff Bad Boars che ha trasformato il box in un'arena.
>
> 🥇 Ultimate: @[nome] — [EPI tot] punti
> 🥇 Advanced: @[nome]
> 🥇 Challenge: @[nome]
> 🥇 Essential: @[nome]
> 🥇 Performance: @[nome]
> 🥇 Intermediate: @[nome]
>
> Classifica completa: link in bio.
>
> Già al lavoro per la prossima edizione. Tieni d'occhio Bad Boars.
>
> #tuskprotocol #podio #badboarscrossfit #crossfitsassari #champions

### WhatsApp (broadcast post-evento)

```
🥇 TUSK PROTOCOL — chiuso.

Ecco il podio:
🥇 Ultimate — [nome]
🥇 Advanced — [nome]
🥇 Challenge — [nome]
🥇 Essential — [nome]
🥇 Performance — [nome]
🥇 Intermediate — [nome]

Classifica completa qui:
https://benevolent-narwhal-1c8444.netlify.app/live.html

Grazie a tutti. Alla prossima 🐗
```

---

## 🎯 Suggerimenti pratici

- **Bio Instagram di Bad Boars**: metti come unico link `https://benevolent-narwhal-1c8444.netlify.app/iscriviti.html` durante la campagna iscrizioni, poi sostituisci con `/live.html` durante l'evento, infine `/podio.html` per la cerimonia.
- **WhatsApp anteprima**: il primo messaggio col link genera l'anteprima OG. Se vuoi forzare l'aggiornamento dell'anteprima dopo modifiche, aggiungi un `?v=2` al link (es. `iscriviti.html?v=2`).
- **Hashtag ricorrenti**: `#tuskprotocol #badboarscrossfit #crossfitsassari #crossfitsardegna #crossfit #wod #competition #italy #sassari`. Tieni costanti i primi 3-4 per ranking.
- **Stories sequenziali**: posta 3 story consecutive: (1) data e logo, (2) categorie, (3) link iscrizione con sticker. Aumenta il completion rate.
- **Tagga sempre il box**: `@badboarscrossfit` (verifica handle col coach prima della prima campagna — questo è un TODO aperto).

---

## ✏️ Note

- Sostituisci `[nome]` con i nomi reali dopo le premiazioni.
- Se cambi il dominio/URL, aggiorna sia questo file che i meta-tag OG sulle pagine HTML.
- Le 3 immagini PNG generate da `tools/share-preview.html` puoi anche salvarle direttamente in `assets/social/` per archivio (cartella opzionale).

**Ultima modifica:** 2026-05-09
