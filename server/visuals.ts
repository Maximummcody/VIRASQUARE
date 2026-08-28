import { storageGetSignedUrl, storagePut } from "./storage";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { assertRichCardFits, resolvedTemplateFamily } from "./richCardQuality";
import { createOpenAiProductVisual } from "./openaiImageProvider";

type Brand = { businessName: string; businessType: string; brandVoice: string; primaryColor?: string; accentColor?: string; defaultCta?: string; brandLogoKey?: string | null; brandLogoDataUri?: string; instagramHandle?: string | null; closingSignature?: string | null };
type ProductSource = { name: string; price: string | null; currency: string; details: string | null; imageKey: string; productCategory?: string | null; bestFor?: string | null; choiceReasons?: string | null; buyerNote?: string | null; categoryDetails?: string | null };
export type ProductVisualMode = "standard" | "stylish";
export type ProductFlyerComposition = "photo_feature" | "spotlight" | "editorial_split" | "detail_led" | "price_led" | "campaign";
export type ProductFlyerDirection = "clean_retail" | "price_spotlight" | "editorial_feature" | "fashion_campaign" | "beauty_story" | "gift_occasion";
type TemplateFamily = "editorial" | "action" | "comparison" | "explainer" | "conversation";
type GraphicCue = "care" | "warning" | "choice" | "fit" | "budget" | "process" | "confidence" | "quality" | "style" | "question" | "none";
export type VisualSystem = "editorial_guide" | "action_path" | "field_checklist" | "balanced_contrast" | "lookbook_notes" | "truth_check" | "question_studio" | "product_anatomy";

export type VisualSlideDraft = {
  cardType: "cover" | "guide" | "checklist" | "comparison" | "faq" | "product" | "closing";
  eyebrow: string;
  heading: string;
  body: string;
  footer: string;
  templateFamily?: TemplateFamily;
  graphicCue?: GraphicCue;
  visualSystem?: VisualSystem;
};
export type RenderedVisual = { assetKey: string; assetUrl: string; sourceMode: "product" | "ai_product" | "generated" | "template" };

function escapeXml(value: string) { return value.replace(/[<>&'"]/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character); }
function key(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "visual"; }
function short(value: string, length: number) { return value.length > length ? `${value.slice(0, Math.max(0, length - 1)).trim()}…` : value; }
function palette(brand: Brand) { return { ink: brand.primaryColor || "#263327", accent: brand.accentColor || "#EAF2CA", soft: "#F7F7F2", paper: "#FFFEFA", mist: "#DCE8D5", sage: "#75965F", body: "#506050" }; }

function wrappedLines(value: string, maxChars: number) {
  const rows: string[] = [];
  for (const paragraph of value.replace(/\r/g, "").split(/\n+/).map(part => part.trim()).filter(Boolean)) {
    let row = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = row ? `${row} ${word}` : word;
      if (next.length > maxChars && row) { rows.push(row); row = word; } else row = next;
    }
    if (row) rows.push(row);
  }
  return rows.length ? rows : [" "];
}
function textRows(lines: string[], x: number, y: number, size: number, color: string, weight = 700, lineHeight = 1.1, family = "Georgia, serif") {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * size * lineHeight}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(line)}</text>`).join("");
}
function centeredRows(lines: string[], x: number, y: number, size: number, color: string, weight = 700, lineHeight = 1.1) {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * size * lineHeight}" text-anchor="middle" font-family="Georgia, serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(line)}</text>`).join("");
}
function defaultFamily(cardType: VisualSlideDraft["cardType"]): TemplateFamily {
  if (cardType === "checklist") return "action";
  if (cardType === "comparison") return "comparison";
  if (cardType === "faq") return "explainer";
  if (cardType === "closing") return "conversation";
  return "editorial";
}
function defaultCue(cardType: VisualSlideDraft["cardType"]): GraphicCue {
  if (cardType === "checklist") return "process";
  if (cardType === "comparison") return "choice";
  if (cardType === "faq") return "question";
  if (cardType === "closing") return "confidence";
  if (cardType === "product") return "quality";
  return "style";
}
function cueSvg(cue: GraphicCue, x: number, y: number, size: number, colors: ReturnType<typeof palette>) {
  const stroke = colors.ink;
  const accent = colors.accent;
  const common = `fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"`;
  if (cue === "care") return `<circle cx="${x + size*.5}" cy="${y + size*.5}" r="${size*.42}" fill="${accent}"/><path d="M${x + size*.26} ${y + size*.65} C${x + size*.4} ${y + size*.52},${x + size*.54} ${y + size*.35},${x + size*.7} ${y + size*.2}" ${common}/>`;
  if (cue === "warning") return `<path d="M${x + size*.5} ${y + size*.08} L${x + size*.94} ${y + size*.86} H${x + size*.06} Z" fill="${accent}" stroke="${stroke}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M${x + size*.5} ${y + size*.36}v${size*.2} M${x + size*.5} ${y + size*.72}h1" ${common}/>`;
  if (cue === "choice") return `<path d="M${x + size*.5} ${y + size*.92}V${y + size*.46} M${x + size*.5} ${y + size*.46}L${x + size*.18} ${y + size*.16} M${x + size*.5} ${y + size*.46}L${x + size*.82} ${y + size*.16}" ${common}/><circle cx="${x + size*.18}" cy="${y + size*.16}" r="${size*.1}" fill="${accent}"/><circle cx="${x + size*.82}" cy="${y + size*.16}" r="${size*.1}" fill="${accent}"/>`;
  if (cue === "fit") return `<path d="M${x + size*.2} ${y + size*.15}C${x + size*.4} ${y + size*.35},${x + size*.6} ${y + size*.35},${x + size*.8} ${y + size*.15} M${x + size*.2} ${y + size*.85}C${x + size*.4} ${y + size*.65},${x + size*.6} ${y + size*.65},${x + size*.8} ${y + size*.85}" ${common}/><path d="M${x + size*.22} ${y + size*.25}V${y + size*.75} M${x + size*.78} ${y + size*.25}V${y + size*.75}" ${common}/>`;
  if (cue === "budget") return `<circle cx="${x + size*.5}" cy="${y + size*.5}" r="${size*.38}" fill="${accent}" stroke="${stroke}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><text x="${x + size*.5}" y="${y + size*.66}" text-anchor="middle" font-family="Georgia, serif" font-size="${size*.55}" font-weight="700" fill="${stroke}">₦</text>`;
  if (cue === "process") return `<path d="M${x + size*.22} ${y + size*.24}H${x + size*.84} M${x + size*.22} ${y + size*.5}H${x + size*.84} M${x + size*.22} ${y + size*.76}H${x + size*.84}" ${common}/><text x="${x + size*.02}" y="${y + size*.3}" font-family="Arial, sans-serif" font-size="${size*.22}" font-weight="700" fill="${accent}">✓</text><text x="${x + size*.02}" y="${y + size*.56}" font-family="Arial, sans-serif" font-size="${size*.22}" font-weight="700" fill="${accent}">✓</text><text x="${x + size*.02}" y="${y + size*.82}" font-family="Arial, sans-serif" font-size="${size*.22}" font-weight="700" fill="${accent}">✓</text>`;
  if (cue === "confidence") return `<path d="M${x + size*.16} ${y + size*.8}V${y + size*.52} M${x + size*.45} ${y + size*.8}V${y + size*.32} M${x + size*.74} ${y + size*.8}V${y + size*.12}" ${common}/><path d="M${x + size*.16} ${y + size*.28}L${x + size*.45} ${y + size*.08}L${x + size*.82} ${y + size*.2}" ${common}/>`;
  if (cue === "quality") return `<path d="M${x + size*.5} ${y + size*.06}L${x + size*.62} ${y + size*.34}L${x + size*.94} ${y + size*.38}L${x + size*.7} ${y + size*.6}L${x + size*.76} ${y + size*.92}L${x + size*.5} ${y + size*.76}L${x + size*.24} ${y + size*.92}L${x + size*.3} ${y + size*.6}L${x + size*.06} ${y + size*.38}L${x + size*.38} ${y + size*.34}Z" fill="${accent}"/>`;
  if (cue === "question") return `<text x="${x + size*.5}" y="${y + size*.72}" text-anchor="middle" font-family="Georgia, serif" font-size="${size*.9}" font-weight="700" fill="${stroke}">?</text>`;
  if (cue === "style") return `<path d="M${x + size*.14} ${y + size*.72}C${x + size*.3} ${y + size*.18},${x + size*.7} ${y + size*.9},${x + size*.86} ${y + size*.28}" ${common}/><circle cx="${x + size*.18}" cy="${y + size*.72}" r="${size*.09}" fill="${accent}"/><circle cx="${x + size*.84}" cy="${y + size*.28}" r="${size*.09}" fill="${accent}"/>`;
  return `<circle cx="${x + size*.5}" cy="${y + size*.5}" r="${size*.12}" fill="${accent}"/>`;
}
function headerSvg(brand: Brand, draft: VisualSlideDraft, number: number, total: number, colors: ReturnType<typeof palette>, inverse = false) {
  const tone = inverse ? "#F7FAED" : colors.sage;
  const pageTone = inverse ? "#DCE8D5" : "#718071";
  const markFill = inverse ? colors.accent : colors.ink;
  const markText = inverse ? colors.ink : "#F7FAED";
  const logo = brand.brandLogoDataUri
    ? `<image href="${brand.brandLogoDataUri}" x="120" y="76" width="56" height="56" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="120" y="76" width="56" height="56" rx="18" fill="${markFill}"/><text x="148" y="114" text-anchor="middle" font-family="Georgia, serif" font-size="29" font-weight="700" fill="${markText}">${escapeXml(brand.businessName.slice(0, 1).toUpperCase())}</text>`;
  return `${logo}<text x="192" y="104" font-family="Arial, sans-serif" font-size="23" font-weight="700" fill="${inverse ? "#F7FAED" : colors.ink}">${escapeXml(short(brand.businessName, 34))}</text><text x="192" y="132" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2.3" fill="${tone}">${escapeXml(short((draft.eyebrow || "VIRASQUARE NOTE").toUpperCase(), 34))}</text><text x="960" y="112" text-anchor="end" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${pageTone}">${number}/${total}</text>`;
}
function footerSvg(brand: Brand, draft: VisualSlideDraft, colors: ReturnType<typeof palette>, y: number, inverse = false) {
  const footer = wrappedLines((draft.footer || brand.defaultCta || "Save this for later.").toUpperCase(), 58).slice(0, 2);
  const color = inverse ? "#EAF2CA" : colors.sage;
  const business = inverse ? "#F7FAED" : "#718071";
  const instagram = brand.instagramHandle ? `<path d="M120 ${y + 22}h22a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-22a8 8 0 0 1-8-8V${y + 30}a8 8 0 0 1 8-8Zm11 10a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm15 2h1" fill="none" stroke="${business}" stroke-width="3" stroke-linecap="round"/><text x="164" y="${y + 48}" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${business}">@${escapeXml(brand.instagramHandle.replace(/^@+/, ""))}</text>` : "";
  const rightText = draft.cardType === "closing" && brand.closingSignature ? brand.closingSignature : brand.businessName;
  return `<line x1="120" y1="${y - 52}" x2="960" y2="${y - 52}" stroke="${inverse ? "#ffffff" : colors.mist}" stroke-opacity="${inverse ? ".24" : "1"}"/>${textRows(footer, 120, y, 21, color, 700, 1.15, "Arial, sans-serif")}${instagram}<text x="960" y="${y + 48}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${business}">${escapeXml(short(rightText, 52))}</text>`;
}
function bodySvg(body: string, x: number, y: number, maxChars: number, maxHeight: number, colors: ReturnType<typeof palette>, inverse = false) {
  const lines = wrappedLines(body, maxChars);
  const font = Math.max(25, Math.min(42, Math.floor(maxHeight / Math.max(lines.length * 1.36, 1))));
  const lineHeight = Math.max(1.38, Math.min(1.7, maxHeight / Math.max(font * lines.length, 1)));
  const color = inverse ? "#DEE8D8" : colors.body;
  return textRows(lines, x, y, font, color, 400, lineHeight, "Arial, sans-serif");
}
function editorialCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 25).slice(0, 3); const titleY = 370; const bodyY = titleY + title.length * 66 + 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/><rect x="58" y="58" width="964" height="500" rx="58" fill="${colors.accent}" opacity=".78"/><rect x="120" y="188" width="112" height="112" rx="32" fill="${colors.ink}"/>${headerSvg(brand, draft, number, total, colors)}${cueSvg(draft.graphicCue || defaultCue(draft.cardType), 142, 210, 68, colors)}${textRows(title, 120, titleY, draft.cardType === "cover" ? 68 : 60, colors.ink)}<rect x="120" y="${bodyY - 54}" width="840" height="1" fill="${colors.mist}"/><rect x="120" y="${bodyY - 6}" width="840" height="470" rx="28" fill="#F3F5ED"/>${bodySvg(draft.body, 160, bodyY + 56, 46, 420, colors)}${footerSvg(brand, draft, colors, 1190)}</svg>`;
}
function actionCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 25).slice(0, 3); const bodyY = 545;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.ink}"/><rect x="86" y="86" width="908" height="350" rx="42" fill="${colors.accent}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="178" width="100" height="100" rx="28" fill="${colors.ink}"/>${cueSvg(draft.graphicCue || "process", 140, 198, 60, colors)}${textRows(title, 120, 335, 58, colors.ink)}<text x="120" y="492" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="2.4" fill="#C9DDB8">PRACTICAL TAKEAWAY</text><rect x="120" y="520" width="840" height="590" rx="32" fill="#203025" stroke="#ffffff" stroke-opacity=".16"/><rect x="154" y="580" width="10" height="430" rx="5" fill="${colors.accent}"/>${bodySvg(draft.body, 202, bodyY + 75, 44, 470, colors, true)}${footerSvg(brand, draft, colors, 1190, true)}</svg>`;
}
function comparisonCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 25).slice(0, 3); const lines = draft.body.split(/\n+/).map(line => line.replace(/^[•\-]\s*/, "").trim()).filter(Boolean); const midpoint = Math.ceil(lines.length / 2); const left = lines.slice(0, midpoint).join("\n"); const right = lines.slice(midpoint).join("\n") || "Use the choice that supports the point you are making.";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="185" width="100" height="100" rx="28" fill="${colors.ink}"/>${cueSvg(draft.graphicCue || "choice", 140, 205, 60, colors)}${textRows(title, 120, 370, 58, colors.ink)}<rect x="120" y="570" width="396" height="540" rx="32" fill="${colors.accent}"/><rect x="564" y="570" width="396" height="540" rx="32" fill="#EFF2EA"/><text x="160" y="635" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="2.2" fill="${colors.ink}">TRY THIS</text><text x="604" y="635" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="2.2" fill="${colors.ink}">THINK ABOUT</text>${bodySvg(left, 160, 700, 16, 350, colors)}${bodySvg(right, 604, 700, 16, 350, colors)}${footerSvg(brand, draft, colors, 1190)}</svg>`;
}
function explainerCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 16).slice(0, 3); const bodyY = 615;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="188" width="840" height="285" rx="38" fill="${colors.ink}"/><rect x="160" y="250" width="540" height="180" rx="20" fill="#203025" opacity=".01"/><circle cx="842" cy="330" r="96" fill="${colors.accent}"/>${cueSvg(draft.graphicCue || "question", 792, 280, 100, colors)}${textRows(title, 160, 300, 54, "#F7FAED", 700, 1.12)}<rect x="120" y="535" width="840" height="1" fill="${colors.mist}"/>${bodySvg(draft.body, 120, bodyY, 48, 500, colors)}${footerSvg(brand, draft, colors, 1230)}</svg>`;
}
function conversationCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 23).slice(0, 4); const bodyY = 670;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.ink}"/><circle cx="180" cy="165" r="190" fill="${colors.accent}" opacity=".92"/><circle cx="940" cy="1180" r="250" fill="#ffffff" opacity=".07"/>${headerSvg(brand, draft, number, total, colors, true)}<rect x="120" y="210" width="122" height="122" rx="61" fill="${colors.accent}"/>${cueSvg(draft.graphicCue || "confidence", 151, 241, 60, colors)}${centeredRows(title, 540, 490, 67, "#F7FAED", 700, 1.08)}<rect x="210" y="${bodyY - 52}" width="660" height="1" fill="#ffffff" fill-opacity=".25"/>${centeredRows(wrappedLines(draft.body, 52), 540, bodyY, 29, "#DEE8D8", 400, 1.36)}${footerSvg(brand, draft, colors, 1230, true)}</svg>`;
}
function fieldChecklistCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 23).slice(0, 3); const checks = wrappedLines(draft.body, 40).slice(0, 5);
  const rows = checks.map((line, index) => `<rect x="144" y="${580 + index * 94}" width="792" height="74" rx="22" fill="${index % 2 ? "#F3F6EF" : colors.paper}"/><circle cx="184" cy="${617 + index * 94}" r="18" fill="${colors.accent}"/><text x="184" y="625" text-anchor="middle" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="${colors.ink}">✓</text>${textRows([line], 228, 630 + index * 94, 32, colors.ink, 400, 1.25, "Arial, sans-serif")}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#F4F7F0"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="202" width="840" height="260" rx="38" fill="${colors.accent}" opacity=".72"/><text x="160" y="260" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="2.4" fill="${colors.ink}">FIELD CHECKLIST</text>${textRows(title, 160, 348, 55, colors.ink)}${rows}${footerSvg(brand, draft, colors, 1190)}</svg>`;
}
function lookbookNotesCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 19).slice(0, 4); const notes = wrappedLines(draft.body, 40).slice(0, 4);
  const noteRows = notes.map((line, index) => `<circle cx="154" cy="${744 + index * 78}" r="9" fill="${colors.accent}"/>${textRows([line], 184, 756 + index * 78, 32, "#E7EFE1", 400, 1.3, "Arial, sans-serif")}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.ink}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="#203025" stroke="#ffffff" stroke-opacity=".16"/>${headerSvg(brand, draft, number, total, colors, true)}<rect x="120" y="200" width="188" height="44" rx="22" fill="${colors.accent}"/><text x="214" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="1.8" fill="${colors.ink}">LOOKBOOK NOTE</text><circle cx="844" cy="360" r="178" fill="${colors.accent}" opacity=".22"/><path d="M760 548C840 428 900 490 948 330" fill="none" stroke="${colors.accent}" stroke-width="12" stroke-linecap="round"/>${textRows(title, 120, 398, 66, "#FFFEFA", 700, 1.05)}<rect x="120" y="650" width="840" height="430" rx="34" fill="#ffffff" fill-opacity=".08"/>${noteRows}${footerSvg(brand, draft, colors, 1190, true)}</svg>`;
}
function truthCheckCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 23).slice(0, 3); const body = wrappedLines(draft.body, 41).slice(0, 5);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="198" width="840" height="130" rx="30" fill="#EEE4D6"/><text x="160" y="278" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="2.4" fill="${colors.ink}">COMMON ASSUMPTION</text>${textRows(title, 120, 450, 58, colors.ink)}<rect x="120" y="650" width="840" height="350" rx="34" fill="${colors.accent}" opacity=".58"/><text x="160" y="728" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="2.4" fill="${colors.ink}">WHAT HELPS INSTEAD</text>${bodySvg(body.join("\n"), 160, 800, 48, 310, colors)}${footerSvg(brand, draft, colors, 1190)}</svg>`;
}
function productAnatomyCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 22).slice(0, 3); const facts = wrappedLines(draft.body, 39).slice(0, 4);
  const factRows = facts.map((line, index) => `<path d="M154 ${638 + index * 94}h42" stroke="${colors.sage}" stroke-width="8" stroke-linecap="round"/>${textRows([line], 224, 653 + index * 94, 32, colors.body, 400, 1.25, "Arial, sans-serif")}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#F4F7F0"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="198" width="840" height="300" rx="42" fill="${colors.ink}"/><text x="160" y="272" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="2.2" fill="${colors.accent}">PRODUCT ANATOMY</text>${textRows(title, 160, 366, 56, "#FFFEFA", 700, 1.08)}<rect x="120" y="560" width="840" height="480" rx="34" fill="#F2F6ED"/>${factRows}${footerSvg(brand, draft, colors, 1190)}</svg>`;
}
function richCardSvg({ brand, draft, number, total, postTemplateFamily, postVisualSystem }: { brand: Brand; draft: VisualSlideDraft; number: number; total: number; postTemplateFamily?: TemplateFamily; postVisualSystem?: VisualSystem }) {
  assertRichCardFits(draft, number - 1);
  const visualSystem = postVisualSystem || draft.visualSystem;
  if (visualSystem === "field_checklist") return fieldChecklistCard(brand, draft, number, total);
  if (visualSystem === "lookbook_notes") return lookbookNotesCard(brand, draft, number, total);
  if (visualSystem === "truth_check") return truthCheckCard(brand, draft, number, total);
  if (visualSystem === "product_anatomy") return productAnatomyCard(brand, draft, number, total);
  if (visualSystem === "action_path") return actionCard(brand, draft, number, total);
  if (visualSystem === "balanced_contrast") return comparisonCard(brand, draft, number, total);
  if (visualSystem === "question_studio") return conversationCard(brand, draft, number, total);
  if (visualSystem === "editorial_guide") return editorialCard(brand, draft, number, total);
  const family = postTemplateFamily || resolvedTemplateFamily(draft);
  if (family === "action") return actionCard(brand, draft, number, total);
  if (family === "comparison") return comparisonCard(brand, draft, number, total);
  if (family === "explainer") return explainerCard(brand, draft, number, total);
  if (family === "conversation") return conversationCard(brand, draft, number, total);
  return editorialCard(brand, draft, number, total);
}

export function buildRichCardSvg(brand: Brand, draft: VisualSlideDraft, slideNumber = 1, totalSlides = 1, postTemplateFamily?: TemplateFamily, postVisualSystem?: VisualSystem) { return richCardSvg({ brand, draft, number: slideNumber, total: totalSlides, postTemplateFamily, postVisualSystem }); }

async function imageFromKey(storageKey: string) { const url = await storageGetSignedUrl(storageKey); const response = await fetch(url); if (!response.ok) throw new Error("The product image could not be read from storage."); const buffer = Buffer.from(await response.arrayBuffer()); const rawMime = response.headers.get("content-type")?.split(";")[0] || "image/jpeg"; const mime: "image/png" | "image/jpeg" | "image/webp" = rawMime === "image/png" || rawMime === "image/webp" || rawMime === "image/jpeg" ? rawMime : "image/jpeg"; return { buffer, mime, dataUri: `data:${mime};base64,${buffer.toString("base64")}` }; }
async function dataUriFromKey(storageKey: string) { return (await imageFromKey(storageKey)).dataUri; }
async function renderSvg(svg: string, keyPrefix: string, sourceMode: RenderedVisual["sourceMode"] = "template"): Promise<RenderedVisual> { const png = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render().asPng(); const { key: storedKey, url } = await storagePut(`visuals/${keyPrefix}.png`, png, "image/png"); return { assetKey: storedKey, assetUrl: url, sourceMode }; }
function imageBlock(imageData: string, x: number, y: number, width: number, height: number, radius = 46, withSoftBackdrop = false) { const clipId = `clip-${Math.random().toString(36).slice(2, 9)}`; const backdrop = withSoftBackdrop ? `<image href="${imageData}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity=".14" clip-path="url(#${clipId})"/><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#FFFEFA" opacity=".34"/>` : ""; return `<defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" /></clipPath></defs><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#e5ece0"/>${backdrop}<image href="${imageData}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`; }

function productPrice(product: ProductSource) {
  if (!product.price) return "Ask for price";
  const raw = product.price.trim();
  const numericSource = raw.replace(/,/g, "");
  const numeric = Number(numericSource);
  const display = numericSource && Number.isFinite(numeric) && /^\d+(?:\.\d+)?$/.test(numericSource)
    ? new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 }).format(numeric)
    : raw;
  return `${product.currency === "NGN" ? "₦" : `${product.currency} `}${display}`;
}
function productSupport(product: ProductSource) { return short(product.choiceReasons || product.bestFor || product.details || product.buyerNote || "Product details saved by the owner.", 105); }
function productBrandLockup(brand: Brand, colors: ReturnType<typeof palette>, inverse = false) {
  const text = inverse ? "#FFFEFA" : colors.ink;
  const mark = inverse ? colors.accent : colors.ink;
  const markText = inverse ? colors.ink : "#FFFEFA";
  const logo = brand.brandLogoDataUri
    ? `<image href="${brand.brandLogoDataUri}" x="84" y="74" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="84" y="74" width="48" height="48" rx="16" fill="${mark}"/><text x="108" y="107" text-anchor="middle" font-family="Georgia, serif" font-size="25" font-weight="700" fill="${markText}">${escapeXml(brand.businessName.slice(0, 1).toUpperCase())}</text>`;
  return `${logo}<text x="148" y="103" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="${text}">${escapeXml(short(brand.businessName, 34))}</text>`;
}
function productMeta(brand: Brand, colors: ReturnType<typeof palette>, y: number, inverse = false) {
  const tone = inverse ? "#DCE8D5" : colors.sage;
  const handle = brand.instagramHandle ? `@${brand.instagramHandle.replace(/^@+/, "")}` : brand.businessName;
  return `<line x1="84" y1="${y - 34}" x2="996" y2="${y - 34}" stroke="${inverse ? "#ffffff" : colors.mist}" stroke-opacity="${inverse ? ".22" : "1"}"/><text x="84" y="${y}" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="1.2" fill="${tone}">${escapeXml(handle)}</text><text x="996" y="${y}" text-anchor="end" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="${inverse ? "#FFFEFA" : colors.ink}">${escapeXml(short(brand.defaultCta || "Send a message to order", 34).toUpperCase())}</text>`;
}

export function chooseProductFlyerComposition(product: ProductSource, mode: ProductVisualMode): ProductFlyerComposition {
  if (mode === "stylish") return "campaign";
  return "photo_feature";
}

function productPhotoFeatureFlyer(brand: Brand, product: ProductSource, image: string) {
  const colors = palette(brand); const title = wrappedLines(product.name, 25).slice(0, 2); const support = wrappedLines(productSupport(product), 58).slice(0, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="42" y="40" width="996" height="1270" rx="56" fill="${colors.paper}"/><rect x="82" y="146" width="916" height="682" rx="48" fill="${colors.accent}" opacity=".28"/>${productBrandLockup(brand, colors)}${imageBlock(image, 96, 166, 888, 642, 42, true)}<rect x="84" y="850" width="912" height="344" rx="40" fill="#F5F7F2"/><text x="128" y="910" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2.1" fill="${colors.sage}">REAL PRODUCT • READY TO POST</text>${textRows(title, 128, 990, 56, colors.ink, 700, 1.06)}${textRows(support, 128, 1118, 24, colors.body, 400, 1.35, "Arial, sans-serif")}<rect x="128" y="1174" width="310" height="68" rx="24" fill="${colors.ink}"/><text x="156" y="1220" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="${colors.accent}">${escapeXml(productPrice(product))}</text>${productMeta(brand, colors, 1280)}</svg>`;
}

function productSpotlightFlyer(brand: Brand, product: ProductSource, image: string) {
  const colors = palette(brand); const title = wrappedLines(product.name, 24).slice(0, 2); const support = wrappedLines(productSupport(product), 54).slice(0, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="52" y="44" width="976" height="1262" rx="52" fill="${colors.paper}"/>${productBrandLockup(brand, colors)}<rect x="84" y="158" width="912" height="650" rx="42" fill="${colors.accent}" opacity=".42"/>${imageBlock(image, 112, 184, 856, 600, 38)}<rect x="84" y="858" width="912" height="350" rx="38" fill="${colors.ink}"/>${textRows(title, 132, 936, 57, "#FFFEFA", 700, 1.06)}${textRows(support, 132, 1080, 25, "#DCE8D5", 400, 1.36, "Arial, sans-serif")}<text x="132" y="1172" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${colors.accent}">${escapeXml(productPrice(product))}</text>${productMeta(brand, colors, 1260, true)}</svg>`;
}
function productEditorialSplitFlyer(brand: Brand, product: ProductSource, image: string) {
  const colors = palette(brand); const title = wrappedLines(product.name, 15).slice(0, 3); const support = wrappedLines(productSupport(product), 29).slice(0, 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.paper}"/><rect x="0" y="0" width="472" height="1350" fill="${colors.ink}"/><circle cx="58" cy="1234" r="240" fill="${colors.accent}" opacity=".24"/>${productBrandLockup(brand, colors, true)}<text x="84" y="278" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2.2" fill="${colors.accent}">PRODUCT EDIT</text>${textRows(title, 84, 372, 58, "#FFFEFA", 700, 1.06)}${textRows(support, 84, 610, 24, "#DCE8D5", 400, 1.4, "Arial, sans-serif")}<text x="84" y="1000" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="${colors.accent}">${escapeXml(productPrice(product))}</text>${productMeta(brand, colors, 1222, true)}<rect x="502" y="74" width="514" height="1202" rx="48" fill="${colors.accent}" opacity=".38"/>${imageBlock(image, 530, 106, 458, 1138, 42)}</svg>`;
}
function productDetailLedFlyer(brand: Brand, product: ProductSource, image: string) {
  const colors = palette(brand); const title = wrappedLines(product.name, 24).slice(0, 2); const detail = wrappedLines(productSupport(product), 52).slice(0, 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="52" y="44" width="976" height="1262" rx="52" fill="${colors.paper}"/>${productBrandLockup(brand, colors)}${imageBlock(image, 84, 158, 912, 526, 38)}<text x="84" y="782" font-family="Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2.1" fill="${colors.sage}">WHY CHOOSE IT</text>${textRows(title, 84, 870, 56, colors.ink, 700, 1.06)}<rect x="84" y="1016" width="912" height="150" rx="30" fill="${colors.accent}" opacity=".65"/>${textRows(detail, 122, 1080, 26, colors.ink, 400, 1.35, "Arial, sans-serif")}<text x="84" y="1230" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${colors.ink}">${escapeXml(productPrice(product))}</text>${productMeta(brand, colors, 1278)}</svg>`;
}
function productPriceLedFlyer(brand: Brand, product: ProductSource, image: string) {
  const colors = palette(brand); const title = wrappedLines(product.name, 23).slice(0, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.ink}"/><rect x="54" y="44" width="972" height="1262" rx="52" fill="#203025" stroke="#ffffff" stroke-opacity=".14"/>${productBrandLockup(brand, colors, true)}<rect x="84" y="164" width="912" height="672" rx="40" fill="${colors.paper}"/>${imageBlock(image, 112, 192, 856, 616, 34)}<rect x="84" y="878" width="912" height="216" rx="36" fill="${colors.accent}"/>${textRows(title, 126, 954, 50, colors.ink, 700, 1.06)}<text x="126" y="1148" font-family="Georgia, serif" font-size="66" font-weight="700" fill="${colors.accent}">${escapeXml(productPrice(product))}</text>${productMeta(brand, colors, 1260, true)}</svg>`;
}
function productCampaignFlyer(brand: Brand, product: ProductSource, image: string) {
  const colors = palette(brand); const title = wrappedLines(product.name, 22).slice(0, 2); const support = wrappedLines(productSupport(product), 48).slice(0, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.ink}"/><circle cx="930" cy="206" r="300" fill="${colors.accent}" opacity=".22"/><rect x="52" y="44" width="976" height="1262" rx="52" fill="none" stroke="#ffffff" stroke-opacity=".18"/>${productBrandLockup(brand, colors, true)}<text x="84" y="160" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="2.2" fill="${colors.accent}">STYLED PRODUCT VISUAL</text>${imageBlock(image, 84, 214, 912, 642, 44)}<rect x="84" y="902" width="912" height="290" rx="38" fill="#FFFEFA"/>${textRows(title, 130, 978, 54, colors.ink, 700, 1.06)}${textRows(support, 130, 1114, 24, colors.body, 400, 1.35, "Arial, sans-serif")}<text x="130" y="1172" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="${colors.ink}">${escapeXml(productPrice(product))}</text>${productMeta(brand, colors, 1260, true)}</svg>`;
}
function productSvg({ brand, product, image, mode }: { brand: Brand; product: ProductSource; image: string; mode: ProductVisualMode }) {
  const composition = chooseProductFlyerComposition(product, mode);
  if (composition === "photo_feature") return productPhotoFeatureFlyer(brand, product, image);
  if (composition === "editorial_split") return productEditorialSplitFlyer(brand, product, image);
  if (composition === "detail_led") return productDetailLedFlyer(brand, product, image);
  if (composition === "price_led") return productPriceLedFlyer(brand, product, image);
  if (composition === "campaign") return productCampaignFlyer(brand, product, image);
  return productSpotlightFlyer(brand, product, image);
}
export function buildProductFlyerSvg(brand: Brand, product: ProductSource, image: string, mode: ProductVisualMode) { return productSvg({ brand, product, image, mode }); }

function productPostSupport(product: ProductSource) { return product.bestFor || product.choiceReasons || product.details || product.buyerNote || "A considered choice, presented with the real details you saved."; }
function productFlyerFact(product: ProductSource) { return short(product.choiceReasons || product.bestFor || product.details || product.buyerNote || "Real product details saved by the owner.", 110); }
function flyerPrice(product: ProductSource) { return productPrice(product); }
function compactCta(brand: Brand) { return short(brand.defaultCta || "Send a message to order", 54); }

export function chooseProductFlyerDirection(product: ProductSource, mode: ProductVisualMode): ProductFlyerDirection {
  if (mode === "stylish") return "fashion_campaign";
  const category = (product.productCategory || "").toLowerCase();
  const text = `${category} ${product.name} ${product.details || ""}`.toLowerCase();
  if (product.price) return "price_spotlight";
  if (/(wig|hair|fashion|clothing|dress|shoe|bag)/.test(text)) return "fashion_campaign";
  if (/(beauty|personal.?care|skin|makeup|cream|serum|body)/.test(text)) return "beauty_story";
  if (/(gift|occasion|birthday|bridal|wedding)/.test(text)) return "gift_occasion";
  if (product.choiceReasons || product.details) return "editorial_feature";
  return "clean_retail";
}

function flyerDirectionBrief(direction: ProductFlyerDirection) {
  if (direction === "price_spotlight") return "a confident retail price-spotlight flyer with the price as a clear lower-third anchor";
  if (direction === "editorial_feature") return "an editorial product-feature flyer with one small, useful feature callout and a spacious premium hierarchy";
  if (direction === "fashion_campaign") return "a refined fashion-campaign flyer with an editorial product composition, not a generic luxury template";
  if (direction === "beauty_story") return "a warm, credible beauty-product flyer with clean product focus and a calm product-story hierarchy";
  if (direction === "gift_occasion") return "a tasteful gift-and-occasion flyer with a relevant, restrained celebratory mood";
  return "a clean, practical retail flyer with a strong product-first composition";
}

export function buildFullProductFlyerPrompt({ brand, product, mode, correction }: { brand: Brand; product: ProductSource; mode: ProductVisualMode; correction?: string }) {
  const direction = chooseProductFlyerDirection(product, mode);
  const handle = brand.instagramHandle ? `@${brand.instagramHandle.replace(/^@+/, "")}` : "";
  const correctionRule = correction?.trim()
    ? `\n\nThe owner asked to correct this specific issue: "${short(correction.trim(), 360)}". Apply that correction only if it does not conflict with the required saved facts below. Rebuild the entire flyer cleanly; never replace, omit, misspell, or contradict the required text.`
    : "";
  const visualRule = mode === "stylish"
    ? "The owner chose the optional AI-enhanced flyer. Use a more expressive but restrained campaign mood: you may alter the background, lighting, crop, and small visual details. Keep the product recognisable and never create a fantasy scene, an unrelated prop, a fake product feature, or an obvious AI-art effect."
    : "This is the normal Generate product-post card route. Keep the uploaded product as real, recognisable, and believable as possible. You may clean the background, improve presentation, and create the flyer composition, but do not redesign, replace, add, remove, simplify, or invent product features, labels, packaging, colour, texture, material, quantity, or claims.";
  return `Create ONE complete vertical 4:5 social-media product flyer for a small business. This is a final ready-to-post flyer, not a blank template, a collage, a story, a screenshot, or a mockup. Use the uploaded product image as the product source of truth.\n\nDesign direction: ${flyerDirectionBrief(direction)}.\nBrand mood: ${short(brand.brandVoice || "warm, clear, and credible", 120)}. Use the brand palette as a guide: primary ${brand.primaryColor || "#263327"}, accent ${brand.accentColor || "#EAF2CA"}. The composition must feel like a polished professional flyer someone would willingly post, with one dominant product visual, clear hierarchy, breathing room, and no random filler circles, fake badges, unnecessary decorative objects, or generic AI-flyer clutter.\n\n${visualRule}\n\nRender this exact visible text once, with correct spelling, punctuation, numbers, and hierarchy:\n- Brand name: ${brand.businessName}\n- Product name: ${product.name}\n- Supporting fact: ${productFlyerFact(product)}\n- Price or buying line: ${flyerPrice(product)}\n- Call to action: ${compactCta(brand)}\n${handle ? `- Instagram: ${handle}\n` : ""}\nUse the product name as saved. Do not replace it with generic wording such as "Fashion Handbag for Women." Do not invent a different price, product claim, feature, brand, social handle, or ordering instruction. If a logo asset is not available in the reference image, use a refined brand-name wordmark rather than inventing a fake logo.\n\nThe product must be the main visual focus. Do not add people, hands, extra products, boxes, jewellery, clothing, ingredients, results, props, or text that the owner did not supply.${correctionRule}`;
}
export function buildProductVisualPrompt(product: ProductSource, mode: ProductVisualMode) {
  const facts = [product.productCategory && `Category: ${product.productCategory}.`, product.bestFor && `Best for: ${product.bestFor}.`, product.choiceReasons && `Verified reasons to choose it: ${product.choiceReasons}.`, product.details && `Other verified details: ${product.details}.`].filter(Boolean).join("\n");
  const shared = `Use the uploaded image as the product source of truth. The product is ${product.name}. Preserve the exact product shown: its colour, shape, material, texture, pattern, size, quantity, labels, visible markings, and important details must remain real, recognisable, and believable. Do not replace, redesign, remove, add, simplify, or invent any product feature, claim, packaging, accessory, person, hand, or extra product.\n\nSaved facts for context only. Do not render these as text in the image and do not invent beyond them:\n${facts || "No extra facts were supplied."}\n\nCreate a vertical 4:5 product visual with clean breathing room around the product. Do not add words, price, logo, Instagram handle, labels, or call-to-action text. ViraSquare adds exact brand details separately.`;
  if (mode === "stylish") return `${shared}\n\nThe owner chose the optional AI-enhanced flyer. Use restrained campaign-style lighting, a refined setting, and a stronger but believable composition. You may creatively improve the background, lighting, crop, and small visual details, but never turn the product into a different item or an obvious AI illustration, 3D render, fantasy scene, or crowded flyer.`;
  return `${shared}\n\nThis is the normal Generate product-post card route. Improve presentation only: clean a distracting background, use natural professional product lighting and realistic shadows, and keep the result like a believable well-shot product photograph. Do not make the product look obviously AI-generated or overly stylised.`;
}

/** Preserves the complete tall GPT Image 2 result in a 4:5 presentation, never centre-cropping flyer content. */
export async function prepareEnhancedFlyerForInstagram(source: Buffer) {
  const image = sharp(source, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error("The AI-enhanced flyer did not return a usable image size.");
  const background = await image.clone().resize({ width: 1080, height: 1350, fit: "cover", position: "centre" }).blur(28).modulate({ brightness: 0.72, saturation: 0.78 }).png().toBuffer();
  const foreground = await image.clone().resize({ width: 1080, height: 1350, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: 1080, height: 1350, channels: 4, background: "#0B1220" } }).composite([{ input: background }, { input: foreground }]).png().toBuffer();
}

export async function renderProductPostCard({ brand, product, mode, correction }: { brand: Brand; product: ProductSource; mode: ProductVisualMode; correction?: string }) {
  const [sourceImage, renderedBrand] = await Promise.all([imageFromKey(product.imageKey), withBrandLogo(brand)]);
  if (mode === "standard") return renderSvg(buildProductFlyerSvg(renderedBrand, product, sourceImage.dataUri, "standard"), `product-original-${Date.now()}`, "product");
  try {
    const prompt = `${buildFullProductFlyerPrompt({ brand: renderedBrand, product, mode, correction })}\n\nIMPORTANT INSTAGRAM DELIVERY FRAME: GPT Image 2 works on a tall canvas. ViraSquare will preserve the full result inside a 4:5 Instagram presentation without cutting it. Keep every essential brand name, product, supporting fact, price, call to action, and Instagram handle comfortably away from the outer 8% of the tall canvas. Leave only non-essential breathing room above and below that protected content area.`;
    const generated = await createOpenAiProductVisual({ image: { bytes: sourceImage.buffer, mimeType: sourceImage.mime, fileName: "product-reference" }, prompt });
    const enhancedFlyer = await prepareEnhancedFlyerForInstagram(generated);
    const { key: assetKey, url: assetUrl } = await storagePut(`visuals/product-full-flyer-${Date.now()}.png`, enhancedFlyer, "image/png");
    return { assetKey, assetUrl, sourceMode: "ai_product" as const };
  } catch {
    return renderSvg(buildProductFlyerSvg(renderedBrand, product, sourceImage.dataUri, "standard"), `product-original-${Date.now()}`, "product");
  }
}

async function withBrandLogo(brand: Brand) { if (!brand.brandLogoKey) return brand; try { return { ...brand, brandLogoDataUri: await dataUriFromKey(brand.brandLogoKey) }; } catch { return brand; } }
export async function renderProductVisual({ brand, product }: { brand: Brand; product: ProductSource; heading: string; supporting: string }) { const [image, renderedBrand] = await Promise.all([dataUriFromKey(product.imageKey), withBrandLogo(brand)]); const visual = await renderSvg(buildProductFlyerSvg(renderedBrand, product, image, "standard"), `product-${Date.now()}`); return { ...visual, sourceMode: "product" as const }; }
export async function renderCarouselSlide({ brand, draft, slideNumber, totalSlides, product, useProduct, postTemplateFamily, postVisualSystem }: { brand: Brand; draft: VisualSlideDraft; slideNumber: number; totalSlides: number; product?: ProductSource; useProduct?: boolean; postTemplateFamily?: TemplateFamily; postVisualSystem?: VisualSystem }) { const renderedBrand = await withBrandLogo(brand); if (product && useProduct && draft.cardType === "product") { const image = await dataUriFromKey(product.imageKey); const visual = await renderSvg(buildProductFlyerSvg(renderedBrand, product, image, "standard"), `card-product-${Date.now()}-${slideNumber}`); return { ...visual, sourceMode: "product" as const }; } const family = postTemplateFamily || resolvedTemplateFamily(draft); const system = postVisualSystem || draft.visualSystem; return renderSvg(buildRichCardSvg(renderedBrand, draft, slideNumber, totalSlides, family, system), `card-${key(system || family)}-${Date.now()}-${slideNumber}`); }
