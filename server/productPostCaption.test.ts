import { describe, expect, it } from "vitest";
import { buildRelevantProductHashtagSuggestions, composeInstagramCaption, normalizeProductPostHashtags } from "./productPostCaption";

describe("product-post caption review safeguards", () => {
  it("keeps optional hashtags removable, normalized, and capped at five", () => {
    expect(normalizeProductPostHashtags(["#ViraSquare", "#MirrorBag"])).toEqual(["#ViraSquare", "#MirrorBag"]);
    expect(() => normalizeProductPostHashtags(["#one", "#two", "#three", "#four", "#five", "#six"])).toThrow("no more than 5");
    expect(() => normalizeProductPostHashtags(["#MirrorBag", "#mirrorbag"])).toThrow("only once");
    expect(() => normalizeProductPostHashtags(["#contains space"])).toThrow("must start with #");
  });

  it("derives suggestions only from saved product and business context", () => {
    expect(buildRelevantProductHashtagSuggestions({ businessName: "Ade's Closet", productName: "Mirror handbag", productCategory: "fashion", businessType: "Fashion seller", customerMarket: "Nigeria" }))
      .toEqual(["#AdesCloset", "#Mirrorhandbag", "#fashion", "#Fashionseller", "#Nigeria"]);
  });

  it("composes the exact saved caption and selected optional tags without hidden text changes", () => {
    expect(composeInstagramCaption("A real caption.\n\nSaved price.", ["#MirrorBag", "#AdesCloset"]))
      .toBe("A real caption.\n\nSaved price.\n\n#MirrorBag #AdesCloset");
  });
});
