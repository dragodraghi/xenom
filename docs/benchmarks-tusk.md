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
| 1  | Snatch 1RM (cap 10')           | 1   | weight       | higher | —   |     |     |     |     |     |     |
| 2  | Ascending Ladder (AMRAP 8')    | 1   | reps         | higher | —   |     |     |     |     |     |     |
| 3  | Max Cal Assault Bike (60s)     | 1   | calories     | higher | —   |     |     |     |     |     |     |
| 4  | Barbell Sprint (AMRAP 5')      | 1   | rounds_reps  | higher | 30  |     |     |     |     |     |     |
| 5  | Engine Test (cap 15')          | 2   | time         | lower  | —   |     |     |     |     |     |     |
| 6  | Ground Zero (cap 10')          | 2   | time         | lower  | —   |     |     |     |     |     |     |
| 7  | Barbell Version (cap 7')       | 2   | reps         | higher | —   |     |     |     |     |     |     |
| 8  | Engine Chaos (AMRAP 12')       | 2   | reps         | higher | —   |     |     |     |     |     |     |
| 9  | Heavy Clean Ladder             | 2   | weight       | higher | —   |     |     |     |     |     |     |
| 10 | The Finale (AMRAP 16')         | 2   | reps         | higher | —   |     |     |     |     |     |     |

## Note sui formati eventi

### Evento 1 — Snatch 1RM (cap 10')
- Formato: 4 tentativi, 1:30 work + 1:00 loading/rest, any style
- Cap totale 10 minuti
- Score = miglior alzata valida (kg)

### Evento 2 — Ascending Ladder (AMRAP 8')
- RX (Ultimate M / Advanced M / Challenge M): 2 WW + 1 RC, poi 4+2, 6+3... (Rope Climb 15ft, any style touch target)
- Scaled (Essential M / Performance F / Intermediate F): 2 Scaled WW + 4 BOL, poi 4+8, 6+12...
- T.B. RX: dopo l'ultima Rope Climb. T.B. Scaled: dopo i Burpees Over Line
- Score = reps totali (ogni WW/RC/BOL = 1 rep)

### Evento 3 — Max Cal Assault Bike (60s)
- Sprint massimale 60s su Assault Bike
- Score = calorie totali
- Stesso format per tutte le categorie (sprint puro)

### Evento 4 — Barbell Sprint (AMRAP 5')
- AMRAP 5': 12 DL + 9 FS + 6 S2OH + 3 Thrusters = 30 reps/round
- Pesi M (Ult/Adv/Cha/Ess): 70 / 60 / 50 / 40 kg
- Pesi F (Perf/Int): 45 / 30 kg
- T.B. dopo i Thrusters
- Score = reps totali (round × 30 + reps_extra)

### Evento 5 — Engine Test (cap 15')
- For Time, cap 15 minuti
- RX: 1000m row + 2000m outdoor run
- Essential M: 750m row + 1500m outdoor run
- T.B. dopo il row
- Score = tempo totale (lower = better)

### Evento 6 — Ground Zero (cap 10')
- For Time, cap 10 minuti — chipper:
  - 9 Sandbag Over Bar
  - 15 Box Jump Over
  - 12 G2S
  - 15m Carry
  - 15 G2S
  - 15m Carry
  - 12 G2S
  - 15 BJO
  - 9 SOB
- Sandbag (kg): M Ult-Adv 70 / M Cha-Ess 50 / F Perf 50 / F Int 30
- Box: M Ult-Adv 24" / M Cha-Ess 20" / F 24"
- T.B. dopo il primo blocco di Sandbag G2S
- Score = tempo (lower) / reps al cap se DNF

### Evento 7 — Barbell Version (cap 7')
- 3 round con schema reps **15 / 15 / 10** (R1=15 reps di ogni movimento, R2=15, R3=10), uguale per tutte le categorie
- Ogni round: gymnastics + HPS (Hang Power Snatch)
- Poi MAX REPS della skill ginnastica finale nel tempo restante
- Score = SOLO le reps finali
- Per categoria:
  - Ultimate: T2B + BMU @50kg → final RMU
  - Advanced: T2B + BMU @45kg → final RMU
  - Challenge: CTB @40kg → final BMU
  - Essential: Pull-up @35kg → final CTB
  - Performance F: CTB @37.5kg → final BMU
  - Intermediate F: Pull-up @25kg → final CTB
- T.B. fine di ogni round; T.B. ufficiale = fine round 3

### Evento 8 — Engine Chaos (AMRAP 12')
- AMRAP 12':
  - Blocco 1: 30 BOL + 30/24 cal Ski + 30/24 cal Bike
  - Blocco 2: 30 BOL + 30/24 cal Bike + 30/24 cal Ski
  - Poi MAX burpees standard nel tempo restante
- Cal: 30 M / 24 F. Stesso format tutte le categorie
- T.B. dopo gli ergometri
- Score = reps totali

### Evento 9 — Heavy Clean Ladder
- DA DEFINIRE col coach (in arrivo)
- Ipotesi: carichi crescenti, ogni "scalino" 90s, 1 rep per scalino
- Score = ultimo peso sollevato con successo

### Evento 10 — The Finale
- DA DEFINIRE col coach (in arrivo)
- Ipotesi precedente: AMRAP 16' HSPU + CTB + DB Lunges
- Solo top 5/6 per categoria
- Score = reps totali

## Riferimenti benchmark CrossFit (per orientamento)

Solo come riferimento — i benchmark TUSK potrebbero essere più stringenti/morbidi:

- **Snatch Open Elite Male**: ~140-150 kg
- **Snatch Open RX Female**: ~85-95 kg
- **Run 5K Open Elite**: ~18-20 min
- **Assault Bike 60s Cal Elite Male**: ~32-38 cal
- **Assault Bike 60s Cal Elite Female**: ~22-28 cal
