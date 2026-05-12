/* ============================================
   TUSK PROTOCOL — Bad Boars Edition — Dati Centralizzati
   (variabile XENOM_DATA mantenuta per compat con animations.js)
   ============================================ */

const XENOM_DATA = {
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

  categorie: [
    { id: "ultimate",     gender: "M", ordine: 1, nome: "Ultimate",     descrizione: "Il vertice. Carichi pesanti, ginnastica Pro (Muscle-up, HSW)." },
    { id: "advanced",     gender: "M", ordine: 2, nome: "Advanced",     descrizione: "Per chi vive il Box ogni giorno. Tutto RX, nessuna semplificazione." },
    { id: "challenge",    gender: "M", ordine: 3, nome: "Challenge",    descrizione: "Sei bravo, ma carichi élite o skill complesse sono ancora un obiettivo." },
    { id: "essential",    gender: "M", ordine: 4, nome: "Essential",    descrizione: "Zero barriere. Movimenti fondamentali, focus su intensità e qualità." },
    { id: "performance",  gender: "F", ordine: 1, nome: "Performance",  descrizione: "Prestazione pura. Tutte le skill tecniche nel repertorio." },
    { id: "intermediate", gender: "F", ordine: 2, nome: "Intermediate", descrizione: "Qualità del movimento e resistenza, senza lo stress dei carichi élite." }
  ],

  eventi: [
    {
      numero: 1,
      nome: "Snatch 1RM",
      nomeIT: "Strappo Massimale",
      categoria: "forza",
      categoriaLabel: "Forza",
      tempo: "Cap 10 minuti",
      formato: "1RM, 4 tentativi (1:30 work + 1:00 loading/rest)",
      pesoRX_M: "Peso massimo",
      pesoRX_F: "Peso massimo",
      descrizione: "Stabilisci il tuo massimale nello Snatch. 4 tentativi, 1:30 di lavoro + 1:00 di loading/rest, any style. Cap totale 10 minuti. Score = miglior alzata valida.",
      scoring: "Peso massimo sollevato con successo (kg)",
      giorno: 1,
      icona: "🏋️"
    },
    {
      numero: 2,
      nome: "Ascending Ladder",
      nomeIT: "Scala Ascendente",
      categoria: "ginnastica",
      categoriaLabel: "Ginnastica",
      tempo: "8 minuti",
      formato: "AMRAP — Ladder ascendente (RX vs Scaled)",
      pesoRX_M: "Bodyweight",
      pesoRX_F: "Bodyweight",
      descrizione: "AMRAP 8 minuti. RX (Ultimate / Advanced / Challenge M / Performance F): 2 Wall Walk + 1 Rope Climb (15ft, any style touch target), poi 4+2, 6+3... Scaled (Essential M / Intermediate F): 2 Scaled WW + 4 Burpee Over Line, poi 4+8, 6+12... T.B. dopo l'ultima Rope Climb (RX) o dopo i Burpee (Scaled).",
      scoring: "Ripetizioni totali completate",
      giorno: 1,
      icona: "🧗"
    },
    {
      numero: 3,
      nome: "Max Cal Assault Bike",
      nomeIT: "Sprint Calorie",
      categoria: "cardio",
      categoriaLabel: "Potenza Anaerobica",
      tempo: "60 secondi",
      formato: "Sprint massimale — max calorie in 60s",
      pesoRX_M: "Assault Bike",
      pesoRX_F: "Assault Bike",
      descrizione: "60 secondi di puro output sulla Assault Bike. Massime calorie possibili. Stesso format per tutte le categorie. Test brutale di potenza anaerobica e tolleranza al lattato.",
      scoring: "Calorie totali",
      giorno: 1,
      icona: "🚴"
    },
    {
      numero: 4,
      nome: "Barbell Sprint",
      nomeIT: "Sprint Bilanciere",
      categoria: "metcon",
      categoriaLabel: "Capacità di Lavoro",
      tempo: "5 minuti",
      formato: "AMRAP: 12 DL + 9 FS + 6 S2OH + 3 Thrusters (30 reps/round)",
      pesoRX_M: "70 / 60 / 50 / 40 kg (Ult/Adv/Cha/Ess)",
      pesoRX_F: "45 / 30 kg (Perf/Int)",
      descrizione: "AMRAP 5 minuti con singolo bilanciere: 12 Deadlift, 9 Front Squat, 6 Shoulder-to-Overhead, 3 Thrusters. 30 reps per round. Pesi M (Ult/Adv/Cha/Ess): 70/60/50/40 kg. Pesi F (Perf/Int): 45/30 kg. T.B. dopo i Thrusters.",
      scoring: "Round + ripetizioni completate",
      giorno: 1,
      icona: "💪"
    },
    {
      numero: 5,
      nome: "Engine Test",
      nomeIT: "Test del Motore",
      categoria: "cardio",
      categoriaLabel: "Resistenza Aerobica",
      tempo: "Cap 15 minuti",
      formato: "For Time — Row + Outdoor Run",
      pesoRX_M: "1000m row + 2000m run",
      pesoRX_F: "1000m row + 2000m run",
      descrizione: "For Time, cap 15 minuti. RX: 1000m row + 2000m outdoor run. Essential M: 750m row + 1500m outdoor run. T.B. dopo il row.",
      scoring: "Tempo totale di completamento",
      giorno: 2,
      icona: "🏃"
    },
    {
      numero: 6,
      nome: "Ground Zero",
      nomeIT: "Ground Zero",
      categoria: "metcon",
      categoriaLabel: "Chipper For Time",
      tempo: "Cap 10 minuti",
      formato: "For Time — Sandbag Over Bar, Box Jump Over, G2S, Carry",
      pesoRX_M: "Sandbag 70/50 kg, Box 24\"/20\"",
      pesoRX_F: "Sandbag 50/30 kg, Box 24\"",
      descrizione: "For Time, cap 10 minuti. Chipper: 9 SOB / 15 BJO / 12 G2S / carry 2 reps (2×7,5m) / 15 G2S / carry 2 reps (2×7,5m) / 12 G2S / 15 BJO / 9 SOB. Carry: ogni 7,5m completato = 1 rep valida (totale 91 reps). Sandbag: M Ult-Adv 70 / M Cha-Ess 50 / F Perf 50 / F Int 30 kg. Box: M Ult-Adv 24\" / M Cha-Ess 20\" / F 24\". T.B. dopo il primo blocco di Sandbag G2S.",
      scoring: "Tempo di completamento (cap 10')",
      giorno: 2,
      icona: "💥"
    },
    {
      numero: 7,
      nome: "Barbell Version",
      nomeIT: "Barbell Version",
      categoria: "ginnastica",
      categoriaLabel: "Ginnastica + Forza",
      tempo: "Cap 7 minuti",
      formato: "3 round 15/15/10 (gymnastics + HPS) + max reps skill finale",
      pesoRX_M: "50 / 45 / 40 / 35 kg",
      pesoRX_F: "37.5 / 25 kg",
      descrizione: "Cap 7 minuti. 3 round con schema reps 15/15/10 (R1: 15 reps di ogni movimento, R2: 15, R3: 10) di gymnastics + Hang Power Snatch, poi MAX REPS della skill ginnastica finale nel tempo restante. Score = SOLO le reps finali. Per categoria — Ult: T2B+BMU @50kg, final RMU. Adv: T2B+BMU @45kg, final RMU. Cha: CTB @40kg, final BMU. Ess: Pull-up @35kg, final CTB. Perf F: CTB @37.5kg, final BMU. Int F: Pull-up @25kg, final CTB. T.B. fine round 3.",
      scoring: "Ripetizioni della skill ginnastica finale",
      giorno: 2,
      icona: "🤸"
    },
    {
      numero: 8,
      nome: "Engine Chaos",
      nomeIT: "Caos Metabolico",
      categoria: "metcon",
      categoriaLabel: "Condizionamento Metabolico",
      tempo: "12 minuti",
      formato: "AMRAP — BOL + Ski + Bike (×2) + Burpees",
      pesoRX_M: "30 cal Ski/Bike",
      pesoRX_F: "24 cal Ski/Bike",
      descrizione: "AMRAP 12 minuti. Blocco 1: 30 BOL + 30/24 cal Ski + 30/24 cal Bike. Blocco 2: 30 BOL + 30/24 cal Bike + 30/24 cal Ski. Poi MAX burpees standard nel tempo restante. Cal: 30 M / 24 F. Stesso format tutte le categorie. T.B. dopo gli ergometri.",
      scoring: "Ripetizioni totali",
      giorno: 2,
      icona: "🔥"
    },
    {
      numero: 9,
      nome: "Heavy Clean Ladder",
      nomeIT: "Scala di Girate Pesanti",
      categoria: "forza",
      categoriaLabel: "Forza + Capacity",
      tempo: "8 minuti",
      formato: "AMRAP — Ladder 10/8/6/4/2 + AMRAP top weight",
      pesoRX_M: "Top: 110 / 100 / 90 / 70 kg (Ult/Adv/Cha/Ess)",
      pesoRX_F: "Top: 60 / 45 kg (Perf/Int)",
      descrizione: "AMRAP 8 minuti. Ladder a carichi crescenti: 10 cleans, poi 8, 6, 4, 2 cleans (ogni step a peso più pesante), infine AMRAP cleans al carico finale per il tempo restante. Any clean allowed (power, squat o split). Carichi top M (Ult/Adv/Cha/Ess): 110/100/90/70 kg. Carichi top F (Perf/Int): 60/45 kg. Score = reps totali completate. T.B. (solo in caso di parità) = ultimo step clean completato interamente.",
      scoring: "Ripetizioni totali (es. 10+8+6+4+2+7 = 37)",
      giorno: 2,
      icona: "⚡"
    },
    {
      numero: 10,
      nome: "The Finale",
      nomeIT: "La Finale",
      categoria: "metcon",
      categoriaLabel: "Evento Finale",
      tempo: "12 minuti",
      formato: "AMRAP: 6 HSPU + 8 C2B + 12 Front Rack Barbell Lunges (26 reps/round)",
      pesoRX_M: "60 / 50 / 40 / 35 kg (Ult/Adv/Cha/Ess)",
      pesoRX_F: "40 / 25 kg (Perf/Int)",
      descrizione: "Evento finale, AMRAP 12 minuti. Round = 6 Handstand Push-Up + 8 Chest-to-Bar Pull-Up + 12 Front Rack Barbell Lunges (alternati, in place, bilanciere da terra, front rack obbligatorio, contatto ginocchio a terra, no split recovery). Per categoria — Ultimate: HSPU std + C2B @60kg. Advanced: HSPU std + C2B @50kg. Challenge: HSPU+1 AbMat + C2B @40kg. Essential: Push-up + Pull-up @35kg. Performance F: HSPU+1 AbMat + C2B @40kg. Intermediate F: Push-up + Pull-up @25kg. Solo top 5/6 per categoria. T.B. = fine round completo.",
      scoring: "Round + ripetizioni completate (round = 26 reps)",
      giorno: 2,
      icona: "🏆"
    }
  ],

  epiSystem: {
    nome: "Elite Performance Index",
    sigla: "EPI",
    descrizione: "Il sistema di punteggio EPI è ispirato al decathlon dell'atletica leggera olimpica. Ogni evento genera un punteggio calcolato come percentuale di un benchmark di livello elite. Il punteggio benchmark per evento è circa 1.000 punti. Il totale dei 10 eventi costituisce il tuo EPI personale — un numero unico che rappresenta la tua forma atletica complessiva, comparabile globalmente.",
    benchmarkPerEvento: 1000,
    maxTeorico: 12000,
    livelli: [
      { nome: "Leggendario", min: 10000, colore: "#D4A843", emoji: "👑" },
      { nome: "Elite", min: 8000, colore: "#FF3C00", emoji: "🔥" },
      { nome: "Avanzato", min: 6000, colore: "#FF6B35", emoji: "💪" },
      { nome: "Intermedio", min: 4000, colore: "#448AFF", emoji: "📈" },
      { nome: "Base", min: 0, colore: "#B0B0B0", emoji: "🎯" }
    ],
    comeCalcolare: [
      "Ogni evento ha un benchmark basato su performance di livello elite mondiale",
      "La tua performance viene convertita in punti usando una formula specifica per tipo di evento",
      "Puoi ottenere più o meno di 1.000 punti per evento",
      "I pesi nella formula garantiscono che miglioramenti in ogni dominio siano premiati equamente",
      "Il totale dei 10 punteggi è il tuo EPI — comparabile tra eventi, location e tempo"
    ]
  },

  atleti: [],

  programma: [
    { ora: "14:00",       giorno: 1, attivita: "Apertura Box, registrazione atleti",        tipo: "admin" },
    { ora: "14:30-19:00", giorno: 1, attivita: "Eventi 1-4 (slot liberi prenotabili)",      tipo: "wod" },
    { ora: "09:00",       giorno: 2, attivita: "Apertura, riscaldamento collettivo",         tipo: "admin" },
    { ora: "10:00-17:00", giorno: 2, attivita: "Eventi 5-9 (heat strutturati)",              tipo: "wod" },
    { ora: "18:00",       giorno: 2, attivita: "Finale (top 5/6 per categoria)",             tipo: "wod" },
    { ora: "20:00",       giorno: 2, attivita: "Premiazioni + Party finale",                 tipo: "social" }
  ],

  contatti: {
    instagram: "@bad_boars_crossfit",
    instagramUrl: "https://www.instagram.com/bad_boars_crossfit/",
    facebook: "Bad Boars CrossFit",
    facebookUrl: "https://www.facebook.com/pages/Bad-Boars-CrossFit/480247628798596",
    email: "info@badboarscrossfit.com",
    telefono: "348 080 1972"
  }
};
