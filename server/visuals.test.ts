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
    expect(comparison).toContain("TRY THIS");
    expect(comparison).toContain("THINK ABOUT");
    expect(comparison).toContain("premium or");
    expect(comparison).toContain("distant.");
    expect(editorial).not.toEqual(comparison);
    expect(comparison).not.toContain('width="12"');
  });

  it("uses one post-level visual system across card roles when the carousel family is selected once", () => {
    const body = "Start with one practical choice, explain why it helps, and give enough detail for the customer to use the idea today.";
    const coverSystem = buildRichCardSvg(brand, { cardType: "guide", eyebrow: "STYLE GUIDE", heading: "Choose a clear visual system", body, footer: "Save this guide", templateFamily: "editorial", graphicCue: "style" }, 1, 4, "editorial");
    const comparisonRoleInSameSystem = buildRichCardSvg(brand, { cardType: "comparison", eyebrow: "STYLE GUIDE", heading: "Keep the set visually connected", body, footer: "Save this guide", templateFamily: "comparison", graphicCue: "choice" }, 3, 4, "editorial");

    expect(coverSystem).toContain('width="840" height="470"');
    expect(comparisonRoleInSameSystem).toContain('width="840" height="470"');
    expect(comparisonRoleInSameSystem).not.toContain("TRY THIS");
  });

  it("renders the approved visual systems with distinct professional geometry while keeping each system coherent", () => {
    const draft = { cardType: "guide" as const, eyebrow: "PRACTICAL STYLE", heading: "Choose one useful starting point", body: "Start with the small action that works for your ordinary routine, then keep the next decision simple and practical.", footer: "Save this useful guide" };
    const editorial = buildRichCardSvg(brand, draft, 2, 5, undefined, "editorial_guide");
    const checklist = buildRichCardSvg(brand, { ...draft, cardType: "checklist" }, 2, 5, undefined, "field_checklist");
    const lookbook = buildRichCardSvg(brand, draft, 2, 5, undefined, "lookbook_notes");
    const anatomy = buildRichCardSvg(brand, draft, 2, 5, undefined, "product_anatomy");

    expect(editorial).toContain('width="840" height="470"');
    expect(checklist).toContain("FIELD CHECKLIST");
    expect(checklist).toContain("✓");
    expect(lookbook).toContain("LOOKBOOK NOTE");
    expect(anatomy).toContain("PRODUCT ANATOMY");
    expect(new Set([editorial, checklist, lookbook, anatomy]).size).toBe(4);
  });

  it("keeps a long explainer heading inside its protected title lane beside the graphic badge", () => {
    const svg = buildRichCardSvg(brand, {
      cardType: "faq",
      eyebrow: "STYLE CHECK",
      heading: "Create balance from top to bottom",
      body: "Use one clear shape, then choose details that support it.\n\n• Check the fit\n• Keep the proportions comfortable\n• Finish with one useful detail",
      footer: "Save this style check",
      templateFamily: "explainer",
      graphicCue: "fit",
    }, 1, 4, "explainer");

    expect(svg).toContain('x="160" y="300"');
    expect(svg).toContain('font-size="54"');
    expect(svg).toContain('cx="842" cy="330" r="96"');
    expect(svg).toContain("Create balance");
    expect(svg).toContain("from top to");
    expect(svg).toContain(">bottom</text>");
  });

  it("uses the optional logo and Instagram footer without changing the branded-card copy layout", () => {
    const svg = buildRichCardSvg({ ...brand, brandLogoDataUri: "data:image/png;base64,TE9HTw==", instagramHandle: "tomistime" }, {
      cardType: "guide",
      eyebrow: "STYLE NOTE",
      heading: "Choose one dependable detail before adding more",
      body: "Start with the piece you use most often, then add only the colour and texture that help the outfit feel considered for an ordinary day.",
      footer: "Save this simple styling note",
    }, 2, 4);

    expect(svg).toContain('href="data:image/png;base64,TE9HTw=="');
    expect(svg).toContain("@tomistime");
    expect(svg).toContain("Tomi&apos;s Time");
  });

  it("uses the closing signature only on a closing card", () => {
    const identity = { ...brand, instagramHandle: "tomistime", closingSignature: "With care, Tomi" };
    const guide = buildRichCardSvg(identity, {
      cardType: "guide",
      eyebrow: "STYLE NOTE",
      heading: "Keep one useful check before you make a choice",
      body: "Use the detail you can verify, then explain why it helps the customer choose with more confidence and less uncertainty today.",
      footer: "Save this practical reminder",
    }, 2, 4);
    const closing = buildRichCardSvg(identity, {
      cardType: "closing",
      eyebrow: "A FINAL NOTE",
      heading: "Choose what feels useful for your everyday life",
      body: "Keep the decision simple. Start with what fits your routine, then ask the questions that help you choose something you will enjoy using regularly.",
      footer: "Come back when you need a clear guide",
    }, 4, 4);

    expect(guide).toContain("Tomi&apos;s Time");
    expect(guide).not.toContain("With care, Tomi");
    expect(closing).toContain("With care, Tomi");
  });
});
