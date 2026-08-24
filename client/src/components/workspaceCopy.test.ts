import { describe, expect, it } from "vitest";
import { emptyDayCopy, todayProgressCopy } from "./workspaceCopy";

describe("ViraSquare workspace feedback copy", () => {
  it("treats intentionally clear dates in an active plan as Rest days", () => {
    expect(emptyDayCopy(true)).toEqual({
      eyebrow: "REST DAY",
      title: "No post needed today.",
      detail: "Your plan left this day clear.",
    });
  });

  it("does not present a not-yet-prepared week as a missed or rest day", () => {
    expect(emptyDayCopy(false)).toEqual({
      eyebrow: "NO PLAN YET",
      title: "Plan when you are ready.",
      detail: "",
    });
  });

  it("uses only the user-confirmed posted lifecycle state for Today completion", () => {
    expect(todayProgressCopy("posted")).toEqual({ label: "Today complete · 1 of 1", detail: "You showed up today. Your post is marked as posted." });
    expect(todayProgressCopy("generated")).toEqual({ label: "Today’s progress · 0 of 1", detail: "Open today’s post, then mark it as posted when you have used it." });
  });
});
