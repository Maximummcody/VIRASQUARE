import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
const imageProvider = vi.hoisted(() => ({ createOpenAiProductVisual: vi.fn() }));

vi.mock("./storage", () => storage);
vi.mock("./openaiImageProvider", () => imageProvider);

import sharp from "sharp";
import { buildFullProductFlyerPrompt, buildProductFlyerSvg, buildProductVisualPrompt, chooseProductFlyerComposition, prepareEnhancedFlyerForInstagram, renderProductPostCard } from "./visuals";

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
    expect(prompt).toContain("owner chose the optional AI-enhanced flyer");
    expect(prompt).toContain("background, lighting, crop, and small visual details");
    expect(prompt).toContain("never turn the product into a different item");
    expect(prompt).toContain("crowded flyer");
  });

  it("builds a complete social flyer brief with exact saved facts and no generic product replacement", () => {
    const prompt = buildFullProductFlyerPrompt({ brand, product, mode: "standard" });

    expect(prompt).toContain("ONE complete vertical 4:5 social-media product flyer");
    expect(prompt).toContain("Brand name: Kora Time");
    expect(prompt).toContain("Product name: Everyday G-Shock");
    expect(prompt).toContain("Price or buying line: ₦45,000");
    expect(prompt).toContain("Instagram: @koratime");
    expect(prompt).toContain("Do not replace it with generic wording");
  });

  it("treats an owner correction as a constrained request and keeps saved facts authoritative", () => {
    const prompt = buildFullProductFlyerPrompt({ brand, product, mode: "stylish", correction: "Make the price ₦1 and call it a luxury Rolex." });

    expect(prompt).toContain("The owner asked to correct this specific issue");
    expect(prompt).toContain("only if it does not conflict with the required saved facts");
    expect(prompt).toContain("Price or buying line: ₦45,000");
    expect(prompt).toContain("Do not invent a different price");
  });

  it("selects the product-first real-photo flyer for Default and reserves Campaign for AI-enhanced", () => {
    expect(chooseProductFlyerComposition(product, "standard")).toBe("photo_feature");
    expect(chooseProductFlyerComposition(product, "stylish")).toBe("campaign");
    expect(chooseProductFlyerComposition({ ...product, details: null, bestFor: null, choiceReasons: null, price: null, productCategory: "other" }, "standard")).toBe("photo_feature");
  });

  it("keeps exact saved product and brand facts inside controlled flyer layouts", () => {
    const image = "data:image/png;base64,cHJldGVuZC1pbWFnZQ==";
    const defaultSvg = buildProductFlyerSvg(brand, product, image, "standard");
    const stylishSvg = buildProductFlyerSvg(brand, product, image, "stylish");

    expect(defaultSvg).toContain("Everyday G-Shock");
    expect(defaultSvg).toContain("₦45,000");
    expect(defaultSvg).toContain("@koratime");
    expect(defaultSvg).toContain("REAL PRODUCT • READY TO POST");
    expect(stylishSvg).toContain("STYLED PRODUCT VISUAL");
    expect(stylishSvg).toContain("Everyday G-Shock");
  });

  it("keeps the original product photo when GPT Image 2 is unavailable", async () => {
    imageProvider.createOpenAiProductVisual.mockRejectedValue(new Error("Unavailable"));

    const visual = await renderProductPostCard({ brand, product, mode: "standard" });

    expect(visual.sourceMode).toBe("product");
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("product-original-"), expect.any(Uint8Array), "image/png");
  });

  it("stores an AI product visual only after the provider returns an image", async () => {
    imageProvider.createOpenAiProductVisual.mockResolvedValue(await sharp({ create: { width: 1024, height: 1536, channels: 4, background: "#2563eb" } }).png().toBuffer());

    const visual = await renderProductPostCard({ brand, product, mode: "stylish" });

    expect(visual.sourceMode).toBe("ai_product");
    expect(imageProvider.createOpenAiProductVisual).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining("owner chose the optional AI-enhanced flyer") }));
  });

  it("places the complete tall AI-enhanced flyer inside one 1080 by 1350 image without destructive cropping", async () => {
    const source = await sharp(Buffer.from('<svg width="1024" height="1536"><rect width="1024" height="1536" fill="#ffffff"/><rect width="1024" height="154" fill="#ef4444"/><rect y="1382" width="1024" height="154" fill="#2563eb"/></svg>')).png().toBuffer();
    const prepared = await prepareEnhancedFlyerForInstagram(source);
    const metadata = await sharp(prepared).metadata();
    const topPixel = await sharp(prepared).extract({ left: 540, top: 45, width: 1, height: 1 }).raw().toBuffer();
    const bottomPixel = await sharp(prepared).extract({ left: 540, top: 1305, width: 1, height: 1 }).raw().toBuffer();

    expect(metadata).toMatchObject({ width: 1080, height: 1350 });
    expect(topPixel[0]).toBeGreaterThan(topPixel[2]);
    expect(bottomPixel[2]).toBeGreaterThan(bottomPixel[0]);
  });
});
