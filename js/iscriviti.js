// iscriviti.js — Validazione form iscrizione + scrittura su tusk_iscrizioni_pending
import { db, COL } from "./firebase-config.js";
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
const btnRetry = document.getElementById("btn-retry");

const VALID_CATEGORIE = [
  "ultimate", "advanced", "challenge", "essential", "performance", "intermediate"
];

const FIELD_NAMES = ["nome", "categoriaId", "box", "contatto"];

// === Validazione ===
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
  for (const name of FIELD_NAMES) {
    const err = validateField(name, formData.get(name));
    showError(name, err);
    if (err && !firstError) firstError = name;
  }
  return firstError;
}

// Validazione live al blur dei campi
for (const name of FIELD_NAMES) {
  const input = form.elements[name];
  if (input) {
    input.addEventListener("blur", () => {
      const err = validateField(name, input.value);
      showError(name, err);
    });
    // Pulisce errore mentre digita di nuovo
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) {
        showError(name, null);
      }
    });
  }
}

// === Submit ===
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

    await addDoc(collection(db, COL.iscrizioni), data);

    form.hidden = true;
    successBox.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("Errore iscrizione:", err);
    const userMsg =
      err.code === "permission-denied"
        ? "Permesso negato dal server. Controlla i dati inseriti e riprova."
        : err.code === "unavailable"
        ? "Connessione assente. Verifica internet e riprova."
        : "Errore di rete. Riprova tra qualche secondo.";
    errorMsg.textContent = userMsg;
    form.hidden = true;
    errorBox.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.classList.remove("is-loading");
  }
});

// Bottone "Riprova" dopo errore: mostra di nuovo form
if (btnRetry) {
  btnRetry.addEventListener("click", () => {
    errorBox.hidden = true;
    form.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
