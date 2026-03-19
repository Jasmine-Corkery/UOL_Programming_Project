export function optimizeAlert({ alert, userPreferences }) {
  let message = alert.message;

  // 1️⃣ High severity simplification
  if (alert.severity >= 7) {
    message = simplifyForHighStress(message);
  }

  // 2️⃣ Adjust complexity
  message = adjustComplexity(
    message,
    userPreferences?.languageComplexity || "simple",
  );

  // 3️⃣ Translate if needed
  if (userPreferences?.language && userPreferences.language !== "en") {
    message = translateMessage(message, userPreferences.language);
  }

  // 4️⃣ Convert to action steps
  return convertToActionSteps(message);
}

function simplifyForHighStress(message) {
  return message
    .replace("Please be advised that", "")
    .replace("It is recommended that you", "You must")
    .replace("Residents in the area should", "You must")
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(". ");
}

function adjustComplexity(message, level) {
  if (level === "simple") {
    return message
      .replace("evacuate", "leave")
      .replace("residence", "home")
      .replace("vicinity", "area");
  }

  return message;
}

function translateMessage(message, language) {
  // placeholder — extensible to real API later
  if (language === "es") {
    return "Alerta: Condiciones peligrosas detectadas. Tome acción inmediata.";
  }

  return message;
}

function convertToActionSteps(message) {
  const sentences = message.split(".").filter(Boolean);

  return sentences.map((sentence, index) => ({
    id: index,
    text: sentence.trim(),
  }));
}
