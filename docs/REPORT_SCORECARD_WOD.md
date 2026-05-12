# Report criticità scorecard giudici — TUSK Protocol

Confronto fra le scorecard cartacee (`SCORECARDS_WOD.html`) e l'app admin
(`giudici.html` → tab "Inserisci Risultato"). Sotto trovi prima la lista
criticità con priorità, poi il messaggio WhatsApp pronto da inoltrare al WOD
designer.

---

## Criticità rilevate

### 🔴 Priorità ALTA — possono causare errori in gara

1. **Pettorale / Heat / Lane non vengono inseriti in admin.**
   Le scorecard hanno campi Pettorale #, Heat e Lane (utili al giudice di
   pedana), ma l'admin cerca l'atleta SOLO per nome. Rischio: due atleti con
   nome simile, il giudice scrive il pettorale ma admin non lo usa per
   disambiguare. Domanda WOD: aggiungere campo pettorale nella ricerca admin
   o esplicitare sulle scorecard che "il pettorale serve solo a te, non
   all'admin"?

2. **Tie-break non ha un campo dedicato in admin.**
   Le scorecard riservano spazio al T.B. (es. E2 dopo l'ultima Rope Climb, E7
   fine round 3, E9 ultimo step completato), ma in `Inserisci Risultato` non
   c'è un campo "tie-break". Conclusione attuale: il T.B. resta solo sulla
   scorecard cartacea e si usa a mano in caso di parità di punti EPI.
   Domanda WOD: confermare che basta cartaceo, oppure aggiungere il campo
   in admin?

3. **DNF cap-time: come si comporta admin?**
   Per E5 ed E6 la scorecard ha checkbox DNF + metri/reps completati. L'app
   ha probabilmente un'unica route "tempo o DNF+lavoro". Verifica: cosa
   succede se un giudice inserisce un tempo > cap per sbaglio? L'app
   rifiuta o salva un valore sbagliato? Se rifiuta, va comunicato ai
   giudici nella cheatsheet.

4. **E7 — score = 0 se buy-in non chiuso.**
   La scorecard dice "Se l'atleta non chiude i 3 round entro il cap, score
   = 0". Va verificato che l'admin accetti il valore 0 e che il giudice in
   pedana lo scriva esplicitamente (e non lasci la riga vuota).

### 🟡 Priorità MEDIA — friction o ambiguità

5. **E4 / E10 (rounds_reps): scomposizione round + extra.**
   La scorecard ha riga "Round completi: X × repsPerRound + Reps extra: Y →
   TOTALE: Z". L'admin chiede 2 input separati: round completi e reps extra.
   Va spiegato esplicitamente: NON inserire 6.5 round, ma 6 round + metà
   round in reps.

6. **E3 Doppia lettura calorie eliminata.**
   Abbiamo tolto il campo "Doppia lettura / Differenza" perché ridondante.
   Conferma con WOD: era richiesto come safety check (ad esempio se due
   giudici leggono il display) o era solo un'idea iniziale?

7. **Categoria su scorecard vs admin.**
   Le scorecard hanno checkbox per le 6 categorie (più carico/sandbag/box
   per WOD). L'admin recupera la categoria dal profilo atleta. Se sulla
   scorecard cerchi la spunta categoria, è solo controllo visivo per il
   giudice. Va detto: "Non serve cambiare categoria, è già nell'app".

8. **Firma "Ora consegna" + "Note admin" nel footer.**
   Aggiunta nuova: serve all'admin per audit. Va spiegato in cheatsheet che
   "Ora consegna" la scrive l'admin quando riceve la scorecard.

### 🟢 Priorità BASSA — preferenze / migliorie

9. **E10 limitato a 8+ round** sulla scorecard. Per Ultimate M potrebbe
   essere stretto (8 round × 26 = 208 reps in 12'). Verifica top historic
   per categoria.

10. **No reps box: spazio singolo.**
    Aggiunto un riquadrino dashed sopra il Final Score. Può bastare oppure
    serve uno spazio strutturato (es. "movimento → quante no reps")?

11. **E6 Ground Zero tally box per ogni rep**: ottimo per anti-errore, ma
    su una scheda diventa visivamente carico. Verifica se il giudice
    preferisce tally o solo conteggio numerico.

12. **Heat e Lane** aggiunti ma con linea libera. Servono entrambi o uno
    solo? Capisco l'ipotesi: 2-3 heat in parallelo, ogni heat ha 4-6 lane.

### ⚙️ Nice-to-have (post-gara)

13. **Esportazione scorecard pre-compilate per heat.**
    Idea futura: generare il PDF con nome atleta + categoria + pettorale +
    heat + lane già stampati per ogni heat (no compilazione manuale).

---

## Messaggio WhatsApp pronto

> Copia e incolla quanto sotto al WOD designer. È formattato per leggersi
> bene su WhatsApp (grassetti con `*asterischi*`, niente markdown spinto).

```
Ciao, ho fatto un giro sulle scorecard giudici (versione SCORECARDS_WOD.html, 10 schede A4) e su giudici.html lato admin. Ho 12 punti da chiarire con te prima di stampare la versione finale. Ti chiedo riscontro così la chiudiamo.

*ALTA — bloccanti per gara*

1) Pettorale/Heat/Lane: le scorecard hanno questi campi, l'admin cerca atleta solo per nome. OK così (campo cartaceo solo per giudice di pedana), o vuoi che li aggiungiamo anche in admin?

2) Tie-break: c'è campo T.B. su tutte le schede ma in admin non si inserisce. Confermi che basta tenerlo cartaceo per spareggio manuale in classifica?

3) DNF cap-time (E5/E6): se il giudice scrive per sbaglio un tempo oltre il cap, l'admin lo rifiuta o lo accetta? Va testato prima di gara.

4) E7 score = 0 se buy-in non chiuso: confermi che il giudice scrive proprio "0" (non vuoto)?

*MEDIA — chiarimenti operativi*

5) E4/E10 rounds_reps: il giudice scrive sulla scorecard "Round completi + Extra reps". Confermi che si inserisce così anche in admin (no decimali tipo 6.5)?

6) E3 Assault Bike: ho tolto la "doppia lettura / differenza" perché ridondante. Era richiesta per safety check o era una bozza?

7) Categoria su scorecard ha checkbox per controllo visivo, ma admin la pesca dal profilo atleta. Spiegato in cheatsheet?

8) Footer scorecard: ho aggiunto "Ora consegna" e "Note admin" — vuoi mantenerli o accorpare?

*BASSA — migliorie*

9) E10 a 8+ round basta? Per Ultimate M potrebbe arrivare a 9-10 round.

10) No reps box: spazio singolo dashed sopra il Final Score. Va bene o ti serve struttura tipo "movimento → quante no reps"?

11) E6 Ground Zero ha tally box per ogni rep del chipper (91 box totali, aggiornati con la nuova regola carry 7,5m). Preferisci tenerli o passare a conteggio numerico libero?

12) Heat e Lane: entrambi o solo Heat? Mi serve l'organizzazione heat per dimensionare.

*Nice-to-have post*

13) Generare i PDF scorecard pre-compilate per heat (nome atleta + categoria già stampati per ogni lane di ogni heat) — utile per ridurre la compilazione manuale. Da fare dopo che si è chiuso il bracket iscrizioni.

Quando hai 10 minuti mi mandi le risposte numerate dalla 1 alla 13 (anche solo "ok / cambia") così aggiorno scorecard e cheatsheet in giornata. Grazie 🐗
```

---

## Riferimenti rapidi file modificati

- `docs/SCORECARDS_WOD.html` — 10 schede A4, già con Heat/Lane, No-reps box, terza firma, E3 semplificato.
- `docs/MANUALE_ADMIN.html` — manuale operativo per la pedana e l'admin.
- `docs/CHEATSHEET_GIUDICI.md` — sintesi giudici (da aggiornare dopo risposte WOD).
