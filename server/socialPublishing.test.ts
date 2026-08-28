import { describe, expect, it } from "vitest";
import { buildInstagramAuthorizeUrl, canTransitionPublishStatus, decryptSocialAccessToken, encryptSocialAccessToken, GROUP4A_INSTAGRAM_SCOPES, publicSocialAccount } from "./socialPublishing";

describe("Group 4A social publishing safeguards", () => {
  const secret = "a-development-only-secret-with-sufficient-length";

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

  it("requests only the Group 4A Instagram scopes through a state-bound authorization URL", () => {
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
