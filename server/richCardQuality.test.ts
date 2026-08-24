import { describe, expect, it } from "vitest";
import { assertRichCardFits, assertRichCardShape } from "./richCardQuality";

const base = { cardType: "guide" as const, eyebrow: "PRACTICAL STEP", heading: "Give customers a complete, useful point", body: "Start with the ordinary action people can repeat today. Explain why it helps, then add two short details that make the advice easy to use in real life.", footer: "Save this practical guide", templateFamily: "editorial" as const };

describe("rich card quality guards", () => {
  it("rejects an overlong body before the renderer can clip it", () => {
    expect(() => assertRichCardFits({ ...base, body: "Useful detail ".repeat(90) }, 1)).toThrow("split the practical detail into another card");
  });

  it("rejects a sparse non-cover card before it can create an underfilled visual", () => {
    expect(() => assertRichCardShape({ ...base, body: "Do this now." }, 1)).toThrow("too thin");
  });

  it("accepts a complete rich card with an explanation and supporting detail", () => {
    expect(() => { assertRichCardShape(base, 1); assertRichCardFits(base, 1); }).not.toThrow();
  });
});
