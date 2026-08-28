import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";

export const GROUP4A_INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const;

export type InstagramLoginConfig = { appId: string; appSecret: string; redirectUri: string; configured: boolean };

export function getInstagramLoginConfig(): InstagramLoginConfig {
  const appId = process.env.META_INSTAGRAM_APP_ID?.trim() || "";
  const appSecret = process.env.META_INSTAGRAM_APP_SECRET?.trim() || "";
  const redirectUri = process.env.META_INSTAGRAM_REDIRECT_URI?.trim() || "";
  return { appId, appSecret, redirectUri, configured: Boolean(appId && appSecret && redirectUri) };
}

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
  // JWT_SECRET is platform-managed and may be shorter than an arbitrary
  // character threshold while still being securely generated. The SHA-256
  // derivation below always supplies AES-256 with a full-length key; reject
  // only an absent or implausibly short source secret.
  if (serverSecret.trim().length < 16) throw new Error("Server token protection is not configured.");
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
  // Instagram Login is purpose-built for Professional accounts and does not
  // require a linked Facebook Page. Page publishing stays a separate future
  // Meta capability, rather than being requested during this test connection.
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", input.appId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GROUP4A_INSTAGRAM_SCOPES.join(","));
  return url.toString();
}

type InstagramTokenResponse = { access_token?: string; user_id?: string | number; expires_in?: number; error_type?: string; error_message?: string };
type InstagramProfileResponse = { id?: string | number; user_id?: string | number; username?: string; account_type?: string; error?: { message?: string; code?: number } };

async function providerJson(response: Response) {
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof data.error_message === "string" ? data.error_message : typeof (data.error as { message?: unknown } | undefined)?.message === "string" ? (data.error as { message: string }).message : "Instagram declined the connection request.";
    throw new Error(message);
  }
  return data;
}

/** Completes Instagram Login entirely on the server; no secret or token reaches the browser. */
export async function completeInstagramLogin(input: { code: string; config: InstagramLoginConfig }) {
  if (!input.config.configured) throw new Error("Instagram test connection is not configured yet.");
  const form = new URLSearchParams({ client_id: input.config.appId, client_secret: input.config.appSecret, grant_type: "authorization_code", redirect_uri: input.config.redirectUri, code: input.code });
  const shortToken = await providerJson(await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form })) as InstagramTokenResponse;
  if (!shortToken.access_token) throw new Error("Instagram did not return a usable connection token.");

  const longTokenUrl = new URL("https://graph.instagram.com/access_token");
  longTokenUrl.searchParams.set("grant_type", "ig_exchange_token");
  longTokenUrl.searchParams.set("client_secret", input.config.appSecret);
  longTokenUrl.searchParams.set("access_token", shortToken.access_token);
  const longToken = await providerJson(await fetch(longTokenUrl)) as InstagramTokenResponse;
  if (!longToken.access_token) throw new Error("Instagram could not extend the test connection.");

  const profileUrl = new URL("https://graph.instagram.com/me");
  profileUrl.searchParams.set("fields", "user_id,username,account_type");
  profileUrl.searchParams.set("access_token", longToken.access_token);
  const profile = await providerJson(await fetch(profileUrl)) as InstagramProfileResponse;
  const externalAccountId = String(profile.user_id ?? profile.id ?? shortToken.user_id ?? "");
  if (!externalAccountId || !profile.username) throw new Error("Instagram did not return the required professional account details.");
  return {
    externalAccountId,
    username: profile.username,
    accountName: profile.username,
    encryptedToken: encryptSocialAccessToken(longToken.access_token, process.env.JWT_SECRET || ""),
    tokenExpiresAt: new Date(Date.now() + Math.max(0, Number(longToken.expires_in || 0)) * 1000),
  };
}

export function publicSocialAccount<T extends { encryptedAccessToken?: string | null }>(account: T) {
  const { encryptedAccessToken: _secret, ...publicAccount } = account;
  return publicAccount;
}
