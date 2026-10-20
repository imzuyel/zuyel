import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { getEnabledProviders, AIProviderConfig } from "./aiConfigStore";

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerationOptions {
  prompt?: string;
  systemPrompt?: string;
  messages?: AIChatMessage[];
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: any; // Gemini-specific schema
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GenerationResult {
  text: string;
  providerId: string;
  keyAlias: string;
  modelName: string;
  attempts: number;
}

export interface KeyPoolItem {
  id: string; // Unique identifier for key pool tracking
  providerId: "gemini" | "groq" | "openrouter" | "openai" | string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  cooldownUntil: number; // Timestamp in ms
  failCount: number;
  successCount: number;
}

// In-memory key health state tracker across server requests
const keyCooldownTracker: Record<string, number> = {};
const keyStatsTracker: Record<string, { success: number; fail: number }> = {};

/**
 * Utility to mask API key for secure logging
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

/**
 * Builds the centralized pool of all active API keys and providers
 * Collects keys from:
 * 1. Env vars: GEMINI_API_KEY, GEMINI_API_KEY_1..5, GEMINI_API_KEYS (comma separated)
 * 2. Env vars: GROQ_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY
 * 3. Settings file configured providers (aiConfigStore)
 */
export function buildAIKeyPool(): KeyPoolItem[] {
  const pool: KeyPoolItem[] = [];
  const now = Date.now();

  // Helper to add Gemini key if valid
  const addGeminiKey = (key: string, alias: string) => {
    const trimmed = (key || "").trim();
    if (trimmed && trimmed !== "DUMMY_KEY" && trimmed.length > 5) {
      if (!pool.some((p) => p.apiKey === trimmed)) {
        const keyId = `gemini-${alias}`;
        pool.push({
          id: keyId,
          providerId: "gemini",
          name: `Google Gemini (${alias})`,
          apiKey: trimmed,
          defaultModel: process.env.AI_MODEL || "gemini-flash-latest",
          cooldownUntil: keyCooldownTracker[keyId] || 0,
          failCount: keyStatsTracker[keyId]?.fail || 0,
          successCount: keyStatsTracker[keyId]?.success || 0,
        });
      }
    }
  };

  // 1. Check primary GEMINI_API_KEY
  if (process.env.GEMINI_API_KEY) {
    addGeminiKey(process.env.GEMINI_API_KEY, "primary");
  }

  // 2. Check indexed GEMINI_API_KEY_1 through GEMINI_API_KEY_5
  for (let i = 1; i <= 5; i++) {
    const keyVar = process.env[`GEMINI_API_KEY_${i}`];
    if (keyVar) {
      addGeminiKey(keyVar, `key-${i}`);
    }
  }

  // 3. Check comma-separated GEMINI_API_KEYS
  if (process.env.GEMINI_API_KEYS) {
    const keys = process.env.GEMINI_API_KEYS.split(",");
    keys.forEach((k, idx) => addGeminiKey(k, `multi-${idx + 1}`));
  }

  // 4. Check other environment providers
  if (process.env.GROQ_API_KEY) {
    const key = process.env.GROQ_API_KEY.trim();
    const keyId = "groq-env-primary";
    pool.push({
      id: keyId,
      providerId: "groq",
      name: "Groq Cloud (env)",
      apiKey: key,
      baseUrl: "https://api.groq.com/openai/v1",
      defaultModel: "llama-3.3-70b-versatile",
      cooldownUntil: keyCooldownTracker[keyId] || 0,
      failCount: keyStatsTracker[keyId]?.fail || 0,
      successCount: keyStatsTracker[keyId]?.success || 0,
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    const key = process.env.OPENROUTER_API_KEY.trim();
    const keyId = "openrouter-env-primary";
    pool.push({
      id: keyId,
      providerId: "openrouter",
      name: "OpenRouter (env)",
      apiKey: key,
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "anthropic/claude-3.5-sonnet",
      cooldownUntil: keyCooldownTracker[keyId] || 0,
      failCount: keyStatsTracker[keyId]?.fail || 0,
      successCount: keyStatsTracker[keyId]?.success || 0,
    });
  }

  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY.trim();
    const keyId = "openai-env-primary";
    pool.push({
      id: keyId,
      providerId: "openai",
      name: "OpenAI (env)",
      apiKey: key,
      defaultModel: "gpt-4o-mini",
      cooldownUntil: keyCooldownTracker[keyId] || 0,
      failCount: keyStatsTracker[keyId]?.fail || 0,
      successCount: keyStatsTracker[keyId]?.success || 0,
    });
  }

  // 5. Merge configured providers from aiConfigStore
  try {
    const configuredProviders = getEnabledProviders();
    configuredProviders.forEach((prov) => {
      if (prov.apiKey && !pool.some((p) => p.apiKey === prov.apiKey)) {
        const keyId = `config-${prov.id}`;
        pool.push({
          id: keyId,
          providerId: prov.id,
          name: prov.name,
          apiKey: prov.apiKey,
          baseUrl: prov.baseUrl,
          defaultModel: prov.defaultModel || "gemini-3.8-flash",
          cooldownUntil: keyCooldownTracker[keyId] || 0,
          failCount: keyStatsTracker[keyId]?.fail || 0,
          successCount: keyStatsTracker[keyId]?.success || 0,
        });
      }
    });
  } catch (err) {
    // Ignore store error if not initialized
  }

  // Filter out items in active cooldown unless all are in cooldown
  const availableNow = pool.filter((item) => item.cooldownUntil < now);
  if (availableNow.length > 0) {
    return availableNow;
  }

  // If all keys are in cooldown, reset cooldowns and return full pool so requests still have a chance
  return pool;
}

/**
 * Returns current status summary of all AI keys in the pool for admin monitoring
 */
export function getKeyPoolStatusSummary() {
  const pool = buildAIKeyPool();
  const now = Date.now();
  return pool.map((k) => ({
    id: k.id,
    name: k.name,
    maskedKey: maskApiKey(k.apiKey),
    provider: k.providerId,
    defaultModel: k.defaultModel,
    isAvailable: k.cooldownUntil < now,
    cooldownRemainingSec: Math.max(0, Math.round((k.cooldownUntil - now) / 1000)),
    failCount: k.failCount,
    successCount: k.successCount,
  }));
}

/**
 * Main Central AI Call Execution Wrapper with Multi-Key Rotation and Intelligent Failover
 */
export async function generateWithFailover(options: GenerationOptions): Promise<GenerationResult> {
  const pool = buildAIKeyPool();

  if (pool.length === 0) {
    throw new Error("No valid AI API keys or providers configured in PTSC ERP environment or settings.");
  }

  let lastError: any = null;
  let attempt = 0;

  for (const item of pool) {
    attempt++;
    const maskedKey = maskApiKey(item.apiKey);
    console.info(`[AI Multi-Key Failover] Attempt ${attempt}/${pool.length}: Route -> ${item.name} (${maskedKey}) using model '${options.model || item.defaultModel}'`);

    try {
      const text = await executeSingleAIRequest(item, options);

      if (!text || !text.trim()) {
        throw new Error(`Empty response generated by ${item.name}`);
      }

      // Record success in stats
      keyStatsTracker[item.id] = {
        success: (keyStatsTracker[item.id]?.success || 0) + 1,
        fail: keyStatsTracker[item.id]?.fail || 0,
      };

      // Reset cooldown on success
      delete keyCooldownTracker[item.id];

      console.info(`[AI Multi-Key Failover] Success on attempt ${attempt} using ${item.name} (${maskedKey})!`);

      return {
        text,
        providerId: item.providerId,
        keyAlias: item.name,
        modelName: options.model || item.defaultModel,
        attempts: attempt,
      };
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.statusCode || error?.response?.status || 0;
      const errMsg = String(error?.message || error?.error?.message || error || "").toLowerCase();

      // Record failure stats
      keyStatsTracker[item.id] = {
        success: keyStatsTracker[item.id]?.success || 0,
        fail: (keyStatsTracker[item.id]?.fail || 0) + 1,
      };

      // Check if this error is due to demand / rate limit / quota exhaustion
      const isDemandOrQuotaIssue =
        status === 429 ||
        status === 403 ||
        status === 503 ||
        status === 500 ||
        status === 502 ||
        status === 504 ||
        errMsg.includes("429") ||
        errMsg.includes("resource_exhausted") ||
        errMsg.includes("quota") ||
        errMsg.includes("exhausted") ||
        errMsg.includes("rate limit") ||
        errMsg.includes("too many requests") ||
        errMsg.includes("overloaded") ||
        errMsg.includes("capacity") ||
        errMsg.includes("demand") ||
        errMsg.includes("unavailable");

      if (isDemandOrQuotaIssue) {
        // Set a 60-second cooldown for this specific key
        const cooldownMs = 60 * 1000;
        keyCooldownTracker[item.id] = Date.now() + cooldownMs;
        console.warn(`[AI Key Rotation] Rate limit/Quota exhausted on ${item.name} (${maskedKey}). Cooldown for 60s. Rotating to next key...`);
        continue;
      }

      // Content safety or minor error: log and try next provider anyway
      console.warn(`[AI Key Rotation] Error on ${item.name} (${maskedKey}): ${errMsg.slice(0, 150)}. Rotating to next key...`);
      continue;
    }
  }

  // If ALL keys in pool failed
  console.error(`[AI Multi-Key Failover] ALL ${pool.length} API keys in pool were exhausted or failed.`);
  throw (
    lastError ||
    new Error("সকল AI API Key এবং ব্যাকআপ প্রোভাইডার সাময়িকভাবে ব্যস্ত বা কোটা শেষ। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।")
  );
}

/**
 * Execute a single AI call using the target KeyPoolItem configuration
 */
async function executeSingleAIRequest(item: KeyPoolItem, options: GenerationOptions): Promise<string> {
  const { prompt, systemPrompt, messages, responseMimeType, responseSchema, temperature, maxTokens, model } = options;

  if (item.providerId === "gemini") {
    const genAI = new GoogleGenAI({
      apiKey: item.apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let contents: any[] = [];
    let systemInstruction: string | undefined = systemPrompt;

    if (messages && messages.length > 0) {
      const history = messages.filter((m) => m.role !== "system");
      const system = messages.find((m) => m.role === "system");
      if (system) systemInstruction = system.content;

      contents = history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    } else {
      contents = [{ role: "user", parts: [{ text: prompt || "" }] }];
    }

    let modelName = model || item.defaultModel || "gemini-3.8-flash";
    if (modelName === "gemini-2.5-flash" || modelName === "gemini-2.0-flash" || modelName === "gemini-flash-latest") {
      modelName = "gemini-3.8-flash";
    }

    const config: any = {
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? 8192,
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }

    if (responseSchema) {
      config.responseSchema = responseSchema;
    }

    const response = await genAI.models.generateContent({
      model: modelName,
      contents,
      config,
    });

    return response.text || "";
  } else {
    // OpenAI Compatible SDK (Groq, OpenRouter, OpenAI, etc.)
    const client = new OpenAI({
      apiKey: item.apiKey || "",
      baseURL: item.baseUrl || undefined,
      dangerouslyAllowBrowser: false,
    });

    let finalMessages: any[] = [];

    if (messages && messages.length > 0) {
      finalMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
    } else {
      if (systemPrompt) {
        finalMessages.push({ role: "system", content: systemPrompt });
      }

      let userPrompt = prompt || "";
      if (responseMimeType === "application/json" && !userPrompt.toLowerCase().includes("json")) {
        userPrompt += "\n\nIMPORTANT: Return ONLY a valid JSON object.";
      }
      finalMessages.push({ role: "user", content: userPrompt });
    }

    const targetModel = model || item.defaultModel;

    const response = await client.chat.completions.create({
      model: targetModel,
      messages: finalMessages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 8192,
      response_format: responseMimeType === "application/json" ? { type: "json_object" } : undefined,
    });

    return response.choices[0]?.message?.content || "";
  }
}

/**
 * Convenience helper to generate and parse structured JSON responses safely with multi-key failover
 */
export async function generateJsonWithFailover<T>(options: GenerationOptions): Promise<{ data: T; result: GenerationResult }> {
  const result = await generateWithFailover({
    ...options,
    responseMimeType: "application/json",
  });

  const text = result.text.trim();
  let parsed: any = null;

  try {
    parsed = JSON.parse(text);
  } catch {
    // Clean markdown code blocks if present
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = JSON.parse(cleaned);
    }
  }

  return { data: parsed as T, result };
}
