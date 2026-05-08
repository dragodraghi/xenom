# TUSK Protocol — Benchmarks EPI

> Scratch pad per la sessione M0. Ogni cella benchmark = valore al quale un atleta della categoria ottiene esattamente **1.000 punti EPI** (livello "elite assoluto" per quella categoria).
>
> - Eventi `weight`: kg
> - Eventi `time`: secondi totali (1080s = 18:00)
> - Eventi `reps`: ripetizioni totali
> - Eventi `calories`: calorie
> - Eventi `rounds_reps`: reps totali (`round × repsPerRound + reps_extra`)
>
> **Non c'è un cap a 1000**: se un atleta supera il benchmark prende >1000 punti (è normale, è la filosofia EPI).

## Stato attuale

- [ ] Confermare assegnazione **giorno** ad ogni evento (Ven/Sab)
- [ ] Confermare/definire **dettagli format** dei 4 eventi TBD
- [ ] Compilare **60 valori benchmark** (10 eventi × 6 categorie)
- [ ] (Per `rounds_reps`) confermare **`repsPerRound`**

## Tabella benchmarks

Legenda colonne:

| Campo | Significato |
|---|---|
| Day | Giorno (1=Venerdì, 2=Sabato) |
| Type | scoringType: weight / time / reps / calories / rounds_reps |
| Dir | higher / lower (lower = più basso è meglio, solo per time) |
| RPR | repsPerRound (solo per rounds_reps, altrimenti `—`) |
| ULT | Ultimate (M) |
| ADV | Advanced (M) |
| CHA | Challenge (M) |
| ESS | Essential (M) |
| PER | Performance (F) |
| INT | Intermediate (F) |

| #  | Nome evento                    | Day | Type         | Dir    | RPR | ULT | ADV | CHA | ESS | PER | INT |
|----|--------------------------------|-----|--------------|--------|-----|-----|-----|-----|-----|-----|-----|
| 1  | 1RM Snatch                     | 1   | weight       | higher | —   |     |     |     |     |     |     |
| 2  | Wall Walk + Rope Climb (8min)  | 1   | reps         | higher | —   |     |     |     |     |     |     |
| 3  | Max Cal Echo Bike (60s)        | 1   | calories     | higher | —   |     |     |     |     |     |     |
| 4  | Barbell Cycling AMRAP (5min)   | 1   | rounds_reps  | higher | 30  |     |     |     |     |     |     |
| 5  | 3K Run + 2K Echo Ski           | 2   | time         | lower  | —   |     |     |     |     |     |     |
| 6  | [TBD — da decidere]            | 2   | ?            | ?      | ?   |     |     |     |     |     |     |
| 7  | Gymnastics Triplet (T2B/DB Snatch/MU) | 2 | reps    | higher | —   |     |     |     |     |     |     |
| 8  | Metcon AMRAP (Burpees/Ski/Bike) | 2  | rounds_reps  | higher | ?   |     |     |     |     |     |     |
| 9  | Heavy Clean Ladder             | 2   | weight       | higher | —   |     |     |     |     |     |     |
| 10 | The Finale (16min AMRAP HSPU+C2B+DB Lunges) | 2 | reps | higher | —   |     |     |     |     |     |     |

## Note sui formati eventi

### Evento 1 — 1RM Snatch
- Formato: 4 tentativi, 1 ogni 90s, 9 minuti totali
- Score = peso massimo sollevato con tecnica corretta
- Categoria essential potrebbe usare Hang Power Snatch al posto di Squat Snatch?

### Evento 2 — Wall Walk + Rope Climb (8min)
- AMRAP 8 min ladder ascendente: R1 = 2 WW + 1 RC, R2 = 4 WW + 2 RC, ...
- Score = ripetizioni totali (ogni WW = 1 rep, ogni RC = 1 rep)
- Categorie scaled: bear crawl + rope progression al posto di RC?

### Evento 3 — Max Cal Echo Bike (60s)
- Sprint massimale 60s
- Score = calorie totali
- Identico per tutti i livelli (è uno sprint puro)

### Evento 4 — Barbell Cycling AMRAP (5min)
- AMRAP 5 min: 12 Deadlift + 9 Front Squat + 6 S2OH + 3 Thrusters = 30 reps/round
- Pesi: U=70kg, A=60kg, C=50kg, E=40kg, P=42kg, I=32kg (placeholder, da confermare)
- Score = reps totali (round × 30 + reps_extra)

### Evento 5 — 3K Run + 2K Echo Ski
- Corsa 3km + Ski 2km in sequenza, no time cap
- Score = tempo totale (lower = better)
- Identico per tutti i livelli? O distanze ridotte per Essential/Intermediate?

### Evento 6 — [TBD]
**Da decidere insieme.** Suggerimenti:
- (A) Heavy Sled Push 50m — weight su slitta
- (B) DT (5RFT 12DL/9HPC/6PJ) — time
- (C) Mystery WOD a sorpresa il giorno della gara
- (D) altro?

### Evento 7 — Gymnastics Triplet
- Combina T2B + DB Hang Snatch + Bar/Ring Muscle-up
- Format proposto: 21-15-9 reps di ognuno → score = time (lower)
- Oppure AMRAP X min → score = reps
- DA DEFINIRE format e standard reps × livello

### Evento 8 — Metcon AMRAP
- Burpees + Echo Ski (cal) + Echo Bike (cal)
- Format: AMRAP 12 min? Round = X burpees + Y cal ski + Z cal bike?
- DA DEFINIRE struttura del round e RPR

### Evento 9 — Heavy Clean Ladder
- Carichi crescenti, ogni "scalino" 90s, 1 rep per scalino
- Score = ultimo peso sollevato con successo
- Range proposto: U=80→140 kg / P=50→90 kg

### Evento 10 — The Finale
- AMRAP 16 min: HSPU + Chest-to-Bar Pull-up + DB Lunges
- Solo top 5/6 per categoria
- Score = reps totali
- DA DEFINIRE struttura del round (es. 10-15-20? 6-9-12?)

## Riferimenti benchmark CrossFit (per orientamento)

Solo come riferimento — i benchmark TUSK potrebbero essere più stringenti/morbidi:

- **Snatch Open Elite Male**: ~140-150 kg
- **Snatch Open RX Female**: ~85-95 kg
- **Run 5K Open Elite**: ~18-20 min
- **Echo Bike 60s Cal Elite Male**: ~32-38 cal
- **Echo Bike 60s Cal Elite Female**: ~22-28 cal
