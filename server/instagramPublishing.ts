import sharp from "sharp";
import { storageGetSignedUrl, storagePut } from "./storage";

const INSTAGRAM_GRAPH_HOST = "https://graph.instagram.com/v26.0";
const INSTAGRAM_MAX_CAPTION_LENGTH = 2_200;
const INSTAGRAM_DAILY_POST_LIMIT = 100;

type InstagramApiError = { error?: { message?: string; code?: number; error_subcode?: number } };
type InstagramLimitResponse = { data?: Array<{ quota_usage?: number; config?: { quota_total?: number } }> };
type InstagramCreateContainerResponse = { id?: string; error?: InstagramApiError["error"] };
type InstagramPublishResponse = { id?: string; error?: InstagramApiError["error"] };
type InstagramMediaResponse = { permalink?: string; error?: InstagramApiError["error"] };

export class InstagramPublishError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "InstagramPublishError";
  }
}

function safeProviderMessage(payload: unknown, fallback: string) {
  const error = (payload as InstagramApiError | undefined)?.error;
  return typeof error?.message === "string" && error.message.trim() ? error.message.trim().slice(0, 500) : fallback;
}

async function instagramJson<T>(url: string, accessToken: string, body?: Record<string, unknown>) {
  const response = await fetch(url, body ? {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  } : { headers: { Authorization: `Bearer ${accessToken}` } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new InstagramPublishError(safeProviderMessage(payload, "Instagram could not process this publishing request."), "provider_request_failed");
  }
  return payload as T;
}

/**
 * Creates a short-lived JPEG copy for Meta without changing the source flyer.
 * The returned URL is an HTTPS S3 URL that Meta can fetch during this one request.
 */
export async function prepareInstagramJpeg(input: { userId: number; deliverableId: number; sourceAssetKey: string; idempotencyKey: string }) {
  const sourceUrl = await storageGetSignedUrl(input.sourceAssetKey);
  const source = await fetch(sourceUrl);
  if (!source.ok) throw new InstagramPublishError("The finished flyer could not be prepared for Instagram. Please try again.", "media_unavailable");
  const bytes = Buffer.from(await source.arrayBuffer());
  if (!bytes.length || bytes.length > 16 * 1024 * 1024) throw new InstagramPublishError("The finished flyer is not available in a supported size for Instagram.", "media_size_invalid");

  let jpeg: Buffer;
  try {
    jpeg = await sharp(bytes, { failOn: "error" }).rotate().jpeg({ quality: 92, progressive: true, chromaSubsampling: "4:4:4" }).toBuffer();
  } catch {
    throw new InstagramPublishError("The finished flyer could not be converted into Instagram’s required image format.", "media_conversion_failed");
  }
  const uploaded = await storagePut(`${input.userId}/instagram-publish/${input.deliverableId}-${input.idempotencyKey}.jpg`, jpeg, "image/jpeg");
  return { assetKey: uploaded.key, assetUrl: uploaded.url, publicUrl: await storageGetSignedUrl(uploaded.key) };
}

export async function getInstagramPublishingLimit(input: { accountId: string; accessToken: string }) {
  const url = `${INSTAGRAM_GRAPH_HOST}/${encodeURIComponent(input.accountId)}/content_publishing_limit`;
  const result = await instagramJson<InstagramLimitResponse>(url, input.accessToken);
  const current = result.data?.[0];
  const used = Number(current?.quota_usage || 0);
  const total = Number(current?.config?.quota_total || INSTAGRAM_DAILY_POST_LIMIT);
  return { used, total: total || INSTAGRAM_DAILY_POST_LIMIT, remaining: Math.max(0, (total || INSTAGRAM_DAILY_POST_LIMIT) - used) };
}

export async function publishInstagramSingleImage(input: {
  accountId: string;
  accessToken: string;
  publicImageUrl: string;
  caption: string;
  isAiGenerated: boolean;
}) {
  if (!input.publicImageUrl.startsWith("https://")) throw new InstagramPublishError("Instagram needs a secure public image address for this one publishing request.", "media_url_invalid");
  if (input.caption.length > INSTAGRAM_MAX_CAPTION_LENGTH) throw new InstagramPublishError("This caption is longer than Instagram allows. Shorten it before publishing.", "caption_too_long");

  const limit = await getInstagramPublishingLimit({ accountId: input.accountId, accessToken: input.accessToken });
  if (limit.remaining < 1) throw new InstagramPublishError("This Instagram account has reached Meta’s current publishing limit. Try again later.", "publishing_limit_reached");

  const createUrl = `${INSTAGRAM_GRAPH_HOST}/${encodeURIComponent(input.accountId)}/media`;
  const container = await instagramJson<InstagramCreateContainerResponse>(createUrl, input.accessToken, {
    image_url: input.publicImageUrl,
    caption: input.caption,
    ...(input.isAiGenerated ? { is_ai_generated: true } : {}),
  });
  if (!container.id) throw new InstagramPublishError(safeProviderMessage(container, "Instagram did not create a media container."), "container_missing");

  const publishUrl = `${INSTAGRAM_GRAPH_HOST}/${encodeURIComponent(input.accountId)}/media_publish`;
  const published = await instagramJson<InstagramPublishResponse>(publishUrl, input.accessToken, { creation_id: container.id });
  if (!published.id) throw new InstagramPublishError(safeProviderMessage(published, "Instagram did not confirm the published post."), "publish_missing");

  let permalink: string | null = null;
  try {
    const media = await instagramJson<InstagramMediaResponse>(`${INSTAGRAM_GRAPH_HOST}/${encodeURIComponent(published.id)}?fields=permalink`, input.accessToken);
    permalink = typeof media.permalink === "string" ? media.permalink : null;
  } catch {
    // The post is already confirmed by Meta. A delayed permalink must not mark it failed.
  }
  return { containerId: container.id, postId: published.id, permalink, limit };
}

export function shouldDiscloseInstagramAiGeneration(input: { sourceMode?: string | null; generationMode?: string | null }) {
  return input.generationMode === "stylish" || input.sourceMode === "ai_product" || input.sourceMode === "generated";
}
