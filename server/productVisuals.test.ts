import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
const imageProvider = vi.hoisted(() => ({ createOpenAiProductVisual: vi.fn() }));

vi.mock("./storage", () => storage);
vi.mock("./openaiImageProvider", () => imageProvider);

import { buildProductVisualPrompt, renderProductPostCard } from "./visuals";

const brand = { businessName: "Kora Time", businessType: "Accessories", brandVoice: "Warm and clear", primaryColor: "#263327", accentColor: "#EAF2CA", defaultCta: "Send us a message to order.", instagramHandle: "koratime" };
const product = { name: "Everyday G-Shock", price: "45000", currency: "NGN", details: "Red resin watch", imageKey: "72/products/watch.jpg", productCategory: "accessories", bestFor: "Workdays and weekends", choiceReasons: "Durable resin strap and easy-to-read face" };

describe("approved Group 1 product-visual safeguards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    storage.storageGetSignedUrl.mockResolvedValue("https://storage.example/source.jpg");
    storage.storagePut.mockResolvedValue({ key: "visuals/test.png", url: "/manus-storage/visuals/test.png" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(Buffer.from("source-image"), { status: 200, headers: { "content-type": "image/jpeg" } })));
  });

  it("makes the default route preserve the real product and forbids text or invented facts", () => {
    const prompt = buildProductVisualPrompt(product, "standard");
    expect(prompt).toContain("Preserve the exact product shown");
    expect(prompt).toContain("Do not replace, redesign, remove, add, simplify, or invent");
    expect(prompt).toContain("Do not add words, price, logo, Instagram handle");
    expect(prompt).toContain("normal Generate product-post card route");
  });

  it("allows only restrained creative treatment in Stylish generation", () => {
    const prompt = buildProductVisualPrompt(product, "stylish");
    expect(prompt).toContain("owner chose Stylish generation");
    expect(prompt).toContain("background, lighting, crop, and small visual details");
    expect(prompt).toContain("never turn the product into a different item");
    expect(prompt).toContain("crowded flyer");
  });

  it("keeps the original product photo when GPT Image 2 is unavailable", async () => {
    imageProvider.createOpenAiProductVisual.mockRejectedValue(new Error("Unavailable"));

    const visual = await renderProductPostCard({ brand, product, mode: "standard" });

    expect(visual.sourceMode).toBe("product");
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("product-original-"), expect.any(Uint8Array), "image/png");
  });

  it("stores an AI product visual only after the provider returns an image", async () => {
    imageProvider.createOpenAiProductVisual.mockResolvedValue(Buffer.from("generated-image"));

    const visual = await renderProductPostCard({ brand, product, mode: "stylish" });

    expect(visual.sourceMode).toBe("ai_product");
    expect(imageProvider.createOpenAiProductVisual).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining("owner chose Stylish generation") }));
  });
});
