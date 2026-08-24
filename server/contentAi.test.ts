import { describe, expect, it, vi } from "vitest";
import { describe, expect, it, vi } from "vitest";

const openAi = vi.hoisted(() => ({ requestOpenAiStructuredText: vi.fn() }));

vi.mock("./openaiProvider", () => openAi);

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

describe("ViraSquare live AI availability", () => {
  it("reports a support-directed unavailable message instead of returning lower-quality starter content when usage is exhausted", async () => {
    openAi.requestOpenAiStructuredText.mockRejectedValueOnce(new Error('OpenAI request failed (429): {"message":"your account has hit a usage exhausted"}'));

    await expect(generateDailyDraft(profile, "2026-08-23")).rejects.toThrow("Please try again later or contact support");
  });

  it("keeps the same unavailable message across owner-directed ideas and weekly planning", async () => {
    openAi.requestOpenAiStructuredText.mockRejectedValueOnce(new Error("usage exhausted"));
    await expect(generateIdeas(profile, "carousel", [], { objective: "Engagement" })).rejects.toThrow("Live AI generation is currently unavailable");

    openAi.requestOpenAiStructuredText.mockRejectedValueOnce(new Error("usage exhausted"));
    await expect(generateWeeklyPlan(profile, ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"])).rejects.toThrow("Please try again later or contact support");
  });

  it("sends owner-directed ideas through the OpenAI structured-text provider without changing the idea contract", async () => {
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ ideas: [{ title: "A thoughtful care guide", objective: "Education", format: "carousel", brief: "Help customers choose and care for a meaningful everyday piece." }] }));

    await expect(generateIdeas(profile, "carousel", [], { objective: "Education", topic: "Jewellery care" })).resolves.toEqual([{ title: "A thoughtful care guide", objective: "Education", format: "carousel", brief: "Help customers choose and care for a meaningful everyday piece." }]);
    expect(openAi.requestOpenAiStructuredText).toHaveBeenCalledWith(expect.objectContaining({ schemaName: "content_ideas", messages: expect.arrayContaining([expect.objectContaining({ role: "system" }), expect.objectContaining({ role: "user", content: expect.stringContaining("Jewellery care") })]) }));
  });

  it("carries the customer market and complete-card rendering contract into a Luna content request", async () => {
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ title: "A practical jewellery care guide", objective: "Education", format: "caption", brief: "Help customers protect everyday pieces with realistic habits.", caption: "A useful caption.", hashtags: ["#JewelleryCare"], requiresProduct: false, preparationNote: "", carouselSlides: [] }));

    await generateDailyDraft(profile, "2026-08-24");
    const call = openAi.requestOpenAiStructuredText.mock.calls.at(-1)?.[0];
    expect(call.messages[0].content).toContain("Respect the customerMarket");
    expect(call.messages[1].content).toContain('"customerMarket":"Nigeria"');
    expect(call.messages[1].content).toContain("one clear main point");
    expect(call.messages[1].content).toContain("templateFamily");
    expect(call.messages[1].content).toContain("graphicCue");
  });

  it("rejects a sparse carousel rather than passing an underfilled card to the visual renderer", async () => {
    const sparse = { cardType: "guide", eyebrow: "TIP", heading: "A useful point", body: "Do this.", footer: "Save it", templateFamily: "action", graphicCue: "process" };
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ title: "Sparse set", objective: "Education", format: "carousel", brief: "A short brief.", caption: "A caption.", hashtags: [], requiresProduct: false, preparationNote: "", carouselSlides: [{ ...sparse, cardType: "cover" }, sparse, sparse, { ...sparse, cardType: "closing", templateFamily: "conversation" }] }));

    await expect(generateDailyDraft(profile, "2026-08-24")).rejects.toThrow("could not prepare a complete card set");
  });
});
