// utils/geminiAgent.ts
// Integración correcta con la API REST de Google Gemini.
// Lee la API Key y modelo desde el store Zustand (guardados en Ajustes).
// Fallback a EXPO_PUBLIC_GEMINI_API_KEY si está en el entorno.

import type { SavedFormula } from "@/types";

// URL base de la API v1beta de Google Gemini
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  imageUri?: string;
  timestamp: Date;
}

export type AgentMode =
  | "formula"
  | "photo"
  | "ideas"
  | "costs"
  | "general";

// ── Construcción del prompt de sistema ────────────────────────────────────────

function buildSystemPrompt(mode: AgentMode, formula?: SavedFormula): string {
  const base = `Eres un experto maestro panadero y pastelero con 20 años de experiencia.
Tu nombre es "Miel", el asistente de la app Pastry-Pro.
Respondes SIEMPRE en español, de forma práctica, clara y amigable.
Usas términos técnicos de panadería pero los explicas cuando son complejos.
Cuando detectas un problema, ofreces soluciones concretas con cantidades o porcentajes.
Nunca inventas información — si no estás seguro, lo dices claramente.
Cuando respondas, usa párrafos cortos y listas con viñetas cuando aplique.`;

  const formulaCtx = formula
    ? `\n--- FÓRMULA ACTIVA ---\nNombre: ${formula.name}\nÁrea: ${
        formula.area === "panaderia" ? "Panadería" : "Pastelería"
      }\nHidratación: ${formula.hydration}%\nPiezas: ${formula.pieces} × ${
        formula.weightPerPiece
      }g\nIngredientes:\n${formula.ingredients
        .map(
          (i) =>
            `  • ${i.name}: ${i.percentage}% (${i.grams.toFixed(1)}g)${
              i.isFlour ? " [HARINA]" : i.isLiquid ? " [LÍQUIDO]" : ""
            }`
        )
        .join("\n")}\nCosto total: ${formula.totalCost.toFixed(2)}\n---`
    : "";

  const modeMap: Record<AgentMode, string> = {
    formula: `Analiza la fórmula. Evalúa balance de ingredientes, hidratación, posibles problemas y sugiere mejoras con porcentajes específicos.`,
    photo: `El usuario muestra una foto de su producto. Diagnostica: corteza, color, forma, miga. Explica qué pudo salir mal.`,
    ideas: `Genera ideas creativas de variaciones y sabores. Sé específico con porcentajes al sugerir modificaciones.`,
    costs: `Ayuda a reducir costos. Sugiere sustitutos más económicos sin comprometer calidad. Indica el porcentaje de ahorro.`,
    general: `Responde preguntas de panadería y pastelería con precisión práctica.`,
  };

  return `${base}${formulaCtx}\n\nModo: ${modeMap[mode]}`;
}

// ── Función principal ─────────────────────────────────────────────────────────

export async function askAgent(params: {
  userMessage: string;
  apiKey: string;
  model: string;
  mode?: AgentMode;
  formula?: SavedFormula;
  imageBase64?: string;
}): Promise<string> {
  const {
    userMessage,
    apiKey,
    model,
    mode = "general",
    formula,
    imageBase64,
  } = params;

  // ── Validación de API Key ─────────────────────────────────────────────────
  if (!apiKey || apiKey.trim().length < 20) {
    console.error("[Gemini] ❌ API Key vacía o demasiado corta");
    throw new Error(
      "Configura tu API Key de Gemini en Ajustes → Configuración IA"
    );
  }

  // ── Logs de depuración ────────────────────────────────────────────────────
  const cleanModel = model.trim() || "gemini-1.5-flash";
  console.log(`[Gemini] 🚀 Modelo: ${cleanModel}`);
  console.log(
    `[Gemini] 🔑 Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`
  );
  console.log(`[Gemini] 💬 Mensaje: "${userMessage.substring(0, 60)}..."`);
  if (imageBase64) console.log("[Gemini] 🖼️  Imagen adjunta");

  // ── Construir partes del mensaje ──────────────────────────────────────────
  const parts: object[] = [];

  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: imageBase64 },
    });
  }

  parts.push({
    text: buildSystemPrompt(mode, formula) + "\n\nUsuario: " + userMessage,
  });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_ONLY_HIGH",
      },
    ],
  };

  // ── URL del endpoint ──────────────────────────────────────────────────────
  // CORRECCIÓN CLAVE: usar "generateContent" con el modelo exacto (sin -latest)
  const url = `${GEMINI_BASE}/${cleanModel}:generateContent?key=${apiKey}`;
  console.log(
    `[Gemini] 🌐 URL: ${GEMINI_BASE}/${cleanModel}:generateContent?key=***`
  );

  // ── Enviar petición ───────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (netError) {
    console.error("[Gemini] ❌ Error de red:", netError);
    throw new Error(
      "Sin conexión a internet. Verifica tu red e intenta de nuevo."
    );
  }

  console.log(`[Gemini] 📡 HTTP Status: ${response.status}`);

  // ── Manejar errores HTTP ──────────────────────────────────────────────────
  if (!response.ok) {
    let errData: { error?: { message?: string } } = {};
    try {
      errData = await response.json();
    } catch { /* silent */ }

    const errMsg = errData?.error?.message ?? "Error desconocido";
    console.error(`[Gemini] ❌ Error ${response.status}: ${errMsg}`);

    if (response.status === 400 && errMsg.toLowerCase().includes("api key")) {
      throw new Error("API Key inválida. Revísala en Ajustes → Configuración IA.");
    }
    if (response.status === 400 && errMsg.toLowerCase().includes("model")) {
      throw new Error(
        `Modelo "${cleanModel}" no soportado. Cambia el modelo en Ajustes.`
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "API Key sin permisos. Actívala en aistudio.google.com → Get API Key."
      );
    }
    if (response.status === 404) {
      throw new Error(
        `Modelo "${cleanModel}" no encontrado. Usa "gemini-1.5-flash" o cambia en Ajustes.`
      );
    }
    if (response.status === 429) {
      throw new Error(
        "Límite de consultas alcanzado (15/min en plan gratis). Espera un minuto."
      );
    }
    throw new Error(`Error de Gemini (${response.status}): ${errMsg}`);
  }

  // ── Procesar respuesta ────────────────────────────────────────────────────
  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new Error(
      `Consulta bloqueada por filtros de Google: ${data.promptFeedback.blockReason}`
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[Gemini] ❌ Respuesta vacía:", JSON.stringify(data));
    throw new Error(
      "Gemini no devolvió respuesta. Reformula tu pregunta e intenta de nuevo."
    );
  }

  console.log(`[Gemini] ✅ Respuesta: ${text.length} chars`);
  return text.trim();
}

// ── Sugerencias por modo ──────────────────────────────────────────────────────

export const AGENT_SUGGESTIONS: Record<AgentMode, string[]> = {
  formula: [
    "¿Está equilibrada mi fórmula?",
    "¿Por qué me queda gomoso el pan?",
    "¿Cómo mejorar la hidratación?",
    "¿Puedo agregar más grasa sin afectar la textura?",
  ],
  photo: [
    "¿Por qué no subió bien?",
    "¿Qué falló en la corteza?",
    "¿La fermentación fue correcta?",
    "¿Cómo se ve la miga?",
  ],
  ideas: [
    "Dame 3 variaciones con chocolate",
    "¿Qué especias combinan con esta fórmula?",
    "¿Cómo hacer una versión sin gluten?",
    "Sugiere un relleno complementario",
  ],
  costs: [
    "¿Cómo reduzco el costo sin bajar calidad?",
    "¿Qué puedo sustituir por algo más barato?",
    "¿Cuál ingrediente es el más caro relativamente?",
    "Alternativas a la mantequilla",
  ],
  general: [
    "¿Cuánto tiempo fermentar a temperatura ambiente?",
    "¿Qué temperatura interna debe tener el pan?",
    "¿Cómo sé si mi masa madre está activa?",
    "Diferencia entre levadura fresca y seca",
  ],
};
