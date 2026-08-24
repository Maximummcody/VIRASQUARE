import { describe, expect, it } from "vitest";
import { isTransientDatabaseError } from "./db";

describe("ViraSquare generated-content persistence recovery", () => {
  it("retries only identifiable transient database failures", () => {
    expect(isTransientDatabaseError({ code: "ECONNRESET" })).toBe(true);
    expect(isTransientDatabaseError({ code: "ER_LOCK_DEADLOCK" })).toBe(true);
    expect(isTransientDatabaseError(new Error("socket hang up"))).toBe(true);
    expect(isTransientDatabaseError({ code: "ER_DATA_TOO_LONG", message: "Data too long" })).toBe(false);
    expect(isTransientDatabaseError(new Error("Unknown column"))).toBe(false);
  });
});
