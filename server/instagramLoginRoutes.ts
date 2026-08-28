import type { Express, Request, Response } from "express";
import * as db from "./db";
import { encryptSocialAccessToken, getInstagramLoginConfig } from "./socialPublishing";

function returnToWorkspace(res: Response, redirectUri: string, state: "connected" | "failed") {
  const destination = new URL("/", redirectUri);
  destination.searchParams.set("instagram", state);
  return res.redirect(destination.toString());
}

export function registerInstagramLoginRoutes(app: Express) {
  app.get("/api/social/instagram/callback", async (req: Request, res: Response) => {
    const config = getInstagramLoginConfig();
    if (!config.configured) return res.status(503).send("Instagram connection is not configured.");
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code.replace(/#_$/, "") : "";
    const session = state ? await db.consumeSocialOAuthSession(state) : undefined;
    if (!session || session.platform !== "instagram" || session.redirectUri !== config.redirectUri) return res.status(400).send("This Instagram connection link is no longer valid. Return to ViraSquare and start again.");
    if (!code || req.query.error) return returnToWorkspace(res, config.redirectUri, "failed");
    try {
      const shortForm = new FormData();
      shortForm.set("client_id", config.appId);
      shortForm.set("client_secret", config.appSecret);
      shortForm.set("grant_type", "authorization_code");
      shortForm.set("redirect_uri", config.redirectUri);
      shortForm.set("code", code);
      const shortResponse = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: shortForm });
      const shortBody = await shortResponse.json().catch(() => ({})) as { data?: Array<{ access_token?: string; user_id?: string; permissions?: string }>; access_token?: string; user_id?: string; permissions?: string };
      const shortToken = shortBody.data?.[0]?.access_token || shortBody.access_token;
      const instagramUserId = shortBody.data?.[0]?.user_id || shortBody.user_id;
      const grantedScopes = shortBody.data?.[0]?.permissions || shortBody.permissions || "";
      if (!shortResponse.ok || !shortToken || !instagramUserId) throw new Error("Instagram did not return a usable connection token.");
      const exchangeUrl = new URL("https://graph.instagram.com/access_token");
      exchangeUrl.searchParams.set("grant_type", "ig_exchange_token");
      exchangeUrl.searchParams.set("client_secret", config.appSecret);
      exchangeUrl.searchParams.set("access_token", shortToken);
      const longResponse = await fetch(exchangeUrl);
      const longBody = await longResponse.json().catch(() => ({})) as { access_token?: string; expires_in?: number };
      if (!longResponse.ok || !longBody.access_token) throw new Error("Instagram could not complete the secure connection.");
      const accountResponse = await fetch(`https://graph.instagram.com/v26.0/${encodeURIComponent(instagramUserId)}?fields=user_id,username`, { headers: { Authorization: `Bearer ${longBody.access_token}` } });
      const accountBody = await accountResponse.json().catch(() => ({})) as { user_id?: string; id?: string; username?: string };
      if (!accountResponse.ok) throw new Error("Instagram could not read the connected account.");
      await db.saveConnectedSocialAccount({ userId: session.userId, platform: "instagram", externalAccountId: accountBody.user_id || accountBody.id || instagramUserId, accountName: accountBody.username || "Instagram professional account", username: accountBody.username || null, linkedPageId: null, encryptedAccessToken: encryptSocialAccessToken(longBody.access_token, process.env.JWT_SECRET || ""), tokenExpiresAt: longBody.expires_in ? new Date(Date.now() + longBody.expires_in * 1000) : null, grantedScopes: grantedScopes || null, connectionStatus: "connected", lastErrorCode: null, lastErrorMessage: null, connectedAt: new Date(), disconnectedAt: null });
      return returnToWorkspace(res, config.redirectUri, "connected");
    } catch (error) {
      console.error("[instagram-login] callback failed", error instanceof Error ? error.message : "unknown error");
      return returnToWorkspace(res, config.redirectUri, "failed");
    }
  });
}
