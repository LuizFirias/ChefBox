import { createHash } from "node:crypto";

import {
  AI_BASE_MODEL,
  AI_CACHE_TTL_MS,
  AI_MAX_OUTPUT_TOKENS,
  AI_MAX_OUTPUT_TOKENS_MEAL_PLAN,
  AI_PREMIUM_MODEL,
} from "@/lib/config";

type AIMessage = {
  role: "system" | "user";
  content: string;
};

type AIFeature = "default" | "recipes" | "meal_plan" | "macro_calculator";

type GenerateStructuredJsonOptions = {
  feature?: AIFeature;
  isPremium?: boolean;
  modelTier?: "base" | "premium";
  maxOutputTokens?: number;
  useCache?: boolean;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function stripJsonFences(payload: string) {
  return payload.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

const responseCache = new Map<string, { expiresAt: number; payload: unknown }>();

function getModelTier(options: GenerateStructuredJsonOptions) {
  if (options.modelTier) {
    return options.modelTier;
  }

  if (options.feature === "meal_plan" || options.isPremium) {
    return "premium";
  }

  return "base";
}

export function resolveAiModel(options: GenerateStructuredJsonOptions = {}) {
  return getModelTier(options) === "premium" ? AI_PREMIUM_MODEL : AI_BASE_MODEL;
}

function buildCacheKey(model: string, messages: AIMessage[], maxOutputTokens: number) {
  return createHash("sha256")
    .update(JSON.stringify({ model, messages, maxOutputTokens }))
    .digest("hex");
}

export async function generateStructuredJson<T>(
  messages: AIMessage[],
  options: GenerateStructuredJsonOptions = {},
) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL ?? "https://api.openai.com/v1";
  const model = resolveAiModel(options);
  const maxOutputTokens =
    options.maxOutputTokens ??
    (options.feature === "meal_plan" ? AI_MAX_OUTPUT_TOKENS_MEAL_PLAN : AI_MAX_OUTPUT_TOKENS);
  const useCache = options.useCache ?? true;

  if (!apiKey || !model) {
    console.error("[AI] Missing configuration:", {
      hasApiKey: !!apiKey,
      model,
      apiUrl,
    });
    return null as T | null;
  }

  const cacheKey = buildCacheKey(model, messages, maxOutputTokens);
  const cached = useCache ? responseCache.get(cacheKey) : null;

  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload as T;
  }

  if (cached) {
    responseCache.delete(cacheKey);
  }

  console.log("[AI] Making request:", {
    model,
    feature: options.feature,
    tier: getModelTier(options),
    maxTokens: maxOutputTokens,
    temperature: options.feature === "recipes" ? 0.9 : 0.2,
  });

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: options.feature === "recipes" ? 0.9 : 0.2,
      max_completion_tokens: maxOutputTokens,
      response_format: { type: "json_object" },
      messages,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Could not read error body");
    console.error("[AI] Request failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText.substring(0, 200),
    });
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    console.warn("[AI] No content in response:", { payload });
    return null as T | null;
  }

  console.log("[AI] Received content:", {
    length: content.length,
    preview: content.substring(0, 100) + "...",
  });

  const parsed = JSON.parse(stripJsonFences(content)) as T;
  console.log("[AI] Successfully parsed JSON");

  if (useCache) {
    responseCache.set(cacheKey, {
      expiresAt: Date.now() + AI_CACHE_TTL_MS,
      payload: parsed,
    });
  }

  return parsed;
}