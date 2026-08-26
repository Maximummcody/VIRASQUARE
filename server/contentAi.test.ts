import { describe, expect, it, vi } from "vitest";
import { describe, expect, it, vi } from "vitest";

const openAi = vi.hoisted(() => ({ requestOpenAiStructuredText: vi.fn() }));

vi.mock("./openaiProvider", () => openAi);

import { chooseCarouselVisualSystem, generateDailyDraft, generateIdeas, generateWeeklyPlan } from "./contentAi";

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

  it("makes one balanced product-selling opportunity eligible only when the owner has a saved product", async () => {
    const dates = ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"];
    openAi.requestOpenAiStructuredText.mockRejectedValueOnce(new Error("usage exhausted"));
    await expect(generateWeeklyPlan(profile, dates, [], true)).rejects.toThrow("Live AI generation is currently unavailable");
    expect(openAi.requestOpenAiStructuredText.mock.calls.at(-1)?.[0].messages[1].content).toContain("Include exactly one product-selling opportunity");
    expect(openAi.requestOpenAiStructuredText.mock.calls.at(-1)?.[0].messages[1].content).toContain("Do not name, price, or describe a product");

    openAi.requestOpenAiStructuredText.mockRejectedValueOnce(new Error("usage exhausted"));
    await expect(generateWeeklyPlan(profile, dates, [], false)).rejects.toThrow("Live AI generation is currently unavailable");
    expect(openAi.requestOpenAiStructuredText.mock.calls.at(-1)?.[0].messages[1].content).toContain("Do not include \"Feature a product\"");
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

  it("removes rich-card payloads from a normal product post even if the provider includes them", async () => {
    const accidentalCard = { cardType: "product", eyebrow: "PRODUCT", heading: "Everyday hoop earrings", body: "Gold-plated lightweight hoops in two sizes for everyday wear.", footer: "Send a message to order.", templateFamily: "editorial", graphicCue: "quality" };
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ title: "Everyday hoops", objective: "Feature a product", format: "promo", brief: "Feature the saved hoops truthfully.", caption: "Everyday hoop earrings for a simple finish. Price: ₦18,500. Send us a message to order.", hashtags: [], requiresProduct: true, preparationNote: "Use the saved product image and verified price.", carouselSlides: [accidentalCard] }));

    const draft = await generateDailyDraft(profile, "2026-08-24", { title: "Everyday hoops", objective: "Feature a product", format: "promo", brief: "Feature the saved hoops truthfully." }, [], { id: 19, name: "Everyday hoop earrings", price: "18500", currency: "NGN", details: "Gold-plated, lightweight, two sizes" });

    expect(draft.format).toBe("promo");
    expect(draft.carouselSlides).toEqual([]);
    expect(openAi.requestOpenAiStructuredText.mock.calls.at(-1)?.[0].messages[1].content).toContain("A normal product post uses the product flyer");
  });

  it("keeps rich cards for an explicitly selected educational carousel about a saved product", async () => {
    const body = "Start with one clear choice customers can make. Explain why it matters for everyday use, then keep the details practical and easy to compare.";
    const slide = (cardType: "cover" | "guide" | "checklist" | "closing") => ({ cardType, eyebrow: "PRODUCT EDUCATION", heading: "Choose your everyday hoops with confidence", body, footer: "Save this for your next choice", templateFamily: "action", graphicCue: "choice" });
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ title: "How to choose everyday hoops", objective: "Education", format: "carousel", brief: "Help customers consider their everyday preference.", caption: "A useful guide before you choose your next pair.", hashtags: [], requiresProduct: false, preparationNote: "", carouselSlides: [slide("cover"), slide("guide"), slide("checklist"), slide("closing")] }));

    const draft = await generateDailyDraft(profile, "2026-08-24", { title: "How to choose everyday hoops", objective: "Education", format: "carousel", brief: "Help customers consider their everyday preference." }, [], { id: 19, name: "Everyday hoop earrings", details: "Gold-plated, lightweight, two sizes" });

    expect(draft.format).toBe("carousel");
    expect(draft.carouselSlides).toHaveLength(4);
    expect(draft.requiresProduct).toBe(false);
    expect(new Set(draft.carouselSlides.map(item => item.visualSystem))).toEqual(new Set(["product_anatomy"]));
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
    expect(new Set(draft.carouselSlides.map(item => item.templateFamily))).toEqual(new Set(["editorial"]));
    expect(new Set(draft.carouselSlides.map(item => item.visualSystem))).toEqual(new Set(["lookbook_notes"]));
  });

  it("retains the comparison visual system only when carousel content contains a genuine contrast", async () => {
    const body = "Do this instead of guessing when you are choosing between two options.\n\n• Compare the two choices clearly\n• Choose the option that supports your goal\n• Keep the final decision practical for everyday life";
    const slide = (cardType: "cover" | "guide" | "checklist" | "closing") => ({ cardType, eyebrow: "STYLE CHOICE", heading: "Do this versus that", body, footer: "Save this comparison", templateFamily: "comparison" as const, graphicCue: "choice" as const });
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ title: "A real comparison", objective: "Education", format: "carousel", brief: "A useful contrast.", caption: "A caption.", hashtags: [], requiresProduct: false, preparationNote: "", carouselSlides: [slide("cover"), slide("guide"), slide("checklist"), slide("closing")] }));

    const draft = await generateDailyDraft(profile, "2026-08-24");
    expect(new Set(draft.carouselSlides.map(item => item.templateFamily))).toEqual(new Set(["comparison"]));
    expect(new Set(draft.carouselSlides.map(item => item.visualSystem))).toEqual(new Set(["balanced_contrast"]));
  });

  it("selects a content-fit visual system and avoids a recently used eligible system", () => {
    const actionDraft = { title: "Three steps for a calmer evening routine", objective: "Education", format: "carousel" as const, brief: "A practical sequence for everyday customers.", caption: "", hashtags: [], requiresProduct: false, preparationNote: "", carouselSlides: [] };
    const checklistDraft = { ...actionDraft, title: "What to check before you buy", brief: "A buying checklist with practical red flags." };
    const questionDraft = { ...actionDraft, title: "Which style feels most like you?", brief: "Ask customers to share their preference." };

    expect(chooseCarouselVisualSystem(actionDraft)).toBe("action_path");
    expect(chooseCarouselVisualSystem(actionDraft, undefined, ["action_path"])).toBe("field_checklist");
    expect(chooseCarouselVisualSystem(checklistDraft)).toBe("field_checklist");
    expect(chooseCarouselVisualSystem(questionDraft)).toBe("question_studio");
  });

  it("removes long dashes from generated copy before it reaches the ViraSquare workspace", async () => {
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ ideas: [{ title: "Wear it well — without overthinking", objective: "Education", format: "carousel", brief: "A useful guide — for everyday dressing." }] }));

    const ideas = await generateIdeas(profile, "carousel");
    expect(ideas[0]?.title).toBe("Wear it well, without overthinking");
    expect(ideas[0]?.brief).toBe("A useful guide, for everyday dressing.");
  });
});
