import { describe, expect, it } from "vitest";
import { VIRA_QUERY_DEFAULTS } from "../client/src/lib/queryDefaults";

describe("ViraSquare query delivery defaults", () => {
  it("keeps recent workspace data available while preserving reconnect recovery", () => {
    expect(VIRA_QUERY_DEFAULTS.queries.staleTime).toBe(30_000);
    expect(VIRA_QUERY_DEFAULTS.queries.gcTime).toBe(300_000);
    expect(VIRA_QUERY_DEFAULTS.queries.refetchOnWindowFocus).toBe(false);
    expect(VIRA_QUERY_DEFAULTS.queries.refetchOnReconnect).toBe(true);
    expect(VIRA_QUERY_DEFAULTS.queries.retry).toBe(1);
  });
});
