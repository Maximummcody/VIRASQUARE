import { afterEach, describe, expect, it, vi } from "vitest";
import { buildInstagramAuthorizeUrl, canTransitionPublishStatus, decryptSocialAccessToken, encryptSocialAccessToken, getInstagramLoginConfig, GROUP4A_INSTAGRAM_SCOPES, publicSocialAccount } from "./socialPublishing";

describe("Group 4A social publishing safeguards", () => {
  const secret = "a-development-only-secret-with-sufficient-length";

  afterEach(() => vi.unstubAllEnvs());

  it("requires all server-only Instagram Login configuration values before connection can begin", () => {
    vi.stubEnv("META_INSTAGRAM_APP_ID", "test-app-id");
    vi.stubEnv("META_INSTAGRAM_APP_SECRET", "");
    vi.stubEnv("META_INSTAGRAM_REDIRECT_URI", "https://example.com/callback");
    expect(getInstagramLoginConfig().configured).toBe(false);

    vi.stubEnv("META_INSTAGRAM_APP_SECRET", "test-app-secret");
    expect(getInstagramLoginConfig()).toMatchObject({ appId: "test-app-id", redirectUri: "https://example.com/callback", configured: true });
  });

  it("validates the configured Meta app credentials against the official token endpoint without publishing", async () => {
    const appId = process.env.META_INSTAGRAM_APP_ID;
    const appSecret = process.env.META_INSTAGRAM_APP_SECRET;
    if (!appId || !appSecret) return;
    const url = new URL("https://graph.instagram.com/access_token");
    url.searchParams.set("grant_type", "ig_exchange_token");
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("access_token", "virasquare_nonpublishing_credential_check");
    const response = await fetch(url, { redirect: "manual" });
    const body = await response.text();
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(body.toLowerCase()).not.toMatch(/invalid client|invalid app|invalid application|client secret.*invalid/);
  });

  it("encrypts provider credentials before persistence and decrypts them only server-side", () => {
    const encrypted = encryptSocialAccessToken("test-access-token", secret);
    expect(encrypted).not.toContain("test-access-token");
    expect(decryptSocialAccessToken(encrypted, secret)).toBe("test-access-token");
  });

  it("allows only safe publish status transitions", () => {
    expect(canTransitionPublishStatus("awaiting_confirmation", "publishing")).toBe(true);
    expect(canTransitionPublishStatus("publishing", "published")).toBe(true);
    expect(canTransitionPublishStatus("published", "publishing")).toBe(false);
    expect(canTransitionPublishStatus("cancelled", "publishing")).toBe(false);
  });

  it("requests only the Group 4A Instagram Login scopes through a state-bound authorization URL", () => {
    const url = new URL(buildInstagramAuthorizeUrl({ appId: "123", redirectUri: "https://example.com/api/social/instagram/callback", state: "safe-state" }));
    expect(url.origin).toBe("https://www.instagram.com");
    expect(url.searchParams.get("state")).toBe("safe-state");
    expect(url.searchParams.get("scope")).toBe(GROUP4A_INSTAGRAM_SCOPES.join(","));
  });

  it("never serializes the encrypted provider credential to a browser response", () => {
    const safe = publicSocialAccount({ id: 1, username: "testshop", encryptedAccessToken: "v1.secret.value" });
    expect(safe).toEqual({ id: 1, username: "testshop" });
    expect("encryptedAccessToken" in safe).toBe(false);
  });
});
