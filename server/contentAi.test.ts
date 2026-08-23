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

describe("ViraSquare live AI availability", () => {
  it("reports a support-directed unavailable message instead of returning lower-quality starter content when usage is exhausted", async () => {
    llm.invokeLLM.mockRejectedValueOnce(new Error('LLM invoke failed: 412 Precondition Failed – {"message":"your account has hit a usage exhausted"}'));

    await expect(generateDailyDraft(profile, "2026-08-23")).rejects.toThrow("Please contact support at help.manus.im");
  });

  it("keeps the same unavailable message across owner-directed ideas and weekly planning", async () => {
    llm.invokeLLM.mockRejectedValueOnce(new Error("usage exhausted"));
    await expect(generateIdeas(profile, "carousel", [], { objective: "Engagement" })).rejects.toThrow("Live AI generation is currently unavailable");

    llm.invokeLLM.mockRejectedValueOnce(new Error("usage exhausted"));
    await expect(generateWeeklyPlan(profile, ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"])).rejects.toThrow("Please contact support at help.manus.im");
  });
});
