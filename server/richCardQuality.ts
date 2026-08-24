export type RichCardQualityDraft = {
  cardType: "cover" | "guide" | "checklist" | "comparison" | "faq" | "product" | "closing";
  eyebrow: string;
  heading: string;
  body: string;
  footer: string;
  templateFamily?: "editorial" | "action" | "comparison" | "explainer" | "conversation";
};

type TemplateFamily = NonNullable<RichCardQualityDraft["templateFamily"]>;

function compact(value: string) { return value.replace(/\s+/g, " ").trim(); }
export function wrappedLineCount(value: string, maxChars: number) {
  let count = 0;
  for (const paragraph of value.replace(/\r/g, "").split(/\n+/).map(part => part.trim()).filter(Boolean)) {
    let row = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = row ? `${row} ${word}` : word;
      if (next.length > maxChars && row) { count += 1; row = word; } else row = next;
    }
    if (row) count += 1;
  }
  return Math.max(1, count);
}

export function resolvedTemplateFamily(card: RichCardQualityDraft): TemplateFamily {
  if (card.templateFamily) return card.templateFamily;
  if (card.cardType === "checklist") return "action";
  if (card.cardType === "comparison") return "comparison";
  if (card.cardType === "faq") return "explainer";
  if (card.cardType === "closing") return "conversation";
  return "editorial";
}

export function assertRichCardShape(card: RichCardQualityDraft, index: number) {
  const heading = compact(card.heading);
  const body = compact(card.body);
  const footer = compact(card.footer);
  if (heading.length < 12) throw new Error(`Generated card ${index + 1} is too thin: its heading needs a clear main point.`);
  if (footer.length < 5) throw new Error(`Generated card ${index + 1} is incomplete: it needs a useful footer.`);
  const minimumBody = card.cardType === "cover" || card.cardType === "closing" ? 70 : 115;
  if (body.length < minimumBody) throw new Error(`Generated card ${index + 1} is too thin: it needs a main point and useful supporting detail.`);
  if (card.cardType !== "cover") {
    const sentenceCount = body.split(/[.!?]+/).map(part => part.trim()).filter(Boolean).length;
    const organisedParts = card.body.split(/\n|•|\-|\d\./).map(part => part.trim()).filter(Boolean).length;
    if (sentenceCount < 2 && organisedParts < 3) throw new Error(`Generated card ${index + 1} is too thin: it needs an explanation and supporting detail.`);
  }
}

export function assertRichCardFits(card: RichCardQualityDraft, index: number) {
  const family = resolvedTemplateFamily(card);
  const limits: Record<TemplateFamily, { heading: number; headingChars: number; body: number; bodyChars: number; footer: number }> = {
    editorial: { heading: 4, headingChars: 24, body: 13, bodyChars: 48, footer: 2 },
    action: { heading: 3, headingChars: 24, body: 11, bodyChars: 47, footer: 2 },
    comparison: { heading: 3, headingChars: 25, body: 12, bodyChars: 45, footer: 2 },
    explainer: { heading: 3, headingChars: 24, body: 12, bodyChars: 48, footer: 2 },
    conversation: { heading: 4, headingChars: 23, body: 9, bodyChars: 52, footer: 2 },
  };
  const limit = limits[family];
  if (wrappedLineCount(card.heading, limit.headingChars) > limit.heading) throw new Error(`Generated card ${index + 1} does not fit: shorten or split the heading.`);
  if (wrappedLineCount(card.body, limit.bodyChars) > limit.body) throw new Error(`Generated card ${index + 1} does not fit: split the practical detail into another card.`);
  if (wrappedLineCount(card.footer, 58) > limit.footer) throw new Error(`Generated card ${index + 1} does not fit: shorten the footer.`);
}

export function assertRichCarouselQuality(cards: RichCardQualityDraft[]) {
  if (cards.length < 4 || cards.length > 6) throw new Error("Generated carousel needs 4 to 6 complete cards.");
  cards.forEach((card, index) => { assertRichCardShape(card, index); assertRichCardFits(card, index); });
}
