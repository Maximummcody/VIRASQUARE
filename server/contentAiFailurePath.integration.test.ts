import { afterEach, describe, expect, it } from "vitest";
import { generateDailyDraft, generateIdeas, generateWeeklyPlan } from "./contentAi";

const profile = {
  businessName: "Clarity Studio",
  businessType: "handmade jewellery",
  targetAudience: "People choosing meaningful everyday accessories",
  customerMarket: "Nigeria",
  contentPillars: ["Educate", "Build trust"],
  postingGoal: "Start useful customer conversations",
  weeklyPostGoal: 3,
  brandVoice: "Warm and clear",
};

afterEach(() => {
  delete process.env.VIRASQUARE_TEST_OPENAI_FAILURE;
});

describe("ViraSquare OpenAI provider failure path", () => {
  it("surfaces the intended unavailable and support guidance through post, idea, and weekly-plan generation", async () => {
    process.env.VIRASQUARE_TEST_OPENAI_FAILURE = "usage_exhausted";
    const dates = ["2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30"];

    await expect(generateDailyDraft(profile, dates[0]!)).rejects.toThrow("Please try again later or contact support");
    await expect(generateIdeas(profile, "carousel", [], { objective: "Education" })).rejects.toThrow("Live AI generation is currently unavailable");
    await expect(generateWeeklyPlan(profile, dates)).rejects.toThrow("Please try again later or contact support");
  });
});
