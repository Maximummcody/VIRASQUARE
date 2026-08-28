import sharp from "sharp";
import { storageGetSignedUrl, storagePut } from "./storage";

const INSTAGRAM_GRAPH_BASE = "https://graph.instagram.com/v26.0";
const INSTAGRAM_PUBLISHING_LIMIT = 100;

export class InstagramPublishError extends Error {
  constructor(message: string, public readonly code: string) { super(message); }
}

function publicMediaUrl(relativeUrl: string) {
  const redirectUri = process.env.META_INSTAGRAM_REDIRECT_URI?.trim();
  if (!redirectUri) throw new InstagramPublishError("Instagram publishing is not configured yet.", "configuration_missing");
  const origin = new URL(redirectUri).origin;
  const url = new URL(relativeUrl, origin).toString();
  if (!url.startsWith("https://")) throw new InstagramPublishError("Instagram needs a secure public image URL.", "insecure_media_url");
  return url;
}

async function responseJson(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({})) as { error?: { message?: string; code?: number }; message?: string };
  if (!response.ok) throw new InstagramPublishError(body.error?.message || body.message || fallback, `instagram_${body.error?.code || response.status}`);
  return body as Record<string, unknown>;
}

export function shouldDiscloseInstagramAiGeneration(input: { sourceMode?: string | null; generationMode?: string | null }) {
  return input.sourceMode === "ai_product" || input.generationMode === "stylish";
}

/** Converts an already reviewed 4:5 flyer to the JPEG and secure public URL Meta requires. */
export async function prepareInstagramJpeg(input: { userId: number; deliverableId: number; sourceAssetKey: string; idempotencyKey: string }) {
  const sourceUrl = await storageGetSignedUrl(input.sourceAssetKey);
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new InstagramPublishError("The finished flyer could not be prepared for Instagram.", "asset_unavailable");
  const source = Buffer.from(await response.arrayBuffer());
  let jpeg: Buffer;
  try {
    jpeg = await sharp(source, { failOn: "error" }).rotate().resize({ width: 1080, height: 1350, fit: "contain", background: "#FFFFFF" }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  } catch {
    throw new InstagramPublishError("The finished flyer is not a usable image for Instagram.", "asset_invalid");
  }
  const stored = await storagePut(`instagram-publish/${input.userId}/${input.deliverableId}-${input.idempotencyKey}.jpg`, jpeg, "image/jpeg");
  return { assetKey: stored.key, assetUrl: stored.url, publicUrl: publicMediaUrl(stored.url) };
}

export async function publishInstagramSingleImage(input: { accountId: string; accessToken: string; publicImageUrl: string; caption: string; isAiGenerated: boolean }) {
  if (!input.publicImageUrl.startsWith("https://")) throw new InstagramPublishError("Instagram needs a secure public image URL.", "insecure_media_url");
  if (!input.caption.trim() || input.caption.length > 2200) throw new InstagramPublishError("Review the caption before publishing. Instagram captions must be between 1 and 2,200 characters.", "caption_invalid");

  const limitResponse = await fetch(`${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(input.accountId)}/content_publishing_limit`, { headers: { Authorization: `Bearer ${input.accessToken}` } });
  const limitBody = await responseJson(limitResponse, "Instagram could not check this account’s publishing limit.") as { data?: Array<{ quota_usage?: number }> };
  if ((limitBody.data?.[0]?.quota_usage || 0) >= INSTAGRAM_PUBLISHING_LIMIT) throw new InstagramPublishError("This Instagram account has reached its API publishing limit for the current 24-hour period.", "publishing_limit_reached");

  const containerResponse = await fetch(`${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(input.accountId)}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: input.publicImageUrl, caption: input.caption, ...(input.isAiGenerated ? { is_ai_generated: true } : {}) }),
  });
  const container = await responseJson(containerResponse, "Instagram could not prepare this flyer.") as { id?: string };
  if (!container.id) throw new InstagramPublishError("Instagram did not return a publishable flyer container.", "container_missing");

  const publishResponse = await fetch(`${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(input.accountId)}/media_publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${input.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id }),
  });
  const published = await responseJson(publishResponse, "Instagram could not publish this flyer.") as { id?: string };
  if (!published.id) throw new InstagramPublishError("Instagram did not return a published post ID.", "post_missing");

  const permalinkResponse = await fetch(`${INSTAGRAM_GRAPH_BASE}/${encodeURIComponent(published.id)}?fields=permalink`, { headers: { Authorization: `Bearer ${input.accessToken}` } });
  const permalinkBody = await permalinkResponse.json().catch(() => ({})) as { permalink?: string };
  return { containerId: container.id, postId: published.id, permalink: permalinkBody.permalink || null };
}
