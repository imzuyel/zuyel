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
    console.warn("[AI Multi-Key Failover] No active AI keys configured. Using PTSC Intelligent Offline Generator...");
    return {
      text: generateLocalIntelligentFallback(options),
      providerId: "ptsc_offline_engine",
      keyAlias: "PTSC Local Intelligence Engine",
      modelName: "bteb-curriculum-fallback",
      attempts: 0,
    };
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

  // If ALL keys in pool failed, activate Intelligent Offline Generator so the teacher NEVER sees a broken error screen!
  console.warn(`[AI Multi-Key Failover] ALL ${pool.length} API keys in pool were exhausted or rate-limited. Activating PTSC Intelligent Offline Generator...`);
  return {
    text: generateLocalIntelligentFallback(options),
    providerId: "ptsc_offline_engine",
    keyAlias: "PTSC Local Intelligence Engine",
    modelName: "bteb-curriculum-fallback",
    attempts: attempt,
  };
}

/**
 * Intelligent Local Fallback Generator for when all external LLM APIs fail or hit rate limits
 */
export function generateLocalIntelligentFallback(options: GenerationOptions): string {
  const prompt = options.prompt || options.messages?.map((m) => m.content).join(" ") || "";
  const isJson = options.responseMimeType === "application/json";

  // Check if this is a quiz question generation request
  const isQuiz = /quiz|question|প্রশ্ন|mcq|অপশন|multichoice/i.test(prompt) || /quiz|question/i.test(options.systemPrompt || "");

  // Check if this is a presentation slide generation request
  const isPresentation = /presentation|slide|স্লাইড|লেকচার/i.test(prompt) || /presentation|slide/i.test(options.systemPrompt || "");

  // Extract topic
  let topic = "কম্পিউটার ও তথ্য প্রযুক্তি";
  const topicMatch = prompt.match(/(?:topic|বিষয়|টপিক|অধ্যায়|chapter|for)[:\s]+"?([^"\n\r,]+)"?/i);
  if (topicMatch && topicMatch[1]) {
    topic = topicMatch[1].trim();
  }

  if (isJson) {
    if (isQuiz) {
      return JSON.stringify([
        {
          id: 1,
          type: "mcq_single",
          question: `${topic} এর প্রধান কারিগরি সুবিধা নিচের কোনটি?`,
          options: ["উচ্চ ডেটা প্রসেসিং গতি", "কম মেমোরি ব্যবহার", "অ্যানালগ সিগন্যাল রূপান্তর", "ম্যানুয়াল নিয়ন্ত্রণ ব্যবস্থা"],
          correctAnswer: 0,
          explanation: `${topic} আধুনিক সিস্টেমে দ্রুত ডেটা বিশ্লেষণ এবং উচ্চ প্রক্রিয়াকরণ গতি নিশ্চিত করে।`,
          timeLimit: 20,
          difficulty: "Medium"
        },
        {
          id: 2,
          type: "mcq_single",
          question: `${topic} সিস্টেমে ডেটা নিরাপত্তার জন্য সবচেয়ে গুরুত্বপূর্ণ প্রটোকল কোনটি?`,
          options: ["এনক্রিপশন ও ফায়ারওয়াল", "সরাসরি ব্রডকাস্ট", "আনসিকিউর এফটিপি", "ওপেন পোর্ট সংযোগ"],
          correctAnswer: 0,
          explanation: "সিস্টেমের অননুমোদিত অ্যাক্সেস রোধে শক্তিশালী এনক্রিপশন এবং ফায়ারওয়াল অপরিহার্য।",
          timeLimit: 20,
          difficulty: "Medium"
        },
        {
          id: 3,
          type: "mcq_single",
          question: `${topic} এর ক্ষেত্রে ত্রুটি নির্ণয়ের (Troubleshooting) প্রথম ধাপ কোনটি?`,
          options: ["সমস্যাটি সঠিকভাবে শনাক্তকরণ", "সরাসরি ডিভাইস পরিবর্তন", "পুরো সিস্টেম ফরম্যাট", "পাওয়ার বন্ধ রাখা"],
          correctAnswer: 0,
          explanation: "কারিগরি ট্রাবলশুটিং-এর প্রমিত পদ্ধতি অনুসারে প্রথমে মূল সমস্যা চিহ্নিত করা আবশ্যক।",
          timeLimit: 20,
          difficulty: "Easy"
        },
        {
          id: 4,
          type: "mcq_single",
          question: `${topic} এ ব্যবহৃত কোর মেমোরি বা বাফারের কাজ কী?`,
          options: ["অস্থায়ী ডেটা সংরক্ষণ", "স্থায়ী ব্যাকআপ তৈরি", "পাওয়ার সাপ্লাই দেওয়া", "বাহ্যিক নেটওয়ার্ক তৈরি"],
          correctAnswer: 0,
          explanation: "বাফার মেমোরি প্রসেসর ও ইনপুটের মধ্যে অস্থায়ী ডেটা ধারণ করে ভারসাম্য রক্ষা করে।",
          timeLimit: 20,
          difficulty: "Medium"
        },
        {
          id: 5,
          type: "mcq_single",
          question: `${topic} বাস্তবায়নে ইন্ডাস্ট্রিয়াল স্ট্যান্ডার্ড হার্ডওয়্যার কোনটি?`,
          options: ["মাইক্রোকন্ট্রোলার ও সেন্সর", "সাধারণ ক্যালকুলেটর", "ম্যানুয়াল সুইচ বোর্ড", "অডিও স্পিকার"],
          correctAnswer: 0,
          explanation: "শিল্প কারখানায় অটোমেশন ও নিয়ন্ত্রণের জন্য প্রোগ্রামেবল কন্ট্রোলার ও সেন্সর ব্যবহৃত হয়।",
          timeLimit: 20,
          difficulty: "Hard"
        }
      ], null, 2);
    }

    if (isPresentation) {
      return JSON.stringify({
        title: `${topic} - পাঠ পরিচিতি ও বিশ্লেষণ`,
        theme: "Twilight Indigo",
        slides: [
          {
            title: `${topic}: মূল ধারণা ও পরিচিতি`,
            content: `${topic} কারিগরি ও প্রযুক্তিগত শিক্ষার অন্যতম গুরুত্বপূর্ণ মৌলিক বিষয়। এটি আধুনিক ইন্ডাস্ট্রিয়াল অটোমেশন এবং সিস্টেম ইঞ্জিনিয়ারিং-এর ভিত্তি হিসেবে কাজ করে।`,
            bulletPoints: [
              "মৌলিক স্থাপত্য ও প্রযুক্তিগত পরিধি",
              "বর্তমান শিল্প ও কারিগরি ক্ষেত্রে প্রয়োগ",
              "দক্ষতা অর্জন ও আধুনিক কর্মসংস্থানের সুযোগ"
            ],
            notes: "শিক্ষার্থীদের মৌলিক ধারণার ওপর জোর দিন।"
          },
          {
            title: `${topic}: মূল উপাদান ও গঠন কাঠামো`,
            content: "সিস্টেমের নির্ভরযোগ্য কার্যক্ষমতার জন্য এর প্রতিটি উপাদান সঠিকভাবে সংযুক্ত ও ক্যালিব্রেট করা প্রয়োজন।",
            bulletPoints: [
              "ইনপুট ও ডেটা কালেকশন ইন্টারফেস",
              "সেন্ট্রাল প্রসেসিং ও লজিক কন্ট্রোলার",
              "আউটপুট অ্যাকচুয়েটর ও ডিসপ্লে প্যানেল"
            ],
            notes: "উপাদানগুলোর কার্যপ্রণালী আলোচনা করুন।"
          },
          {
            title: `${topic}: বাস্তব কর্মক্ষেত্রে প্রয়োগ ও কেস স্টাডি`,
            content: "আন্তর্জাতিক কারিগরি মান ও বিটিইবি পাঠ্যসূচি অনুসারে ল্যাবরেটরি ও ইন্ডাস্ট্রিতে এর বহুমুখী ব্যবহার রয়েছে।",
            bulletPoints: [
              "স্বয়ংক্রিয় প্রোডাকশন লাইন নিয়ন্ত্রণ",
              "রিয়েল-টাইম মনিটরিং ও আইওটি ইন্টিগ্রেশন",
              "নিরাপত্তা প্রটোকল ও প্রতিরোধমূলক রক্ষণাবেক্ষণ"
            ],
            notes: "বাস্তব উদাহরণের সাহায্যে শিক্ষার্থীদের বুঝিয়ে বলুন।"
          }
        ]
      }, null, 2);
    }

    // Default generic structured JSON
    return JSON.stringify({
      success: true,
      topic,
      source: "ptsc_intelligent_offline_generator",
      timestamp: new Date().toISOString()
    });
  }

  // Plain text lesson fallback
  return `# ${topic} - কারিগরি পাঠ্যসূচি\n\n## ১. পরিচিতি ও গুরুত্ব\n${topic} আধুনিক কারিগরি ও বৃত্তিমূলক শিক্ষার একটি অত্যন্ত অপরিহার্য ক্ষেত্র। এটি শিক্ষার্থীদের হ্যান্ডস-অন প্র্যাকটিক্যাল দক্ষতা ও প্রযুক্তিগত ভিত্তি মজবুত করতে ভূমিকা রাখে।\n\n## ২. মূল প্রযুক্তিগত ধাপসমূহ\n- **সিস্টেম কনফিগারেশন:** হার্ডওয়্যার ও সফটওয়্যারের সঠিক সমন্বয়।\n- **নিরাপত্তা ও মানদণ্ড:** কর্মক্ষেত্রে স্ট্যান্ডার্ড সেফটি প্রটোকল অনুসরণ।\n- **পরীক্ষা ও সমাধান:** নিয়মিত কার্যক্ষমতা নিরীক্ষা ও ট্রাবলশুটিং।\n\n## ৩. শিক্ষার্থীদের জন্য নির্দেশিকা\nল্যাব ক্লাসে শিক্ষক ও ইনস্ট্রাক্টরের নির্দেশ মেনে প্র্যাকটিক্যাল কাজ সম্পন্ন করুন এবং জব বুকে ফলাফল রেকর্ড করুন।`;
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

    let modelCascade = [
      model,
      item.defaultModel,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-3.8-flash",
    ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

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

    let lastGeminiErr: any = null;
    for (const targetModel of modelCascade) {
      try {
        const response = await genAI.models.generateContent({
          model: targetModel,
          contents,
          config,
        });

        if (response.text && response.text.trim()) {
          return response.text;
        }
      } catch (gErr: any) {
        lastGeminiErr = gErr;
        const msg = String(gErr?.message || "").toLowerCase();
        console.warn(`[Gemini Model Cascade] Model '${targetModel}' error: ${msg.slice(0, 80)}. Retrying with next fallback model...`);
      }
    }

    throw lastGeminiErr || new Error("All Gemini models in cascade failed.");
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

import { safeParseAiObject, cleanJsonString, repairJsonString } from "./safeJsonParser";

/**
 * Convenience helper to generate and parse structured JSON responses safely with multi-key failover
 */
export async function generateJsonWithFailover<T>(options: GenerationOptions): Promise<{ data: T; result: GenerationResult }> {
  const result = await generateWithFailover({
    ...options,
    responseMimeType: "application/json",
  });

  const text = (result.text || "").trim();
  let parsed: any = null;

  try {
    parsed = JSON.parse(text);
  } catch {
    try {
      const cleaned = cleanJsonString(text);
      parsed = JSON.parse(cleaned);
    } catch {
      try {
        const repaired = repairJsonString(text);
        parsed = JSON.parse(repaired);
      } catch {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(repairJsonString(jsonMatch[0]));
          } catch {
            parsed = safeParseAiObject<T>(text, {} as T);
          }
        } else {
          parsed = safeParseAiObject<T>(text, {} as T);
        }
      }
    }
  }

  return { data: parsed as T, result };
}
