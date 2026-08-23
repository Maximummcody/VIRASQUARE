import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";

const database = vi.hoisted(() => ({
  setContentCompletion: vi.fn(),
  upsertBusinessProfile: vi.fn(),
  removePlannedContentFromDate: vi.fn(),
  getBusinessProfileByUserId: vi.fn(),
  replaceContentForDate: vi.fn(),
  getRecentContentItems: vi.fn(),
  createContentItem: vi.fn(),
  createProduct: vi.fn(),
  addProductMedia: vi.fn(),
  getContentItemForDate: vi.fn(),
  updateContentLifecycle: vi.fn(),
  recordContentActivity: vi.fn(),
}));
const ai = vi.hoisted(() => ({ generateDailyDraft: vi.fn(), generateIdeas: vi.fn(), generateWeeklyPlan: vi.fn() }));
const storage = vi.hoisted(() => ({ storagePut: vi.fn() }));

vi.mock("../db", () => database);
vi.mock("../contentAi", () => ai);
vi.mock("../storage", () => storage);

import { viraSquareRouter } from "./virasquare";

function context(userId: number | null): TrpcContext {
  return {
    user: userId === null ? null : { id: userId, openId: `user-${userId}`, name: "Test User", email: "test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("ViraSquare protected procedures", () => {
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
    expect(ai.generateDailyDraft).toHaveBeenCalledWith(expect.objectContaining({ businessName: "Clarity Studio" }), "2026-08-11", undefined, []);
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

  it("passes an owner's requested goal, format, and topic into the new-post idea generator", async () => {
    database.getBusinessProfileByUserId.mockResolvedValue({ id: 7, userId: 72, businessName: "Clarity Studio", businessType: "Brand strategist", targetAudience: "Small business founders", contentPillars: JSON.stringify(["Educate", "Build trust"]), postingGoal: "Build authority", weeklyPostGoal: 4, brandVoice: "Clear and kind", isOnboarded: true });
    database.getRecentContentItems.mockResolvedValue([]);
    ai.generateIdeas.mockResolvedValue([{ title: "A helpful carousel", objective: "Build trust", format: "carousel", brief: "Share a useful, specific approach." }]);

    const ideas = await viraSquareRouter.createCaller(context(72)).generateIdeas({ format: "carousel", objective: "Build trust", topic: "Choosing a confident brand voice" });

    expect(ai.generateIdeas).toHaveBeenCalledWith(expect.objectContaining({ businessName: "Clarity Studio" }), "carousel", [], { objective: "Build trust", topic: "Choosing a confident brand voice" });
    expect(ideas[0]?.title).toBe("A helpful carousel");
  });
});
