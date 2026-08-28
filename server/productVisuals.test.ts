import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

const storage = vi.hoisted(() => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));
const imageProvider = vi.hoisted(() => ({ createOpenAiProductVisual: vi.fn() }));

vi.mock("./storage", () => storage);
vi.mock("./openaiImageProvider", () => imageProvider);

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

  it("allows only restrained creative treatment in the optional AI-enhanced flyer", () => {
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
    expect(defaultSvg).toContain("REAL PRODUCT");
    expect(stylishSvg).toContain("STYLED PRODUCT VISUAL");
    expect(stylishSvg).toContain("Everyday G-Shock");
  });

  it("uses the original product photo by default without requesting a generative image edit", async () => {
    const visual = await renderProductPostCard({ brand, product, mode: "standard" });

    expect(visual.sourceMode).toBe("product");
    expect(imageProvider.createOpenAiProductVisual).not.toHaveBeenCalled();
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("product-original-"), expect.any(Uint8Array), "image/png");
  });

  it("prepares an AI-enhanced flyer as one strict 1080 by 1350 Instagram image", async () => {
    const sample = await sharp({ create: { width: 1024, height: 1536, channels: 4, background: "#ffffff" } }).png().toBuffer();
    const prepared = await prepareEnhancedFlyerForInstagram(sample);
    const metadata = await sharp(prepared).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);
  });

  it("keeps visual information from both ends of a tall AI-enhanced source", async () => {
    const source = await sharp({ create: { width: 120, height: 180, channels: 3, background: "#0000ff" } })
      .composite([{ input: await sharp({ create: { width: 120, height: 90, channels: 3, background: "#ff0000" } }).png().toBuffer(), top: 90, left: 0 }])
      .png()
      .toBuffer();
    const prepared = await prepareEnhancedFlyerForInstagram(source);
    const pixels = await sharp(prepared).raw().toBuffer({ resolveWithObject: true });
    const channel = pixels.info.channels;
    const at = (x: number, y: number, colorChannel: number) => pixels.data[(y * pixels.info.width + x) * channel + colorChannel];
    expect(at(540, 40, 2)).toBeGreaterThan(170);
    expect(at(540, 1310, 0)).toBeGreaterThan(170);
  });

  it("stores an AI-enhanced product visual only after the provider returns a usable image", async () => {
    const sample = await sharp({ create: { width: 1024, height: 1536, channels: 4, background: "#ffffff" } }).png().toBuffer();
    imageProvider.createOpenAiProductVisual.mockResolvedValue(sample);

    const visual = await renderProductPostCard({ brand, product, mode: "stylish" });

    expect(visual.sourceMode).toBe("ai_product");
    expect(imageProvider.createOpenAiProductVisual).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.stringContaining("optional AI-enhanced flyer") }));
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("product-full-flyer-"), expect.any(Uint8Array), "image/png");
  });
});
