# XENOM // Tusk Protocol — Bad Boars Edition

Landing page + presentazione per il collaudo locale del format XENOM Tusk Protocol al box CrossFit Bad Boars di Sassari.

**Evento:** venerdì 29 e sabato 30 Maggio 2026 — 10 eventi su 2 giornate, 6 categorie TUSK.
**Lancio mondiale ufficiale del format:** 27 Giugno 2026 (siamo i primi a collaudarlo in anteprima).

## Deploy
- Live: https://benevolent-narwhal-1c8444.netlify.app/
- Hosting: Netlify
- Auto-deploy via push su GitHub (vedi sezione sotto)

## Struttura
- `index.html` — landing principale
- `presentazione.html` — slide presentazione (20 pagine, esportabile in PDF con Ctrl+P)
- `video.html` — video motion graphics (non più linkato dalla landing, mantenuto come archivio)
- `css/` — design-system.css, website.css, print.css
- `js/` — data.js (contenuti), animations.js (UI)

## Auto-deploy
Il repo è collegato a Netlify: ogni push sul branch `main` triggera un nuovo deploy automatico.
Per modificare il sito basta `git push` — niente upload manuale.

## Asset audio
MP3 narrazione + musica + script ElevenLabs in `~/Downloads/xenom-audio/` (non versionati, non più usati dal sito).
