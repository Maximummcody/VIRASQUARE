import { describe, expect, it } from "vitest";
import { getPullRefreshState } from "../client/src/hooks/usePullToRefresh";

describe("getPullRefreshState", () => {
  it("keeps the pull prompt below the refresh threshold", () => {
    expect(getPullRefreshState(71, false)).toEqual({ isReady: false, label: "Pull to refresh" });
  });

  it("asks for release once the pull reaches the refresh threshold", () => {
    expect(getPullRefreshState(72, false)).toEqual({ isReady: true, label: "Release to refresh" });
  });

  it("prioritizes the refreshing label while a refresh is running", () => {
    expect(getPullRefreshState(96, true)).toEqual({ isReady: true, label: "Refreshing" });
  });
});
