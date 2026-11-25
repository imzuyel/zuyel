import fs from "fs";
import path from "path";
import { getHybridAiSettings, saveHybridAiSettings } from "@/lib/hybridStorageEngine";

export interface AIProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  baseUrl?: string;
  priority: number;
  models: string[];
  defaultModel: string;
}

export interface AISettings {
  providers: AIProviderConfig[];
  globalFailoverEnabled: boolean;
  continuationEnabled: boolean;
}

const CONFIG_PATH = path.join(process.cwd(), "data", "ai-settings.json");

const DEFAULT_SETTINGS: AISettings = {
  providers: [
    {
      id: "gemini",
      name: "Google Gemini",
      enabled: true,
      apiKey: process.env.GEMINI_API_KEY || "",
      priority: 1,
      models: ["gemini-3.8-flash", "gemini-3.1-pro-preview"],
      defaultModel: "gemini-3.8-flash"
    },
    {
      id: "groq",
      name: "Groq Cloud",
      enabled: false,
      apiKey: "",
      baseUrl: "https://api.groq.com/openai/v1",
      priority: 2,
      models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
      defaultModel: "llama-3.3-70b-versatile"
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      enabled: false,
      apiKey: "",
      baseUrl: "https://openrouter.ai/api/v1",
      priority: 3,
      models: ["anthropic/claude-3.5-sonnet", "meta-llama/llama-3.1-405b"],
      defaultModel: "anthropic/claude-3.5-sonnet"
    }
  ],
  globalFailoverEnabled: true,
  continuationEnabled: true
};

function sanitizeSettings(settings: AISettings): AISettings {
  if (!settings || !Array.isArray(settings.providers)) return DEFAULT_SETTINGS;
  settings.providers = settings.providers.map((p) => {
    if (p.id === "gemini") {
      const sanitizedModels = p.models.map((m) => {
        if (m.includes("2.5") || m.includes("2.0") || m.includes("1.5")) {
          return "gemini-3.8-flash";
        }
        return m;
      });
      const uniqueModels = Array.from(new Set(sanitizedModels.length > 0 ? sanitizedModels : ["gemini-3.8-flash", "gemini-3.1-pro-preview"]));
      let defaultModel = p.defaultModel;
      if (!defaultModel || defaultModel.includes("2.5") || defaultModel.includes("2.0") || defaultModel.includes("1.5")) {
        defaultModel = "gemini-3.8-flash";
      }
      return {
        ...p,
        apiKey: p.apiKey || process.env.GEMINI_API_KEY || "",
        models: uniqueModels,
        defaultModel
      };
    }
    return p;
  });
  return settings;
}

declare global {
  // eslint-disable-next-line no-var
  var __pgtscAiSettingsCache: AISettings | undefined;
  // eslint-disable-next-line no-var
  var __pgtscAiSettingsWriteTimer: ReturnType<typeof setTimeout> | undefined;
}

export function getAISettings(): AISettings {
  if (globalThis.__pgtscAiSettingsCache) {
    return globalThis.__pgtscAiSettingsCache;
  }
  try {
    const hybrid = getHybridAiSettings();
    if (hybrid && Array.isArray(hybrid.providers) && hybrid.providers.length > 0) {
      globalThis.__pgtscAiSettingsCache = sanitizeSettings(hybrid);
      return globalThis.__pgtscAiSettingsCache;
    }
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      globalThis.__pgtscAiSettingsCache = sanitizeSettings(JSON.parse(data));
      return globalThis.__pgtscAiSettingsCache;
    }
  } catch (error) {
    console.error("Error reading AI settings:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveAISettings(settings: AISettings) {
  try {
    const sanitized = sanitizeSettings(settings);
    globalThis.__pgtscAiSettingsCache = sanitized;
    try {
      saveHybridAiSettings(sanitized);
    } catch (hErr) {
      console.warn("[HybridStore] Failed to save AI settings to hybrid engine:", hErr);
    }

    if (globalThis.__pgtscAiSettingsWriteTimer) {
      clearTimeout(globalThis.__pgtscAiSettingsWriteTimer);
    }
    globalThis.__pgtscAiSettingsWriteTimer = setTimeout(async () => {
      try {
        const dir = path.dirname(CONFIG_PATH);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(sanitized, null, 2), "utf-8");
      } catch (err) {
        console.error("Async AI settings write error:", err);
      }
    }, 1500);
    return true;
  } catch (error) {
    console.error("Error saving AI settings:", error);
    return false;
  }
}

export function getEnabledProviders(): AIProviderConfig[] {
  const settings = getAISettings();
  return settings.providers
    .filter(p => p.enabled && p.apiKey)
    .sort((a, b) => a.priority - b.priority);
}
