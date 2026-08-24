import { storageGetSignedUrl, storagePut } from "./storage";
import { Resvg } from "@resvg/resvg-js";
import { assertRichCardFits, resolvedTemplateFamily } from "./richCardQuality";

type Brand = { businessName: string; businessType: string; brandVoice: string; primaryColor?: string; accentColor?: string; defaultCta?: string };
type ProductSource = { name: string; price: string | null; currency: string; details: string | null; imageKey: string };
type TemplateFamily = "editorial" | "action" | "comparison" | "explainer" | "conversation";
type GraphicCue = "care" | "warning" | "choice" | "fit" | "budget" | "process" | "confidence" | "quality" | "style" | "question" | "none";

export type VisualSlideDraft = {
  cardType: "cover" | "guide" | "checklist" | "comparison" | "faq" | "product" | "closing";
  eyebrow: string;
  heading: string;
  body: string;
  footer: string;
  templateFamily?: TemplateFamily;
  graphicCue?: GraphicCue;
};
export type RenderedVisual = { assetKey: string; assetUrl: string; sourceMode: "product" | "generated" | "template" };

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
  if (cue === "care") return `<path d="M${x} ${y + size * .82} C${x + size * .12} ${y + size * .2},${x + size * .62} ${y + size * .05},${x + size * .82} ${y + size * .42} C${x + size * .68} ${y + size * .84},${x + size * .25} ${y + size * .96},${x} ${y + size * .82}Z" fill="${accent}"/><path d="M${x + size*.2} ${y + size*.68} C${x + size*.4} ${y + size*.54},${x + size*.52} ${y + size*.38},${x + size*.65} ${y + size*.2}" ${common}/>`;
  if (cue === "warning") return `<path d="M${x + size*.5} ${y + size*.08} L${x + size*.94} ${y + size*.86} H${x + size*.06} Z" fill="${accent}" ${common}/><path d="M${x + size*.5} ${y + size*.36}v${size*.2} M${x + size*.5} ${y + size*.72}h1" ${common}/>`;
  if (cue === "choice") return `<path d="M${x + size*.5} ${y + size*.92}V${y + size*.46} M${x + size*.5} ${y + size*.46}L${x + size*.18} ${y + size*.16} M${x + size*.5} ${y + size*.46}L${x + size*.82} ${y + size*.16}" ${common}/><circle cx="${x + size*.18}" cy="${y + size*.16}" r="${size*.1}" fill="${accent}"/><circle cx="${x + size*.82}" cy="${y + size*.16}" r="${size*.1}" fill="${accent}"/>`;
  if (cue === "fit") return `<path d="M${x + size*.2} ${y + size*.15}C${x + size*.4} ${y + size*.35},${x + size*.6} ${y + size*.35},${x + size*.8} ${y + size*.15} M${x + size*.2} ${y + size*.85}C${x + size*.4} ${y + size*.65},${x + size*.6} ${y + size*.65},${x + size*.8} ${y + size*.85}" ${common}/><path d="M${x + size*.22} ${y + size*.25}V${y + size*.75} M${x + size*.78} ${y + size*.25}V${y + size*.75}" ${common}/>`;
  if (cue === "budget") return `<circle cx="${x + size*.5}" cy="${y + size*.5}" r="${size*.38}" fill="${accent}" ${common}/><text x="${x + size*.5}" y="${y + size*.66}" text-anchor="middle" font-family="Georgia, serif" font-size="${size*.55}" font-weight="700" fill="${stroke}">₦</text>`;
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
  return `<text x="120" y="125" font-family="Arial, sans-serif" font-size="21" font-weight="700" letter-spacing="3" fill="${tone}">${escapeXml((draft.eyebrow || brand.businessName).toUpperCase())}</text><text x="960" y="125" text-anchor="end" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${pageTone}">${number}/${total}</text>`;
}
function footerSvg(brand: Brand, draft: VisualSlideDraft, colors: ReturnType<typeof palette>, y: number, inverse = false) {
  const footer = wrappedLines((draft.footer || brand.defaultCta || "Save this for later.").toUpperCase(), 58).slice(0, 2);
  const color = inverse ? "#EAF2CA" : colors.sage;
  const business = inverse ? "#F7FAED" : "#718071";
  return `<line x1="120" y1="${y - 52}" x2="960" y2="${y - 52}" stroke="${inverse ? "#ffffff" : colors.mist}" stroke-opacity="${inverse ? ".24" : "1"}"/>${textRows(footer, 120, y, 21, color, 700, 1.15, "Arial, sans-serif")}<text x="960" y="${y}" text-anchor="end" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${business}">${escapeXml(brand.businessName)}</text>`;
}
function bodySvg(body: string, x: number, y: number, maxChars: number, maxHeight: number, colors: ReturnType<typeof palette>, inverse = false) {
  const lines = wrappedLines(body, maxChars);
  const font = Math.max(23, Math.min(31, Math.floor(maxHeight / Math.max(lines.length * 1.32, 1))));
  const color = inverse ? "#DEE8D8" : colors.body;
  return textRows(lines, x, y, font, color, 400, 1.32, "Arial, sans-serif");
}
function editorialCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 24).slice(0, 4); const titleY = 370; const bodyY = titleY + title.length * 68 + 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/><circle cx="900" cy="160" r="190" fill="${colors.accent}" opacity=".9"/><path d="M84 1050 C250 930, 400 1180, 590 1040 S 880 900, 1000 1080" fill="none" stroke="${colors.mist}" stroke-width="38" opacity=".9"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="188" width="112" height="112" rx="32" fill="${colors.ink}"/>${cueSvg(draft.graphicCue || defaultCue(draft.cardType), 142, 210, 68, colors)}${textRows(title, 120, titleY, draft.cardType === "cover" ? 70 : 60, colors.ink)}<line x1="120" y1="${bodyY - 44}" x2="960" y2="${bodyY - 44}" stroke="${colors.mist}"/>${bodySvg(draft.body, 120, bodyY, 48, 500, colors)}${footerSvg(brand, draft, colors, 1230)}</svg>`;
}
function actionCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 24).slice(0, 3); const bodyY = 590;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.ink}"/><rect x="86" y="86" width="908" height="430" rx="42" fill="${colors.accent}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="178" width="100" height="100" rx="28" fill="${colors.ink}"/>${cueSvg(draft.graphicCue || "process", 140, 198, 60, colors)}${textRows(title, 120, 370, 60, colors.ink)}<rect x="120" y="${bodyY - 50}" width="840" height="1" fill="#ffffff" fill-opacity=".22"/>${bodySvg(draft.body, 120, bodyY, 47, 460, colors, true)}${footerSvg(brand, draft, colors, 1230, true)}</svg>`;
}
function comparisonCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 25).slice(0, 3); const bodyY = 590;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/><path d="M58 58H600V1292H58Z" fill="${colors.accent}" opacity=".42"/><circle cx="890" cy="250" r="130" fill="${colors.ink}" opacity=".95"/>${headerSvg(brand, draft, number, total, colors)}${cueSvg(draft.graphicCue || "choice", 820, 180, 140, colors)}${textRows(title, 120, 385, 59, colors.ink)}<rect x="120" y="510" width="840" height="1" fill="${colors.mist}"/><rect x="120" y="${bodyY - 44}" width="12" height="430" rx="6" fill="${colors.ink}"/>${bodySvg(draft.body, 170, bodyY, 45, 465, colors)}${footerSvg(brand, draft, colors, 1230)}</svg>`;
}
function explainerCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 24).slice(0, 3); const bodyY = 615;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><rect x="58" y="58" width="964" height="1234" rx="58" fill="${colors.paper}"/>${headerSvg(brand, draft, number, total, colors)}<rect x="120" y="188" width="840" height="285" rx="38" fill="${colors.ink}"/><circle cx="842" cy="330" r="96" fill="${colors.accent}"/>${cueSvg(draft.graphicCue || "question", 792, 280, 100, colors)}${textRows(title, 160, 300, 58, "#F7FAED")}<rect x="120" y="535" width="840" height="1" fill="${colors.mist}"/>${bodySvg(draft.body, 120, bodyY, 48, 500, colors)}${footerSvg(brand, draft, colors, 1230)}</svg>`;
}
function conversationCard(brand: Brand, draft: VisualSlideDraft, number: number, total: number) {
  const colors = palette(brand); const title = wrappedLines(draft.heading, 23).slice(0, 4); const bodyY = 670;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.ink}"/><circle cx="180" cy="165" r="190" fill="${colors.accent}" opacity=".92"/><circle cx="940" cy="1180" r="250" fill="#ffffff" opacity=".07"/>${headerSvg(brand, draft, number, total, colors, true)}<rect x="120" y="210" width="122" height="122" rx="61" fill="${colors.accent}"/>${cueSvg(draft.graphicCue || "confidence", 151, 241, 60, colors)}${centeredRows(title, 540, 490, 67, "#F7FAED", 700, 1.08)}<rect x="210" y="${bodyY - 52}" width="660" height="1" fill="#ffffff" fill-opacity=".25"/>${centeredRows(wrappedLines(draft.body, 52), 540, bodyY, 29, "#DEE8D8", 400, 1.36)}${footerSvg(brand, draft, colors, 1230, true)}</svg>`;
}
function richCardSvg({ brand, draft, number, total }: { brand: Brand; draft: VisualSlideDraft; number: number; total: number }) {
  assertRichCardFits(draft, number - 1);
  const family = resolvedTemplateFamily(draft);
  if (family === "action") return actionCard(brand, draft, number, total);
  if (family === "comparison") return comparisonCard(brand, draft, number, total);
  if (family === "explainer") return explainerCard(brand, draft, number, total);
  if (family === "conversation") return conversationCard(brand, draft, number, total);
  return editorialCard(brand, draft, number, total);
}

export function buildRichCardSvg(brand: Brand, draft: VisualSlideDraft, slideNumber = 1, totalSlides = 1) { return richCardSvg({ brand, draft, number: slideNumber, total: totalSlides }); }

async function dataUriFromKey(storageKey: string) { const url = await storageGetSignedUrl(storageKey); const response = await fetch(url); if (!response.ok) throw new Error("The product image could not be read from storage."); const buffer = Buffer.from(await response.arrayBuffer()); const mime = response.headers.get("content-type")?.split(";")[0] || "image/jpeg"; return `data:${mime};base64,${buffer.toString("base64")}`; }
async function renderSvg(svg: string, keyPrefix: string): Promise<RenderedVisual> { const png = new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render().asPng(); const { key: storedKey, url } = await storagePut(`visuals/${keyPrefix}.png`, png, "image/png"); return { assetKey: storedKey, assetUrl: url, sourceMode: "template" }; }
function imageBlock(imageData: string, x: number, y: number, width: number, height: number, radius = 46) { const clipId = `clip-${Math.random().toString(36).slice(2, 9)}`; return `<defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" /></clipPath></defs><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#e5ece0"/><image href="${imageData}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`; }
function productSvg({ brand, product, image, draft, number, total }: { brand: Brand; product: ProductSource; image: string; draft: VisualSlideDraft; number: number; total: number }) { const colors = palette(brand); const title = wrappedLines(draft.heading, 22).slice(0, 3); const price = product.price ? `${product.currency === "NGN" ? "₦" : `${product.currency} `}${product.price}` : "Ask for today’s price"; return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${colors.soft}"/><circle cx="970" cy="145" r="230" fill="${colors.accent}" opacity=".72"/>${headerSvg(brand, draft, number, total, colors)}${imageBlock(image, 82, 150, 916, 570)}<rect x="82" y="770" width="916" height="456" rx="48" fill="${colors.ink}"/>${textRows(title, 130, 870, 59, "#FFFEFA")}<text x="130" y="${870 + title.length * 65 + 30}" font-family="Arial, sans-serif" font-size="27" fill="#D5E3CF">${escapeXml(short(draft.body || product.details || "A thoughtful choice for your everyday needs.", 160))}</text><line x1="130" y1="1132" x2="950" y2="1132" stroke="#ffffff" stroke-opacity=".20"/><text x="130" y="1195" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${colors.accent}">${escapeXml(price)}</text><text x="950" y="1194" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">${escapeXml((draft.footer || brand.defaultCta || "Send us a message to order.").toUpperCase())}</text></svg>`; }

export async function renderProductVisual({ brand, product, heading, supporting }: { brand: Brand; product: ProductSource; heading: string; supporting: string }) { const image = await dataUriFromKey(product.imageKey); const draft: VisualSlideDraft = { cardType: "product", eyebrow: brand.businessName, heading, body: supporting, footer: brand.defaultCta || "Send us a message to order." }; const visual = await renderSvg(productSvg({ brand, product, image, draft, number: 1, total: 1 }), `product-${Date.now()}`); return { ...visual, sourceMode: "product" as const }; }
export async function renderCarouselSlide({ brand, draft, slideNumber, totalSlides, product, useProduct }: { brand: Brand; draft: VisualSlideDraft; slideNumber: number; totalSlides: number; product?: ProductSource; useProduct?: boolean }) { if (product && useProduct && draft.cardType === "product") { const image = await dataUriFromKey(product.imageKey); const visual = await renderSvg(productSvg({ brand, product, image, draft, number: slideNumber, total: totalSlides }), `card-product-${Date.now()}-${slideNumber}`); return { ...visual, sourceMode: "product" as const }; } return renderSvg(buildRichCardSvg(brand, draft, slideNumber, totalSlides), `card-${key(draft.templateFamily || draft.cardType)}-${Date.now()}-${slideNumber}`); }
