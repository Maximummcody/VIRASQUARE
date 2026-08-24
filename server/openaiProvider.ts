export type OpenAiMessage = { role: "system" | "user"; content: string };

type StructuredRequest = {
  messages: OpenAiMessage[];
  schemaName: string;
  schema: Record<string, unknown>;
  model?: string;
};

const openAiEndpoint = "https://api.openai.com/v1/chat/completions";
const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-5.6-luna";

function readProviderError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;
    if (error && typeof error.message === "string") return error.message;
  }
  return fallback;
}

export async function requestOpenAiStructuredText({ messages, schemaName, schema, model }: StructuredRequest): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI text generation is not configured.");

  const response = await fetch(openAiEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || textModel,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: { name: schemaName, strict: true, schema },
      },
    }),
  });

  const payload = await response.json().catch(() => null) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  } | null;

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}): ${readProviderError(payload, "The text service did not return a usable response.")}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned an empty structured response.");
  }
  return content;
}
