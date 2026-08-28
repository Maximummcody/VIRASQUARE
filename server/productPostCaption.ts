export const MAX_INSTAGRAM_CAPTION_LENGTH = 2200;
export const MAX_OPTIONAL_HASHTAGS = 5;

export function normalizeProductPostHashtags(values: string[]) {
  const normalized = values.map(value => value.trim()).filter(Boolean);
  if (normalized.length > MAX_OPTIONAL_HASHTAGS) throw new Error(`Choose no more than ${MAX_OPTIONAL_HASHTAGS} optional hashtags.`);
  const seen = new Set<string>();
  for (const hashtag of normalized) {
    if (!/^#[A-Za-z0-9_]{1,50}$/.test(hashtag)) throw new Error("Each hashtag must start with # and use letters, numbers, or underscores only.");
    const key = hashtag.toLocaleLowerCase();
    if (seen.has(key)) throw new Error("Choose each optional hashtag only once.");
    seen.add(key);
  }
  return normalized;
}

export function composeInstagramCaption(caption: string, hashtags: string[]) {
  const savedCaption = caption.trim();
  const finalCaption = hashtags.length ? `${savedCaption}\n\n${hashtags.join(" ")}` : savedCaption;
  if (finalCaption.length > MAX_INSTAGRAM_CAPTION_LENGTH) throw new Error(`Keep the caption within ${MAX_INSTAGRAM_CAPTION_LENGTH.toLocaleString()} characters, including hashtags.`);
  return finalCaption;
}

function compactHashtag(value: string | null | undefined) {
  const compact = (value || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 40);
  return compact ? `#${compact}` : null;
}

export function buildRelevantProductHashtagSuggestions(context: { businessName?: string | null; productName?: string | null; productCategory?: string | null; businessType?: string | null; customerMarket?: string | null }) {
  const suggestions = [context.businessName, context.productName, context.productCategory, context.businessType, context.customerMarket]
    .map(compactHashtag)
    .filter((value): value is string => Boolean(value));
  return Array.from(new Map(suggestions.map(value => [value.toLocaleLowerCase(), value])).values()).slice(0, MAX_OPTIONAL_HASHTAGS);
}

export function parseSavedHashtags(value: string | null | undefined) {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) && parsed.every(entry => typeof entry === "string") ? normalizeProductPostHashtags(parsed) : [];
  } catch {
    return [];
  }
}
