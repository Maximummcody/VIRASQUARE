import { describe, expect, it } from "vitest";
import { getDailyBriefState, getWeeklyMomentum } from "../client/src/lib/dailyBrief";

describe("Daily Brief", () => {
  it("chooses a truthful action without inferring external results", () => {
    expect(getDailyBriefState({ hasActivePlan: false, current: null }).action).toBe("prepare_week");
    expect(getDailyBriefState({ hasActivePlan: true, current: { requiresProduct: true, caption: null, lifecycleStatus: "planned" } }).action).toBe("prepare_product");
    expect(getDailyBriefState({ hasActivePlan: true, current: { requiresProduct: false, caption: "Ready caption", lifecycleStatus: "reviewed" } }).action).toBe("open_ready");
    expect(getDailyBriefState({ hasActivePlan: true, current: { lifecycleStatus: "posted" } }).title).toBe("Today is done");
    expect(getDailyBriefState({ hasActivePlan: true, current: null }).title).toBe("Today is a rest day");
  });

  it("reports weekly momentum from completed posts and the saved weekly goal", () => {
    expect(getWeeklyMomentum({ hasActivePlan: true, completedCount: 2, weeklyGoal: 4 })).toMatchObject({ title: "2 of 4 planned posts completed", percentage: 50 });
    expect(getWeeklyMomentum({ hasActivePlan: true, completedCount: 5, weeklyGoal: 4 })).toMatchObject({ title: "This week's rhythm is complete", percentage: 100 });
    expect(getWeeklyMomentum({ hasActivePlan: false, completedCount: 0, weeklyGoal: 3 }).title).toBe("Set your weekly rhythm");
  });
});
