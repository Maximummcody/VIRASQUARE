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

  it("passes only the selected product facts into a product-led Luna request", async () => {
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ ideas: [{ title: "A clear everyday hoop guide", objective: "Feature a product", format: "promo", brief: "Explain the real material, lightweight feel, and two available sizes without inventing a claim." }] }));

    await generateIdeas(profile, "promo", [], {
      objective: "Feature a product",
      selectedProduct: { id: 19, name: "Everyday hoop earrings", price: "18500", currency: "NGN", productCategory: "accessories", bestFor: "Everyday wear and simple gifting", choiceReasons: "Gold-plated finish and two sizes", buyerNote: "Confirm your preferred size before ordering", categoryDetails: "Lightweight hoops in small and medium", details: "Gold-plated, lightweight, two sizes" },
    });

    const call = openAi.requestOpenAiStructuredText.mock.calls.at(-1)?.[0];
    expect(call.messages[0].content).toContain("use only its supplied facts");
    expect(call.messages[1].content).toContain('"selectedProduct":{"id":19');
    expect(call.messages[1].content).toContain('"name":"Everyday hoop earrings"');
    expect(call.messages[1].content).toContain('"choiceReasons":"Gold-plated finish and two sizes"');
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

  it("normalizes one template family across a carousel even when a provider returns mixed per-card templates", async () => {
    const body = "Start with the ordinary action people can repeat today. Explain why it helps, then add useful details so the advice works in real life.";
    const slide = (cardType: "cover" | "guide" | "checklist" | "closing", templateFamily: "editorial" | "action" | "comparison" | "conversation") => ({ cardType, eyebrow: "PRACTICAL STYLE", heading: "A clear point customers can use", body, footer: "Save this useful guide", templateFamily, graphicCue: "style" as const });
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ title: "One coherent carousel", objective: "Education", format: "carousel", brief: "A useful local style guide.", caption: "A caption.", hashtags: [], requiresProduct: false, preparationNote: "", carouselSlides: [slide("cover", "comparison"), slide("guide", "action"), slide("checklist", "editorial"), slide("closing", "conversation")] }));

    const draft = await generateDailyDraft(profile, "2026-08-24");
    expect(new Set(draft.carouselSlides.map(item => item.templateFamily))).toEqual(new Set(["action"]));
  });

  it("retains the comparison visual system only when carousel content contains a genuine contrast", async () => {
    const body = "Do this instead of guessing when you are choosing between two options.\n\n• Compare the two choices clearly\n• Choose the option that supports your goal\n• Keep the final decision practical for everyday life";
    const slide = (cardType: "cover" | "guide" | "checklist" | "closing") => ({ cardType, eyebrow: "STYLE CHOICE", heading: "Do this versus that", body, footer: "Save this comparison", templateFamily: "comparison" as const, graphicCue: "choice" as const });
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ title: "A real comparison", objective: "Education", format: "carousel", brief: "A useful contrast.", caption: "A caption.", hashtags: [], requiresProduct: false, preparationNote: "", carouselSlides: [slide("cover"), slide("guide"), slide("checklist"), slide("closing")] }));

    const draft = await generateDailyDraft(profile, "2026-08-24");
    expect(new Set(draft.carouselSlides.map(item => item.templateFamily))).toEqual(new Set(["comparison"]));
  });

  it("removes long dashes from generated copy before it reaches the ViraSquare workspace", async () => {
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ ideas: [{ title: "Wear it well — without overthinking", objective: "Education", format: "carousel", brief: "A useful guide — for everyday dressing." }] }));

    const ideas = await generateIdeas(profile, "carousel");
    expect(ideas[0]?.title).toBe("Wear it well, without overthinking");
    expect(ideas[0]?.brief).toBe("A useful guide, for everyday dressing.");
  });
});
