export const INSTAGRAM_CAPTION_MAX_LENGTH = 2200;
export const PRODUCT_POST_HASHTAG_LIMIT = 5;

export function normalizeProductPostHashtags(values: string[]) {
  if (values.length > PRODUCT_POST_HASHTAG_LIMIT) throw new Error(`Choose no more than ${PRODUCT_POST_HASHTAG_LIMIT} optional hashtags.`);
  const seen = new Set<string>();
  return values.map(value => value.trim().normalize("NFKC")).map(value => {
    if (!/^#[A-Za-z0-9_]{2,48}$/.test(value)) throw new Error("Each hashtag must start with # and use only letters, numbers, or underscores.");
    const key = value.toLowerCase();
    if (seen.has(key)) throw new Error("Choose each hashtag only once.");
    seen.add(key);
    return value;
  });
}

export function composeInstagramCaption(caption: string, hashtags: string[]) {
  const finalCaption = `${caption.trimEnd()}${hashtags.length ? `\n\n${hashtags.join(" ")}` : ""}`;
  if (finalCaption.length > INSTAGRAM_CAPTION_MAX_LENGTH) throw new Error(`Keep the complete caption within ${INSTAGRAM_CAPTION_MAX_LENGTH.toLocaleString()} characters.`);
  return finalCaption;
}

function toHashtag(value: string | null | undefined) {
  const words = (value || "").normalize("NFKC").match(/[A-Za-z0-9]+/g) || [];
  const joined = words.join("");
  return joined.length >= 2 ? `#${joined.slice(0, 48)}` : null;
}

/** Suggestions only, derived solely from facts the owner saved about their product and business. */
export function buildRelevantProductHashtagSuggestions(context: { businessName?: string | null; productName?: string | null; productCategory?: string | null; businessType?: string | null; customerMarket?: string | null }) {
  const seen = new Set<string>();
  return [context.businessName, context.productName, context.productCategory || context.businessType, context.businessType, context.customerMarket]
    .map(toHashtag)
    .filter((value): value is string => Boolean(value))
    .filter(value => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, PRODUCT_POST_HASHTAG_LIMIT);
}
