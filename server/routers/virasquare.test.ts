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
}));
const ai = vi.hoisted(() => ({ generateDailyDraft: vi.fn(), generateIdeas: vi.fn(), generateWeeklyPlan: vi.fn() }));

vi.mock("../db", () => database);
vi.mock("../contentAi", () => ai);

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
    expect(database.upsertBusinessProfile).toHaveBeenCalledWith(expect.objectContaining({ userId: 72, isOnboarded: true }));
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
});
