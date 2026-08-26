import { describe, expect, it } from "vitest";
import { getDailyBriefState, getWeeklyDateState, getWeeklyMomentum, mobileWeeklyDates, shouldShowJumpToToday } from "../client/src/lib/dailyBrief";

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

  it("keeps past dates quiet, gives today one state, and shows today plus two upcoming dates on mobile", () => {
    expect(getWeeklyDateState("2026-08-25", "2026-08-26")).toBe("past");
    expect(getWeeklyDateState("2026-08-26", "2026-08-26")).toBe("today");
    expect(getWeeklyDateState("2026-08-27", "2026-08-26")).toBe("future");
    expect(mobileWeeklyDates(["2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30"], "2026-08-26")).toEqual(["2026-08-26", "2026-08-27", "2026-08-28"]);
  });

  it("shows the contextual return action only when the current date is out of view", () => {
    expect(shouldShowJumpToToday(true)).toBe(false);
    expect(shouldShowJumpToToday(false)).toBe(true);
  });
});
