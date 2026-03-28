type AIMessage = {
  role: "system" | "user";
  content: string;
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

export async function generateStructuredJson<T>(messages: AIMessage[]) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const apiUrl = process.env.AI_API_URL ?? "https://api.openai.com/v1";

  if (!apiKey || !model) {
    return null as T | null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    return null as T | null;
  }

  return JSON.parse(stripJsonFences(content)) as T;
}