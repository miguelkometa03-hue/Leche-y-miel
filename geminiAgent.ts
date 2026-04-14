// utils/geminiAgent.ts
// ✅ FIX #2 + #3:
//   - getApiKey / saveApiKey / clearApiKey RESTAURADOS (eran importados por agent.tsx pero no existían)
//   - askAgent ahora requiere el parámetro `model` correctamente
//   - Soporte DeepSeek R1 como segundo proveedor de IA
//   - Logs de consola detallados para depuración

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedFormula } from "@/types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const STORAGE_KEY_GEMINI = "pastrypro_gemini_api_key";
const STORAGE_KEY_DEEPSEEK = "pastrypro_deepseek_api_key";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  imageUri?: string;
  timestamp: Date;
}

export type AgentMode = "formula" | "photo" | "ideas" | "costs" | "general";
export type AIProvider = "gemini" | "deepseek";

// ── Gestión de API Keys ───────────────────────────────────────────────────────
// ✅ RESTAURADAS — agent.tsx las importa y no existían en la versión rota

export async function saveApiKey(apiKey: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_GEMINI, apiKey.trim());
    console.log("[GeminiAgent] ✅ Key Gemini guardada");
  } catch (error) {
    console.error("[GeminiAgent] ❌ Error guardando key:", error);
    throw new Error("No se pudo guardar la API Key");
  }
}

export async function getApiKey(): Promise<string | null> {
  try {
    const key = await AsyncStorage.getItem(STORAGE_KEY_GEMINI);
    console.log(key
      ? `[GeminiAgent] 🔑 Key recuperada: ${key.substring(0, 8)}...`
      : "[GeminiAgent] ⚠️  Sin key guardada en AsyncStorage"
    );
    return key;
  } catch {
    return null;
  }
}

export async function clearApiKey(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_GEMINI);
  console.log("[GeminiAgent] 🗑️  Key Gemini eliminada");
}

export async function saveDeepSeekKey(apiKey: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_DEEPSEEK, apiKey.trim());
  console.log("[DeepSeek] ✅ Key DeepSeek guardada");
}

export async function getDeepSeekKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY_DEEPSEEK);
  } catch {
    return null;
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(mode: AgentMode, formula?: SavedFormula): string {
  const base = `Eres un experto maestro panadero y pastelero con 20 años de experiencia.
Tu nombre es "Miel", el asistente de la app Pastry-Pro.
Respondes SIEMPRE en español, de forma práctica, clara y amigable.
Usas términos técnicos de panadería pero los explicas cuando son complejos.
Ofreces soluciones concretas con cantidades y porcentajes.
Nunca inventas información. Usa párrafos cortos y listas cuando aplique.`;

  const formulaCtx = formula
    ? `\n\n--- FÓRMULA ACTIVA ---\nNombre: ${formula.name}\nÁrea: ${
        formula.area === "panaderia" ? "Panadería" : "Pastelería"
      }\nHidratación: ${formula.hydration}%\nPiezas: ${formula.pieces} × ${
        formula.weightPerPiece
      }g\nIngredientes:\n${formula.ingredients
        .map((i) => `  • ${i.name}: ${i.percentage}% (${i.grams.toFixed(1)}g)${i.isFlour ? " [HARINA]" : i.isLiquid ? " [LÍQUIDO]" : ""}`)
        .join("\n")}\nCosto total: ${formula.totalCost.toFixed(2)}\n---`
    : "";

  const modeMap: Record<AgentMode, string> = {
    formula: "Analiza la fórmula: balance, hidratación, problemas posibles y mejoras con porcentajes.",
    photo: "El usuario muestra una foto de su producto. Diagnostica corteza, color, forma, miga.",
    ideas: "Genera ideas creativas de variaciones. Sé específico con porcentajes.",
    costs: "Ayuda a reducir costos con sustitutos económicos sin perder calidad.",
    general: "Responde preguntas de panadería y pastelería con precisión práctica.",
  };

  return `${base}${formulaCtx}\n\nModo: ${modeMap[mode]}`;
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function askGemini(p: {
  userMessage: string; apiKey: string; model: string;
  mode: AgentMode; formula?: SavedFormula; imageBase64?: string;
}): Promise<string> {
  const cleanModel = p.model.trim() || "gemini-1.5-flash";
  console.log(`[Gemini] 🚀 Modelo: ${cleanModel}`);
  console.log(`[Gemini] 🔑 ${p.apiKey.substring(0, 8)}...`);

  const parts: object[] = [];
  if (p.imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: p.imageBase64 } });
  parts.push({ text: buildSystemPrompt(p.mode, p.formula) + "\n\nUsuario: " + p.userMessage });

  const body = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.9 },
    safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }],
  };

  let resp: Response;
  try {
    resp = await fetch(`${GEMINI_BASE}/${cleanModel}:generateContent?key=${p.apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error("Sin conexión. Verifica tu internet.");
  }

  console.log(`[Gemini] 📡 HTTP ${resp.status}`);

  if (!resp.ok) {
    let err: { error?: { message?: string } } = {};
    try { err = await resp.json(); } catch { /**/ }
    const msg = err?.error?.message ?? "Error desconocido";
    console.error(`[Gemini] ❌ ${resp.status}: ${msg}`);
    if (resp.status === 400 && msg.toLowerCase().includes("api key")) throw new Error("API Key inválida. Revísala en Ajustes.");
    if (resp.status === 404) throw new Error(`Modelo "${cleanModel}" no encontrado. Cambia en Ajustes.`);
    if (resp.status === 401 || resp.status === 403) throw new Error("Sin permisos. Activa la key en aistudio.google.com.");
    if (resp.status === 429) throw new Error("Límite alcanzado (15/min). Espera un minuto.");
    throw new Error(`Error Gemini (${resp.status}): ${msg}`);
  }

  const data = await resp.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) throw new Error(`Consulta bloqueada: ${data.promptFeedback.blockReason}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini no respondió. Reformula tu pregunta.");

  console.log(`[Gemini] ✅ ${text.length} chars`);
  return text.trim();
}

// ── DeepSeek ──────────────────────────────────────────────────────────────────

async function askDeepSeek(p: {
  userMessage: string; apiKey: string; mode: AgentMode; formula?: SavedFormula;
}): Promise<string> {
  console.log("[DeepSeek] 🚀 Consultando DeepSeek R1");

  const body = {
    model: "deepseek-reasoner",
    messages: [
      { role: "system", content: buildSystemPrompt(p.mode, p.formula) },
      { role: "user", content: p.userMessage },
    ],
    max_tokens: 1024,
    temperature: 0.7,
    stream: false,
  };

  let resp: Response;
  try {
    resp = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.apiKey}` },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error("Sin conexión con DeepSeek.");
  }

  console.log(`[DeepSeek] 📡 HTTP ${resp.status}`);

  if (!resp.ok) {
    let err: { error?: { message?: string } } = {};
    try { err = await resp.json(); } catch { /**/ }
    const msg = err?.error?.message ?? "Error desconocido";
    if (resp.status === 401) throw new Error("API Key DeepSeek inválida. Configúrala en Ajustes.");
    if (resp.status === 402) throw new Error("Saldo insuficiente en DeepSeek. Recarga en platform.deepseek.com.");
    if (resp.status === 429) throw new Error("Límite DeepSeek alcanzado. Espera.");
    throw new Error(`Error DeepSeek (${resp.status}): ${msg}`);
  }

  const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("DeepSeek no respondió. Intenta de nuevo.");

  console.log(`[DeepSeek] ✅ ${text.length} chars`);
  return text.trim();
}

// ── Router principal ──────────────────────────────────────────────────────────

export async function askAgent(params: {
  userMessage: string;
  apiKey: string;
  model: string;           // ✅ FIX: ahora requerido, no opcional
  mode?: AgentMode;
  formula?: SavedFormula;
  imageBase64?: string;
  provider?: AIProvider;
  deepSeekApiKey?: string;
}): Promise<string> {
  const { userMessage, apiKey, model, mode = "general", formula, imageBase64, provider = "gemini", deepSeekApiKey } = params;

  if (!apiKey || apiKey.trim().length < 20) {
    throw new Error("Configura tu API Key en Ajustes → Configuración IA");
  }

  console.log(`[Agent] 🤖 Proveedor: ${provider} | Modo: ${mode}`);

  if (provider === "deepseek") {
    return askDeepSeek({ userMessage, apiKey: deepSeekApiKey || apiKey, mode, formula });
  }
  return askGemini({ userMessage, apiKey, model, mode, formula, imageBase64 });
}

// ── Sugerencias ───────────────────────────────────────────────────────────────

export const AGENT_SUGGESTIONS: Record<AgentMode, string[]> = {
  formula: ["¿Está equilibrada mi fórmula?", "¿Por qué me queda gomoso el pan?", "¿Cómo mejorar la hidratación?", "¿Puedo agregar más grasa?"],
  photo: ["¿Por qué no subió bien?", "¿Qué falló en la corteza?", "¿La fermentación fue correcta?", "¿Cómo se ve la miga?"],
  ideas: ["Dame 3 variaciones con chocolate", "¿Qué especias combinan?", "¿Cómo hacer versión sin gluten?", "Sugiere un relleno"],
  costs: ["¿Cómo reduzco el costo?", "¿Qué puedo sustituir?", "¿Cuál es el ingrediente más caro?", "Alternativas a la mantequilla"],
  general: ["¿Cuánto tiempo fermentar?", "¿Qué temperatura interna tiene el pan?", "¿Cómo sé si la masa madre está activa?", "Diferencia levadura fresca vs seca"],
};
