export interface GeminiGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
}

export interface GeminiResponse {
  ok: boolean;
  text?: string;
  error?: string;
}

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getGeminiApiKey(): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const workerSecret = (env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY;
    return workerSecret || process.env.GEMINI_API_KEY;
  } catch {
    return process.env.GEMINI_API_KEY;
  }
}

/**
 * Invoca la API REST de Google Gemini de forma compatible con Edge Runtime y Cloudflare Workers.
 * No requiere paquetes externos de npm, utiliza el fetch nativo del entorno.
 */
export async function callGemini(options: GeminiGenerateOptions): Promise<GeminiResponse> {
  const apiKey = getGeminiApiKey();

  if (!apiKey || apiKey.trim() === "") {
    return {
      ok: false,
      error: "MISSING_API_KEY",
      text: "La clave GEMINI_API_KEY no está configurada en las variables de entorno. Por favor configúrala para activar las respuestas de IA en vivo.",
    };
  }

  // Usamos gemini-2.5-flash por su alta velocidad y soporte activo en la API
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];

  let systemInstructionPayload: { parts: Array<{ text: string }> } | undefined = undefined;
  if (options.systemInstruction) {
    systemInstructionPayload = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  contents.push({
    parts: [{ text: options.prompt }],
  });

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 4000,
      thinkingConfig: {
        thinkingBudget: options.thinkingBudget ?? 0,
      },
    },
  };

  if (systemInstructionPayload) {
    payload.systemInstruction = systemInstructionPayload;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini API Error]", response.status, errorText);
      return {
        ok: false,
        error: `API_ERROR_${response.status}`,
        text: `Error de respuesta de Google Gemini (${response.status}). Revisa la validez de tu clave de API.`,
      };
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string; thought?: boolean }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts || [];
    const generatedText = parts
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("");

    if (!generatedText || !generatedText.trim()) {
      return {
        ok: false,
        error: "NO_CONTENT",
        text: "El modelo no generó ninguna respuesta.",
      };
    }

    return {
      ok: true,
      text: generatedText.trim(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Gemini Fetch Error]", message);
    return {
      ok: false,
      error: "NETWORK_ERROR",
      text: `No se pudo conectar con los servidores de Google Gemini: ${message}`,
    };
  }
}
