import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const database = vi.hoisted(() => ({
  setContentCompletion: vi.fn(),
  upsertBusinessProfile: vi.fn(),
  removePlannedContentFromDate: vi.fn(),
  getBusinessProfileByUserId: vi.fn(),
  replaceContentForDate: vi.fn(),
  getContentItemById: vi.fn(),
  getRecentContentItems: vi.fn(),
  listOwnerConfirmedFeedback: vi.fn(),
  createContentItem: vi.fn(),
  createProduct: vi.fn(),
  addProductMedia: vi.fn(),
  getProductById: vi.fn(),
  getProductWithMedia: vi.fn(),
  listArchivedProductsByUserId: vi.fn(),
  archiveProduct: vi.fn(),
  restoreArchivedProduct: vi.fn(),
  permanentlyDeleteArchivedProductsByUserId: vi.fn(),
  getVisualDeliverableById: vi.fn(),
  getProductSellingPackage: vi.fn(),
  upsertProductSellingPackage: vi.fn(),
  updateProductInviteStatus: vi.fn(),
  getContentItemForDate: vi.fn(),
  updateContentLifecycle: vi.fn(),
  recordContentActivity: vi.fn(),
  attachProductToContent: vi.fn(),
}));
const ai = vi.hoisted(() => ({ generateDailyDraft: vi.fn(), generateIdeas: vi.fn(), generateWeeklyPlan: vi.fn() }));
const storage = vi.hoisted(() => ({ storagePut: vi.fn() }));
const sellingPackage = vi.hoisted(() => ({ generateProductSellingPackage: vi.fn() }));

vi.mock("../db", () => database);
vi.mock("../contentAi", () => ai);
vi.mock("../storage", () => storage);
vi.mock("../productSellingPackage", () => sellingPackage);

import { viraSquareRouter } from "./virasquare";

function context(userId: number | null): TrpcContext {
  return {
    user: userId === null ? null : { id: userId, openId: `user-${userId}`, name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("ViraSquare protected procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.listOwnerConfirmedFeedback.mockResolvedValue([]);
  });

  it("archives only an available owner product and returns its recovery deadline", async () => {
    const active = { id: 19, userId: 72, name: "Classic watch", archiveStatus: "active" };
    const archived = { ...active, archiveStatus: "archived", archiveExpiresAt: new Date("2026-09-25T12:00:00Z") };
    database.getProductById.mockResolvedValue(active);
    database.archiveProduct.mockResolvedValue(archived);

    const result = await viraSquareRouter.createCaller(context(72)).archiveProduct({ productId: 19 });

    expect(database.archiveProduct).toHaveBeenCalledWith(72, 19);
    expect(result.archived).toMatchObject({ id: 19, archiveStatus: "archived" });
  });

  it("lists and restores only the caller’s archived products", async () => {
    const archived = { id: 19, userId: 72, name: "Classic watch", archiveStatus: "archived" };
    const restored = { ...archived, archiveStatus: "active", archiveExpiresAt: null };
    database.listArchivedProductsByUserId.mockResolvedValue([archived]);
    database.restoreArchivedProduct.mockResolvedValue(restored);

    const listed = await viraSquareRouter.createCaller(context(72)).archivedProducts();
    const result = await viraSquareRouter.createCaller(context(72)).restoreArchivedProduct({ productId: 19 });

    expect(database.listArchivedProductsByUserId).toHaveBeenCalledWith(72);
    expect(database.restoreArchivedProduct).toHaveBeenCalledWith(72, 19);
    expect(listed).toEqual([archived]);
    expect(result).toMatchObject({ id: 19, archiveStatus: "active" });
  });

  it("empties only the caller’s archived products and reports the permanent removal count", async () => {
    database.permanentlyDeleteArchivedProductsByUserId.mockResolvedValue(2);

    await expect(viraSquareRouter.createCaller(context(72)).emptyArchivedProducts()).resolves.toEqual({ deletedCount: 2 });
    expect(database.permanentlyDeleteArchivedProductsByUserId).toHaveBeenCalledWith(72);
  });

  it("does not attach an archived product to newly selected content", async () => {
    database.getBusinessProfileByUserId.mockResolvedValue({ id: 7, userId: 72, businessName: "Test Store", businessType: "Accessories", targetAudience: "Nigerian accessory buyers", contentPillars: JSON.stringify(["Sell", "Trust"]), postingGoal: "Create useful posts", weeklyPostGoal: 4, customerMarket: "Nigeria", brandVoice: "Warm", defaultCta: "Send a message", isOnboarded: true });
    database.getProductById.mockResolvedValue(undefined);

    await expect(viraSquareRouter.createCaller(context(72)).saveIdea({ date: "2026-08-26", title: "Show the watch", objective: "Feature a product", format: "promo", brief: "Use the saved facts for a product-led post.", productId: 19 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(database.replaceContentForDate).not.toHaveBeenCalled();
  });

  it("blocks a new flyer regeneration when its saved product has been archived", async () => {
    database.getVisualDeliverableById.mockResolvedValue({ id: 501, userId: 72, type: "single_post", productId: 19, generationMode: "standard", slides: [{ slideNumber: 1, heading: "Classic watch", body: "", eyebrow: "PRODUCT FLYER", footer: "" }] });
    database.getBusinessProfileByUserId.mockResolvedValue({ id: 7, businessName: "Test Store", businessType: "Accessories", customerMarket: "Nigeria", brandVoice: "Warm", defaultCta: "Send a message" });
    database.getProductWithMedia.mockResolvedValue(undefined);

    await expect(viraSquareRouter.createCaller(context(72)).regenerateVisualSlide({ deliverableId: 501, slideNumber: 1 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("keeps an existing selling package readable without needing an active product", async () => {
    const savedPackage = { id: 6, userId: 72, deliverableId: 501, caption: "Existing saved caption" };
    database.getProductSellingPackage.mockResolvedValue(savedPackage);
    database.getProductById.mockClear();

    const result = await viraSquareRouter.createCaller(context(72)).productSellingPackage({ deliverableId: 501 });

    expect(result).toEqual(savedPackage);
    expect(database.getProductById).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated content-completion requests", async () => {
    await expect(viraSquareRouter.createCaller(context(null)).setCompletion({ itemId: 44, completed: true })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("passes the authenticated owner ID to the completion update", async () => {
    database.setContentCompletion.mockResolvedValue({ id: 44, userId: 72, profileId: 7, plannedFor: "2026-08-11", title: "A useful content idea", objective: "Engagement", format: "caption", brief: "Share an audience-relevant insight.", caption: null, hashtags: null, carouselSlides: null, status: "completed", completedAt: new Date(), createdAt: new Date(), updatedAt: new Date() });
    const result = await viraSquareRouter.createCaller(context(72)).setCompletion({ itemId: 44, completed: true });
    expect(database.setContentCompletion).toHaveBeenCalledWith(72, 44, true);
    expect(result.status).toBe("completed");
  });

  it("persists a new profile against the authenticated owner ID", async () => {
    database.upsertBusinessProfile.mockResolvedValue({ id: 7, userId: 72, businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: JSON.stringify(["Educate", "Build trust"]), postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind", isOnboarded: true, createdAt: new Date(), updatedAt: new Date() });
    await viraSquareRouter.createCaller(context(72)).saveProfile({ businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: ["Educate", "Build trust"], postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind" });
    expect(database.upsertBusinessProfile).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, businessCategory: "other", isOnboarded: true }));
  });

  it("clears future planned content and regenerates today after a profile refresh", async () => {
    database.upsertBusinessProfile.mockResolvedValue({ id: 7, userId: 72, businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: JSON.stringify(["Educate", "Build trust"]), postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind", isOnboarded: true, createdAt: new Date(), updatedAt: new Date() });
    database.getRecentContentItems.mockResolvedValue([]);
    ai.generateDailyDraft.mockResolvedValue({ title: "A refreshed daily post", objective: "Engagement", format: "caption", brief: "A new audience-aware direction.", caption: "A fresh caption", hashtags: ["#fresh"], carouselSlides: [] });
    database.createContentItem.mockResolvedValue({ id: 55, userId: 72, profileId: 7, plannedFor: "2026-08-11", title: "A refreshed daily post", objective: "Engagement", format: "caption", brief: "A new audience-aware direction.", caption: "A fresh caption", hashtags: JSON.stringify(["#fresh"]), carouselSlides: JSON.stringify([]), status: "planned", completedAt: null, createdAt: new Date(), updatedAt: new Date() });
    await viraSquareRouter.createCaller(context(72)).saveProfile({ businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: ["Educate", "Build trust"], postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind", refreshFrom: "2026-08-11" });
    expect(database.removePlannedContentFromDate).toHaveBeenCalledWith(72, "2026-08-11");
    expect(ai.generateDailyDraft).toHaveBeenCalledWith(expect.objectContaining({ businessName: "Clarity Studio" }), "2026-08-11", undefined, [], undefined, []);
    expect(database.createContentItem).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, plannedFor: "2026-08-11", title: "A refreshed daily post" }));
  });

  it("stores a verified real product and its original source image for the authenticated owner", async () => {
    storage.storagePut.mockResolvedValue({ key: "72/products/classic-watch.png", url: "/manus-storage/72/products/classic-watch.png" });
    database.createProduct.mockResolvedValue({ id: 19, userId: 72, name: "Classic watch", price: "50000", currency: "NGN", details: "Stainless steel case", imageKey: "72/products/classic-watch.png", imageUrl: "/manus-storage/72/products/classic-watch.png" });
    database.addProductMedia.mockResolvedValue({ id: 4, productId: 19, role: "primary" });

    const result = await viraSquareRouter.createCaller(context(72)).createProduct({
      name: "Classic watch",
      price: "50000",
      details: "Stainless steel case",
      image: { fileName: "classic-watch.png", dataUrl: "data:image/png;base64,iVBORw0KGgo=" },
    });

    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("72/products/"), expect.any(Buffer), "image/png");
    expect(database.createProduct).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, name: "Classic watch", price: "50000", imageKey: "72/products/classic-watch.png" }));
    expect(database.addProductMedia).toHaveBeenCalledWith(expect.objectContaining({ productId: 19, role: "primary", storageKey: "72/products/classic-watch.png" }));
    expect(result.id).toBe(19);
  });

  it("rejects non-image uploads before saving a product", async () => {
    storage.storagePut.mockClear();
    await expect(viraSquareRouter.createCaller(context(72)).createProduct({ name: "Classic watch", image: { fileName: "notes.txt", dataUrl: "data:text/plain;base64,SGVsbG8=" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(storage.storagePut).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything());
  });

  it("shows a preparation reminder only for tomorrow's product-dependent content", async () => {
    database.getContentItemForDate.mockResolvedValue({ id: 80, userId: 72, profileId: 7, plannedFor: "2026-08-12", title: "Show your signature watch", objective: "Sell", format: "promo", brief: "Feature a real product.", caption: null, hashtags: null, carouselSlides: null, requiresProduct: true, preparationNote: "Add the watch image and verified price today.", status: "planned", lifecycleStatus: "planned", createdAt: new Date(), updatedAt: new Date() });

    const reminder = await viraSquareRouter.createCaller(context(72)).preparationReminder({ date: "2026-08-11" });

    expect(database.getContentItemForDate).toHaveBeenCalledWith(72, "2026-08-12");
    expect(reminder?.note).toContain("verified price");
    expect(reminder?.item.requiresProduct).toBe(true);
  });

  it("records a user-confirmed posted outcome without assuming external social results", async () => {
    database.updateContentLifecycle.mockResolvedValue({ id: 81, userId: 72, profileId: 7, plannedFor: "2026-08-11", title: "A customer question to answer", objective: "Build trust", format: "carousel", brief: "Answer a useful question.", caption: "A helpful answer", hashtags: null, carouselSlides: null, requiresProduct: false, preparationNote: null, status: "completed", lifecycleStatus: "posted", feedbackOutcome: "conversations", createdAt: new Date(), updatedAt: new Date() });

    const result = await viraSquareRouter.createCaller(context(72)).setLifecycle({ itemId: 81, lifecycleStatus: "posted", outcome: "conversations" });

    expect(database.updateContentLifecycle).toHaveBeenCalledWith(72, 81, "posted", { outcome: "conversations", note: undefined });
    expect(database.recordContentActivity).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, contentItemId: 81, eventType: "posted" }));
    expect(result.lifecycleStatus).toBe("posted");
  });

  it("records an explicit save-to-drafts action without marking the content as posted", async () => {
    database.updateContentLifecycle.mockResolvedValue({ id: 82, userId: 72, profileId: 7, plannedFor: "2026-08-11", title: "A product post", objective: "Feature a product", format: "promo", brief: "Feature a real product.", caption: "Ready caption", hashtags: null, carouselSlides: null, requiresProduct: true, preparationNote: null, status: "planned", lifecycleStatus: "reviewed", feedbackOutcome: "saved_for_later", createdAt: new Date(), updatedAt: new Date() });

    const result = await viraSquareRouter.createCaller(context(72)).setLifecycle({ itemId: 82, lifecycleStatus: "reviewed", outcome: "saved_for_later" });

    expect(database.updateContentLifecycle).toHaveBeenCalledWith(72, 82, "reviewed", { outcome: "saved_for_later", note: undefined });
    expect(database.recordContentActivity).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, contentItemId: 82, eventType: "reviewed", metadata: expect.stringContaining("saved_for_later") }));
    expect(result.lifecycleStatus).toBe("reviewed");
    expect(result.feedbackOutcome).toBe("saved_for_later");
  });

  it("passes an owner's requested goal, format, and topic into the Today-page idea generator", async () => {
    database.getBusinessProfileByUserId.mockResolvedValue({ id: 7, userId: 72, businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: JSON.stringify(["Educate", "Build trust"]), postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind", isOnboarded: true });
    database.getRecentContentItems.mockResolvedValue([]);
    ai.generateIdeas.mockResolvedValue([{ title: "A helpful carousel", objective: "Build trust", format: "carousel", brief: "Share a useful, specific approach." }]);

    const ideas = await viraSquareRouter.createCaller(context(72)).generateIdeas({ format: "carousel", objective: "Engagement", topic: "Choosing a confident brand voice" });

    expect(ai.generateIdeas).toHaveBeenCalledWith(expect.objectContaining({ businessName: "Clarity Studio" }), "carousel", [], { objective: "Engagement", topic: "Choosing a confident brand voice" });
    expect(ideas[0]?.title).toBe("A helpful carousel");
  });

  it("passes only owner-confirmed learning signals into future idea generation", async () => {
    database.getBusinessProfileByUserId.mockResolvedValue({ id: 7, userId: 72, businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: JSON.stringify(["Educate", "Build trust"]), postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind", isOnboarded: true });
    database.getRecentContentItems.mockResolvedValue([]);
    database.listOwnerConfirmedFeedback.mockResolvedValue([
      { id: 91, title: "A clear delivery answer", objective: "Build trust", format: "caption", outcome: "conversations", postedAt: new Date(), note: null },
      { id: 92, title: "No confirmed outcome", objective: "Engagement", format: "carousel", outcome: "not_set", postedAt: new Date(), note: null },
    ]);
    ai.generateIdeas.mockResolvedValue([]);

    await viraSquareRouter.createCaller(context(72)).generateIdeas({ format: "caption", objective: "Build trust", topic: "Delivery confidence" });

    expect(ai.generateIdeas).toHaveBeenCalledWith(expect.objectContaining({ ownerConfirmedLearning: [{ title: "A clear delivery answer", objective: "Build trust", format: "caption", outcome: "conversations" }] }), "caption", [], expect.any(Object));
  });

  it("requires a selected product for product-post format even when a different objective is supplied", async () => {
    database.getBusinessProfileByUserId.mockResolvedValue({ id: 7, userId: 72, businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: JSON.stringify(["Educate", "Build trust"]), postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind", isOnboarded: true });

    await expect(viraSquareRouter.createCaller(context(72)).generateIdeas({ format: "promo", objective: "Education" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(database.getProductById).not.toHaveBeenCalled();
  });

  it("attaches only the owner’s saved product to an eligible planned selling post", async () => {
    const item = { id: 91, userId: 72, profileId: 7, plannedFor: "2026-08-18", title: "Show one real product", objective: "Feature a product", format: "promo", brief: "A product-selling opportunity.", caption: null, hashtags: null, carouselSlides: null, requiresProduct: true, preparationNote: "Choose one saved product.", status: "planned", lifecycleStatus: "planned", createdAt: new Date(), updatedAt: new Date() };
    const product = { id: 19, userId: 72, name: "Classic watch", price: "50000", currency: "NGN", details: "Stainless steel case" };
    const saved = { ...item, productId: 19, preparationNote: "Use the saved product image and the facts you supplied for this product." };
    database.getContentItemById.mockResolvedValue(item);
    database.getProductById.mockResolvedValue(product);
    database.attachProductToContent.mockResolvedValue(saved);

    const result = await viraSquareRouter.createCaller(context(72)).attachProductToContent({ itemId: 91, productId: 19 });

    expect(database.getContentItemById).toHaveBeenCalledWith(72, 91);
    expect(database.getProductById).toHaveBeenCalledWith(72, 19);
    expect(database.attachProductToContent).toHaveBeenCalledWith(72, 91, 19);
    expect(result.productId).toBe(19);
  });

  it("refuses product attachment for a post that is not a product-selling opportunity", async () => {
    database.getContentItemById.mockResolvedValue({ id: 92, userId: 72, requiresProduct: false });
    database.getProductById.mockResolvedValue({ id: 19, userId: 72 });

    await expect(viraSquareRouter.createCaller(context(72)).attachProductToContent({ itemId: 92, productId: 19 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(database.attachProductToContent).not.toHaveBeenCalledWith(72, 92, 19);
  });

  it("creates one selling package only for the owner's ready single-product flyer", async () => {
    const profile = { id: 7, userId: 72, businessName: "Ades Closet", businessType: "Fashion seller", targetAudience: "Women", customerMarket: "Nigeria", contentPillars: JSON.stringify(["Sell", "Trust"]), postingGoal: "Sell", weeklyPostGoal: 4, brandVoice: "Warm and clear", defaultCta: "Send us a message to order.", instagramHandle: "adescloset", isOnboarded: true };
    const deliverable = { id: 501, userId: 72, contentItemId: 84, productId: 19, type: "single_post", title: "Mirror handbag", aspectRatio: "4:5", generationMode: "standard", status: "ready", slides: [] };
    const product = { id: 19, userId: 72, name: "Mirror handbag", price: "35000", currency: "NGN", details: "Reflective finish", productCategory: "fashion", bestFor: "Women who want a statement accessory", choiceReasons: "Reflective finish", buyerNote: null, categoryDetails: null };
    const generated = { caption: "Meet the Mirror handbag. Price: ₦35,000. Send us a message to order.", buyerReply: "Hello, the Mirror handbag is ₦35,000. Send us a message to order.", nextAngleTitle: "Show the reflective finish", nextAngleDescription: "Focus on the reflective finish and why it gives the bag a statement look." };
    database.getVisualDeliverableById.mockResolvedValue(deliverable);
    database.getProductSellingPackage.mockResolvedValue(undefined);
    database.getBusinessProfileByUserId.mockResolvedValue(profile);
    database.getProductById.mockResolvedValue(product);
    sellingPackage.generateProductSellingPackage.mockResolvedValue(generated);
    database.upsertProductSellingPackage.mockResolvedValue({ id: 2, userId: 72, deliverableId: 501, productId: 19, ...generated });

    const result = await viraSquareRouter.createCaller(context(72)).generateProductSellingPackage({ deliverableId: 501 });

    expect(database.getVisualDeliverableById).toHaveBeenCalledWith(72, 501);
    expect(sellingPackage.generateProductSellingPackage).toHaveBeenCalledWith(expect.objectContaining({ product: expect.objectContaining({ name: "Mirror handbag", price: "35000" }) }));
    expect(database.upsertProductSellingPackage).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, deliverableId: 501, productId: 19, ...generated }));
    expect(result.caption).toContain("₦35,000");
  });

  it("does not generate a selling package from a non-ready or non-product visual", async () => {
    sellingPackage.generateProductSellingPackage.mockClear();
    database.getVisualDeliverableById.mockResolvedValue({ id: 502, userId: 72, productId: null, type: "carousel", status: "ready", slides: [] });

    await expect(viraSquareRouter.createCaller(context(72)).generateProductSellingPackage({ deliverableId: 502 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(sellingPackage.generateProductSellingPackage).not.toHaveBeenCalled();
  });

  it("creates a separate non-calendar educational carousel linked to the owner’s product post", async () => {
    const profile = { id: 7, userId: 72, businessName: "Ades Closet", businessType: "Fashion seller", targetAudience: "Women", customerMarket: "Nigeria", contentPillars: JSON.stringify(["Sell", "Trust"]), postingGoal: "Sell", weeklyPostGoal: 4, brandVoice: "Warm and clear", isOnboarded: true };
    const source = { id: 84, userId: 72, profileId: 7, plannedFor: "2026-08-26", productId: 19, title: "Mirror handbag", objective: "Feature a product", format: "promo", brief: "Feature the saved handbag." };
    const product = { id: 19, userId: 72, name: "Mirror handbag", price: "35000", currency: "NGN", details: "Reflective finish" };
    const saved = { id: 85, userId: 72, profileId: 7, plannedFor: "2026-08-26", productId: 19, sourceContentItemId: 84, entryType: "product_education", title: "How to choose an everyday handbag", objective: "Education", format: "carousel", brief: "Help customers know what to consider.", caption: null, hashtags: null, carouselSlides: null, requiresProduct: false, preparationNote: null, status: "planned", lifecycleStatus: "planned" };
    database.getContentItemById.mockResolvedValue(source);
    database.getBusinessProfileByUserId.mockResolvedValue(profile);
    database.getProductById.mockResolvedValue(product);
    database.createContentItem.mockResolvedValue(saved);

    const result = await viraSquareRouter.createCaller(context(72)).saveProductEducationIdea({ sourceItemId: 84, title: "How to choose an everyday handbag", brief: "Help customers know what to consider." });

    expect(database.createContentItem).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, sourceContentItemId: 84, entryType: "product_education", productId: 19, format: "carousel", requiresProduct: false }));
    expect(result.entryType).toBe("product_education");
  });

  it("refuses a product-education carousel when the selected source has no saved product", async () => {
    database.getContentItemById.mockResolvedValue({ id: 86, userId: 72, productId: null });

    await expect(viraSquareRouter.createCaller(context(72)).saveProductEducationIdea({ sourceItemId: 86, title: "A product guide", brief: "A separate educational angle." })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("records optional owner feedback only after a post is marked as posted", async () => {
    database.getContentItemById.mockResolvedValue({ id: 88, userId: 72, profileId: 7, plannedFor: "2026-08-11", title: "An honest product answer", objective: "Build trust", format: "caption", brief: "Answer a question.", caption: "A helpful answer", hashtags: null, carouselSlides: null, requiresProduct: false, preparationNote: null, status: "completed", lifecycleStatus: "posted", feedbackOutcome: "not_set", createdAt: new Date(), updatedAt: new Date() });
    database.updateContentLifecycle.mockResolvedValue({ id: 88, userId: 72, profileId: 7, plannedFor: "2026-08-11", title: "An honest product answer", objective: "Build trust", format: "caption", brief: "Answer a question.", caption: "A helpful answer", hashtags: null, carouselSlides: null, requiresProduct: false, preparationNote: null, status: "completed", lifecycleStatus: "posted", feedbackOutcome: "profile_visits", createdAt: new Date(), updatedAt: new Date() });

    const result = await viraSquareRouter.createCaller(context(72)).recordPostFeedback({ itemId: 88, outcome: "profile_visits" });

    expect(database.updateContentLifecycle).toHaveBeenCalledWith(72, 88, "posted", { outcome: "profile_visits", note: undefined });
    expect(database.recordContentActivity).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, contentItemId: 88, eventType: "feedback", metadata: expect.stringContaining("ownerConfirmed") }));
    expect(result.feedbackOutcome).toBe("profile_visits");
  });

  it("refuses optional feedback before the owner has marked the post as posted", async () => {
    database.getContentItemById.mockResolvedValue({ id: 89, userId: 72, profileId: 7, plannedFor: "2026-08-11", title: "A draft", objective: "Build trust", format: "caption", brief: "A draft.", caption: "Draft", hashtags: null, carouselSlides: null, requiresProduct: false, preparationNote: null, status: "planned", lifecycleStatus: "reviewed", feedbackOutcome: "not_set", createdAt: new Date(), updatedAt: new Date() });

    await expect(viraSquareRouter.createCaller(context(72)).recordPostFeedback({ itemId: 89, outcome: "nothing_yet" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(database.updateContentLifecycle).not.toHaveBeenCalled();
  });
});
