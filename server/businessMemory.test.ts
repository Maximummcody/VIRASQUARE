import { describe, expect, it } from "vitest";
import { buildOwnerLearningMemory, feedbackLearningInstruction } from "./businessMemory";

describe("Group 3 owner-confirmed business memory", () => {
  it("uses only recognised owner-confirmed outcomes and never creates a result claim", () => {
    const memory = buildOwnerLearningMemory([
      { id: 1, title: "Everyday watch styling", objective: "Feature a product", format: "promo", outcome: "orders", postedAt: new Date("2026-08-26T12:00:00Z"), note: null },
      { id: 2, title: "Unconfirmed post", objective: "Education", format: "carousel", outcome: "not_set", postedAt: new Date("2026-08-25T12:00:00Z"), note: null },
    ]);

    expect(memory.signals).toEqual([{ title: "Everyday watch styling", objective: "Feature a product", format: "promo", outcome: "orders" }]);
    expect(memory.summary).toContain("You said");
    expect(memory.summary).toContain("gentle preference");
    expect(memory.summary).toContain("not a guaranteed result");
  });

  it("keeps future generation guidance explicit that feedback is not analytics", () => {
    const instruction = feedbackLearningInstruction({ signals: [{ title: "Clear delivery answer", objective: "Build trust", format: "caption", outcome: "conversations" }], summary: null });
    expect(instruction).toContain("owner's own observations");
    expect(instruction).toContain("Never repeat them as a claim");
  });
});
