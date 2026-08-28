import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

export const GROUP4A_INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const;

export type SocialPublishStatus = "awaiting_confirmation" | "scheduled" | "publishing" | "published" | "failed" | "cancelled";

const ALLOWED_STATUS_CHANGES: Record<SocialPublishStatus, SocialPublishStatus[]> = {
  awaiting_confirmation: ["publishing", "cancelled"],
  scheduled: ["publishing", "cancelled"],
  publishing: ["published", "failed"],
  published: [],
  failed: ["awaiting_confirmation"],
  cancelled: [],
};

export function canTransitionPublishStatus(from: SocialPublishStatus, to: SocialPublishStatus) {
  return ALLOWED_STATUS_CHANGES[from].includes(to);
}

function tokenCipherKey(serverSecret: string) {
  if (!serverSecret.trim()) throw new Error("Server token protection is not configured.");
  return createHash("sha256").update(`virasquare:meta-token:v1:${serverSecret}`).digest();
}

/**
 * Encrypts provider credentials before they reach persistence. The browser only
 * receives connection status and account labels, never this value.
 */
export function encryptSocialAccessToken(accessToken: string, serverSecret: string) {
  if (!accessToken.trim()) throw new Error("A provider access token is required.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenCipherKey(serverSecret), iv);
  const ciphertext = Buffer.concat([cipher.update(accessToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSocialAccessToken(encryptedValue: string, serverSecret: string) {
  const [version, ivValue, tagValue, ciphertextValue] = encryptedValue.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) throw new Error("Stored provider credentials are invalid.");
  const decipher = createDecipheriv("aes-256-gcm", tokenCipherKey(serverSecret), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}

export function createPublishIdempotencyKey() {
  return `vs_pub_${randomUUID()}`;
}

export function createOAuthState() {
  return `vs_meta_${randomBytes(24).toString("base64url")}`;
}

export function buildInstagramAuthorizeUrl(input: { appId: string; redirectUri: string; state: string }) {
  if (!input.appId || !input.redirectUri || !input.state) throw new Error("Instagram connection setup is incomplete.");
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GROUP4A_INSTAGRAM_SCOPES.join(","));
  return url.toString();
}

export function getInstagramLoginConfig() {
  const appId = process.env.META_INSTAGRAM_APP_ID?.trim() || "";
  const appSecret = process.env.META_INSTAGRAM_APP_SECRET?.trim() || "";
  const redirectUri = process.env.META_INSTAGRAM_REDIRECT_URI?.trim() || "";
  return { appId, appSecret, redirectUri, configured: Boolean(appId && appSecret && redirectUri && process.env.JWT_SECRET?.trim()) };
}

export function publicSocialAccount<T extends { encryptedAccessToken?: string | null }>(account: T) {
  const { encryptedAccessToken: _secret, ...publicAccount } = account;
  return publicAccount;
}
