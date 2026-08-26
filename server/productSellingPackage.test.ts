import { describe, expect, it, vi } from "vitest";

const openAi = vi.hoisted(() => ({ requestOpenAiStructuredText: vi.fn() }));
vi.mock("./openaiProvider", () => openAi);

import { generateProductSellingPackage } from "./productSellingPackage";

const brand = { businessName: "Ades Closet", businessType: "Fashion seller", customerMarket: "Nigeria", brandVoice: "Warm and clear", defaultCta: "Send us a message to order.", instagramHandle: "adescloset" };
const product = { name: "Mirror handbag", price: "35000", currency: "NGN", details: "A metallic fashion handbag.", productCategory: "fashion", bestFor: "Women who want a statement accessory.", choiceReasons: "Reflective finish.", buyerNote: null, categoryDetails: null };

describe("product selling package", () => {
  it("uses saved product facts to request a caption, buyer reply, and distinct next angle", async () => {
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ caption: "Meet the Mirror handbag from Ades Closet. Its reflective finish makes it a statement accessory for women who want one.\n\nPrice: ₦35,000. Send us a message to order.", buyerReply: "Hello, the Mirror handbag is ₦35,000. Send us a message to order.", nextAngleTitle: "Show the finish up close", nextAngleDescription: "Focus on the reflective finish and why it gives this handbag a statement look." }));

    const result = await generateProductSellingPackage({ brand, product });
    const request = openAi.requestOpenAiStructuredText.mock.calls[0]?.[0];

    expect(request.messages[1].content).toContain('"productName":"Mirror handbag"');
    expect(request.messages[1].content).toContain('"savedPrice":"₦35000"');
    expect(request.messages[0].content).toContain("Never invent");
    expect(result.buyerReply).toContain("₦35,000");
    expect(result.nextAngleTitle).not.toContain("—");
  });

  it("rejects incomplete or unusably short provider output", async () => {
    openAi.requestOpenAiStructuredText.mockResolvedValueOnce(JSON.stringify({ caption: "Short", buyerReply: "Also short", nextAngleTitle: "Angle", nextAngleDescription: "Too short" }));

    await expect(generateProductSellingPackage({ brand, product })).rejects.toThrow("not usable");
  });
});
