import { describe, expect, it } from "vitest";
import { calculateStreak, calculateWeeklyProgress } from "./consistency";

describe("ViraSquare consistency helpers", () => {
  it("counts only consecutive completed days ending on the reference date", () => {
    expect(calculateStreak(["2026-08-08", "2026-08-09", "2026-08-10"], "2026-08-10")).toBe(3);
    expect(calculateStreak(["2026-08-08", "2026-08-10"], "2026-08-10")).toBe(1);
  });

  it("expresses weekly completion as a capped percentage", () => {
    expect(calculateWeeklyProgress(3, 5)).toBe(60);
    expect(calculateWeeklyProgress(8, 5)).toBe(100);
    expect(calculateWeeklyProgress(2, 0)).toBe(0);
  });
});
