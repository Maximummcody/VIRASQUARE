import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { invokeLLM } from "./_core/llm";
import { requestOpenAiStructuredText } from "./openaiProvider";

const schema = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          objective: { type: "string" },
          format: { type: "string", enum: ["caption", "carousel", "tip", "promo", "story"] },
          brief: { type: "string" },
        },
        required: ["title", "objective", "format", "brief"],
        additionalProperties: false,
      },
    },
  },
  required: ["ideas"],
  additionalProperties: false,
} as const;

const messages = [
  { role: "system" as const, content: "You are ViraSquare, a precise social-media strategist for a small business. Do not invent customer claims, reviews, pricing, availability, or results. Return only JSON matching the requested schema." },
  { role: "user" as const, content: "Business profile: {\"businessName\":\"Clarity Studio\",\"businessType\":\"handmade jewellery\",\"targetAudience\":\"People choosing meaningful everyday accessories\",\"contentPillars\":[\"Educate\",\"Build trust\"],\"postingGoal\":\"Start useful customer conversations\",\"weeklyPostGoal\":3,\"brandVoice\":\"Warm and clear\"}. Generate exactly 5 distinct, personalized carousel ideas for the owner’s chosen goal: Education. Topic: jewellery care. Each brief should explain the angle in one practical sentence." },
];

async function measure(name: string, request: () => Promise<string>) {
  const startedAt = performance.now();
  try {
    const content = await request();
    return { provider: name, status: "available", elapsedMs: Math.round(performance.now() - startedAt), responseChars: content.length };
  } catch (error) {
    return { provider: name, status: "unavailable", elapsedMs: Math.round(performance.now() - startedAt), error: error instanceof Error ? error.message : "Unknown provider error" };
  }
}

describe.runIf(process.env.RUN_OPENAI_LIVE_TESTS === "true")("ViraSquare text-provider benchmark", () => {
  it("measures equivalent non-persistent idea requests through both providers", async () => {
    const openAi = await measure("OpenAI GPT-5.6 Luna", () => requestOpenAiStructuredText({ model: "gpt-5.6-luna", schemaName: "virasquare_speed_benchmark", schema, messages }));
    const builtIn = await measure("Manus built-in GPT-5 mini", async () => {
      const response = await invokeLLM({ model: "gpt-5-mini", messages, response_format: { type: "json_schema", json_schema: { name: "virasquare_speed_benchmark", strict: true, schema } } });
      const content = response.choices[0]?.message.content;
      if (typeof content !== "string") throw new Error("Built-in provider returned no text content.");
      return content;
    });

    await writeFile("/tmp/virasquare-text-provider-benchmark.json", JSON.stringify({ measuredAt: new Date().toISOString(), prompt: "Five structured jewellery-care carousel ideas", results: [openAi, builtIn] }, null, 2));
    expect(openAi.status).toBe("available");
  }, 120_000);
});
