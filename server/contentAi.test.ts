import { describe, expect, it, vi } from "vitest";

const llm = vi.hoisted(() => ({ invokeLLM: vi.fn() }));

vi.mock("./_core/llm", () => llm);

import { generateDailyDraft, generateIdeas, generateWeeklyPlan } from "./contentAi";

const profile = {
  businessName: "Clarity Studio",
  businessType: "handmade jewellery",
  targetAudience: "People choosing meaningful everyday accessories",
  contentPillars: ["Educate", "Build trust"],
  postingGoal: "Start useful customer conversations",
  weeklyPostGoal: 3,
  brandVoice: "Warm and clear",
};

describe("ViraSquare content AI fallbacks", () => {
  it("returns a complete deterministic card draft when the AI allocation is exhausted", async () => {
    llm.invokeLLM.mockRejectedValueOnce(new Error('LLM invoke failed: 412 Precondition Failed – {"message":"your account has hit a usage exhausted"}'));

    const result = await generateDailyDraft(profile, "2026-08-23");

    expect(result.generationSource).toBe("starter");
    expect(result.caption).toContain("Clarity Studio");
    expect(result.carouselSlides.length).toBeGreaterThanOrEqual(4);
    expect(result.requiresProduct).toBe(false);
  });

  it("returns five requested fallback ideas without retrying the exhausted AI service", async () => {
    llm.invokeLLM.mockRejectedValueOnce(new Error("usage exhausted"));

    const ideas = await generateIdeas(profile, "carousel", [], { objective: "Engagement", topic: "layering everyday jewellery" });

    expect(ideas).toHaveLength(5);
    expect(ideas.every(idea => idea.generationSource === "starter")).toBe(true);
    expect(ideas.every(idea => idea.objective === "Engagement")).toBe(true);
    expect(ideas.every(idea => idea.format === "carousel")).toBe(true);
  });

  it("returns a spread weekly starter plan when the AI allocation is exhausted", async () => {
    llm.invokeLLM.mockRejectedValueOnce(new Error("usage exhausted"));

    const result = await generateWeeklyPlan(profile, ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"]);

    expect(result.generationSource).toBe("starter");
    expect(result.plan.filter(item => item.isPostDay)).toHaveLength(3);
  });
});
