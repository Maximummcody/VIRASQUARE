import { writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { requestOpenAiStructuredText } from "./openaiProvider";

const ideaSchema = {
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

describe.runIf(process.env.RUN_OPENAI_LIVE_TESTS === "true")("ViraSquare OpenAI model comparison", () => {
  it("collects comparable structured idea sets from Luna and Terra without creating user content", async () => {
    const models = ["gpt-5.6-luna", "gpt-5.6-terra"] as const;
    const output = await Promise.all(models.map(async model => {
      const response = await requestOpenAiStructuredText({ model, schemaName: "virasquare_idea_comparison", schema: ideaSchema, messages });
      return { model, result: JSON.parse(response) as { ideas: Array<{ title: string; objective: string; format: string; brief: string }> } };
    }));

    for (const entry of output) {
      expect(entry.result.ideas).toHaveLength(5);
      expect(entry.result.ideas.every(idea => idea.title && idea.objective && idea.format && idea.brief)).toBe(true);
    }

    await writeFile("/tmp/virasquare-model-comparison.json", JSON.stringify(output, null, 2));
  }, 90_000);
});
