import { describe, expect, it } from "vitest";
import { buildRichCardSvg } from "./visuals";

describe("ViraSquare Card Engine", () => {
  const brand = { businessName: "Tomi's Time", businessType: "Watch seller", brandVoice: "Warm and clear", primaryColor: "#263327", accentColor: "#EAF2CA", defaultCta: "Send us a message to order." };

  it("renders a rich deterministic guide card without an external scene", () => {
    const svg = buildRichCardSvg(brand, { cardType: "guide", eyebrow: "STYLE NOTES", heading: "Build an outfit around one dependable piece", body: "Start with the item you reach for most. Then use colour, texture, and proportion to create two more combinations that still feel like you.", footer: "Save this for your next outfit" }, 2, 5);

    expect(svg).toContain("Build an outfit around");
    expect(svg).toContain("STYLE NOTES");
    expect(svg).toContain("2/5");
    expect(svg).not.toContain("data:image");
  });

  it("uses the checklist layout to give multiple organised actions", () => {
    const svg = buildRichCardSvg(brand, { cardType: "checklist", eyebrow: "QUICK CHECK", heading: "Before you post, make the message useful", body: "Name the problem your customer recognises. Explain one helpful idea. Finish with one clear next step.", footer: "Keep it simple and specific" }, 3, 5);

    expect(svg).toContain("QUICK CHECK");
    expect(svg).toContain("✓");
    expect(svg).toContain("KEEP IT SIMPLE");
  });

  it("retains complete practical card copy and varies the output by approved template family", () => {
    const body = "Start with the small action your customer can repeat today. Keep the routine simple, use what is already available, and explain the next decision clearly so the advice feels useful rather than premium or distant.";
    const editorial = buildRichCardSvg(brand, { cardType: "guide", eyebrow: "PRACTICAL CARE", heading: "Give customers a useful starting point", body, footer: "Save this practical guide", templateFamily: "editorial", graphicCue: "care" }, 2, 5);
    const comparison = buildRichCardSvg(brand, { cardType: "comparison", eyebrow: "PRACTICAL CARE", heading: "Give customers a useful starting point", body, footer: "Save this practical guide", templateFamily: "comparison", graphicCue: "choice" }, 2, 5);

    expect(editorial).toContain("rather than premium or distant.");
    expect(comparison).toContain("rather than premium or distant.");
    expect(editorial).not.toEqual(comparison);
    expect(comparison).toContain('width="12"');
  });
});
