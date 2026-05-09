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
      nome: "1RM Snatch",
      nomeIT: "Strappo Massimale",
      categoria: "forza",
      categoriaLabel: "Forza",
      tempo: "9 minuti",
      formato: "4 tentativi, 1 ogni 90 secondi",
      pesoRX_M: "Peso massimo",
      pesoRX_F: "Peso massimo",
      descrizione: "Stabilisci il tuo massimale nello Snatch. Hai 9 minuti e 4 tentativi, uno ogni 90 secondi, per sollevare il carico più pesante possibile con tecnica corretta. Il bilanciere deve arrivare sopra la testa con braccia distese e piedi in linea.",
      scoring: "Peso massimo sollevato con successo (kg)",
      giorno: 1,
      icona: "🏋️"
    },
    {
      numero: 2,
      nome: "Wall Walk & Rope Climb",
      nomeIT: "Scalata & Corda",
      categoria: "ginnastica",
      categoriaLabel: "Ginnastica",
      tempo: "8 minuti",
      formato: "AMRAP — Ladder ascendente",
      pesoRX_M: "Bodyweight",
      pesoRX_F: "Bodyweight",
      descrizione: "AMRAP di 8 minuti con ladder ascendente: Round 1 = 2 Wall Walk + 1 Rope Climb, Round 2 = 4 Wall Walk + 2 Rope Climb, Round 3 = 6 Wall Walk + 3 Rope Climb, e così via. Testa stabilità di spalla, core e capacità sotto fatica.",
      scoring: "Ripetizioni totali completate",
      giorno: 1,
      icona: "🧗"
    },
    {
      numero: 3,
      nome: "Max Cal Echo Bike",
      nomeIT: "Sprint Calorie",
      categoria: "cardio",
      categoriaLabel: "Potenza Anaerobica",
      tempo: "60 secondi",
      formato: "Sprint massimale — max calorie in 60s",
      pesoRX_M: "Echo Bike",
      pesoRX_F: "Echo Bike",
      descrizione: "60 secondi di puro output sulla Echo Bike. Accumula il massimo numero di calorie possibile. Un test brutale di potenza anaerobica e tolleranza al lattato. Parte 3 minuti dopo l'Evento 2.",
      scoring: "Calorie totali",
      giorno: 1,
      icona: "🚴"
    },
    {
      numero: 4,
      nome: "Barbell Cycling",
      nomeIT: "Ciclo di Bilanciere",
      categoria: "metcon",
      categoriaLabel: "Capacità di Lavoro",
      tempo: "5 minuti",
      formato: "AMRAP: 12 Deadlift, 9 Front Squat, 6 S2OH, 3 Thrusters",
      pesoRX_M: "60 kg",
      pesoRX_F: "42 kg",
      descrizione: "AMRAP di 5 minuti con un singolo bilanciere: 12 Deadlift, 9 Front Squat, 6 Shoulder-to-Overhead, 3 Thrusters. Ogni round completo è un ciclo. Testa la capacità di lavorare sotto fatica con carichi moderati e alta velocità.",
      scoring: "Ripetizioni totali completate",
      giorno: 1,
      icona: "💪"
    },
    {
      numero: 5,
      nome: "3K Run + 2K Echo Ski",
      nomeIT: "Endurance Combinato",
      categoria: "cardio",
      categoriaLabel: "Resistenza Aerobica",
      tempo: "Nessun time cap",
      formato: "3.000m corsa + 2.000m Echo Ski in sequenza",
      pesoRX_M: "—",
      pesoRX_F: "—",
      descrizione: "Corsa da 3 chilometri seguita immediatamente da 2 chilometri sull'Echo Ski. Un test di resistenza aerobica pura che richiede gestione del passo e capacità di mantenere l'intensità nel cambio modalità.",
      scoring: "Tempo totale di completamento",
      giorno: 1,
      icona: "🏃"
    },
    {
      numero: 6,
      nome: "Coming Soon",
      nomeIT: "In Arrivo",
      categoria: "mystery",
      categoriaLabel: "???",
      tempo: "TBD",
      formato: "Da rivelare",
      pesoRX_M: "TBD",
      pesoRX_F: "TBD",
      descrizione: "Questo evento non è ancora stato rivelato da XENOM ufficiale. Sarà svelato nelle prossime settimane. Preparati a tutto.",
      scoring: "Da definire",
      giorno: 1,
      icona: "❓"
    },
    {
      numero: 7,
      nome: "Gymnastics Triplet",
      nomeIT: "Tripletta Ginnica",
      categoria: "ginnastica",
      categoriaLabel: "Ginnastica",
      tempo: "Da definire",
      formato: "Toes-to-Bar, DB Hang Snatch, Bar & Ring Muscle-Up",
      pesoRX_M: "Da definire",
      pesoRX_F: "Da definire",
      descrizione: "Una tripletta ginnica che combina Toes-to-Bar, Dumbbell Hang Snatch con doppio manubrio e Muscle-Up su barra e anelli. Un test completo di forza a corpo libero, coordinazione e capacità sotto fatica.",
      scoring: "Ripetizioni totali o tempo",
      giorno: 1,
      icona: "🤸"
    },
    {
      numero: 8,
      nome: "Metcon AMRAP",
      nomeIT: "Metabolico",
      categoria: "metcon",
      categoriaLabel: "Condizionamento Metabolico",
      tempo: "Da definire",
      formato: "AMRAP — Burpees, Echo Ski, Echo Bike",
      pesoRX_M: "Da definire",
      pesoRX_F: "Da definire",
      descrizione: "Un AMRAP di condizionamento metabolico che combina Burpees, Echo Ski e Echo Bike. Progettato per testare la capacità di lavoro e il pacing sotto fatica accumulata.",
      scoring: "Ripetizioni/calorie totali",
      giorno: 1,
      icona: "🔥"
    },
    {
      numero: 9,
      nome: "Heavy Clean Ladder",
      nomeIT: "Scala di Girate Pesanti",
      categoria: "forza",
      categoriaLabel: "Forza",
      tempo: "Da definire",
      formato: "Ladder a pesi crescenti nel Clean",
      pesoRX_M: "Progressione crescente",
      pesoRX_F: "Progressione crescente",
      descrizione: "Una scala di Clean (Girata al Petto) con carichi progressivamente crescenti. Ogni livello della scala aumenta il peso sul bilanciere. L'ultimo peso sollevato con successo determina il punteggio.",
      scoring: "Peso massimo completato con successo",
      giorno: 1,
      icona: "⚡"
    },
    {
      numero: 10,
      nome: "The Finale",
      nomeIT: "La Finale",
      categoria: "metcon",
      categoriaLabel: "Evento Finale",
      tempo: "16 minuti",
      formato: "AMRAP: HSPU, Chest-to-Bar Pull-Up, DB Lunges",
      pesoRX_M: "2 × 22.5 kg DB",
      pesoRX_F: "2 × 15 kg DB",
      descrizione: "L'evento finale: un AMRAP di 16 minuti con Handstand Push-Up, Chest-to-Bar Pull-Up e Dumbbell Lunges. Testa resistenza muscolare nel pressing e pulling con gambe sotto fatica dai lunges pesanti. L'ultimo sforzo prima della classifica finale.",
      scoring: "Ripetizioni totali completate",
      giorno: 1,
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
    instagram: "Da confermare con il coach",
    facebook: "Bad Boars CrossFit",
    email: "info@badboarscrossfit.com",
    telefono: "348 080 1972",
    sito: "badboarscrossfit.com"
  }
};
