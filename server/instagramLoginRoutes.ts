import type { Express } from "express";
import * as db from "./db";
import { completeInstagramLogin, getInstagramLoginConfig } from "./socialPublishing";

function resultPage(title: string, message: string, success: boolean) {
  const colour = success ? "#2563EB" : "#B42318";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#F5F7FA;color:#0B1220;font-family:system-ui,sans-serif"><main style="max-width:520px;margin:12vh auto;padding:28px"><div style="background:#fff;border:1px solid #DBEAFE;border-radius:20px;padding:28px;box-shadow:0 18px 40px rgba(11,18,32,.1)"><p style="margin:0;color:${colour};font-size:12px;font-weight:700;letter-spacing:.1em">VIRASQUARE · INSTAGRAM</p><h1 style="margin:12px 0 8px;font-size:28px">${title}</h1><p style="margin:0;line-height:1.6;color:#526174">${message}</p><a href="/" style="display:inline-block;margin-top:22px;border-radius:10px;background:#2563EB;color:#fff;padding:11px 16px;text-decoration:none;font-weight:700">Return to ViraSquare</a></div></main></body></html>`;
}

export function registerInstagramLoginRoutes(app: Express) {
  app.get("/api/social/instagram/callback", async (req, res) => {
    const providerError = typeof req.query.error === "string" ? req.query.error : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (providerError || !code || !state) return res.status(400).type("html").send(resultPage("Instagram was not connected", "The connection was cancelled or Instagram did not send a complete approval response. Nothing was published.", false));
    try {
      const session = await db.consumeSocialOAuthSession(state);
      if (!session || session.platform !== "instagram") return res.status(400).type("html").send(resultPage("Connection link expired", "Please return to ViraSquare and start a new Instagram connection. Nothing was published.", false));
      const config = getInstagramLoginConfig();
      if (!config.configured || session.redirectUri !== config.redirectUri) return res.status(500).type("html").send(resultPage("Instagram setup is incomplete", "The secure test connection settings are not ready yet. Nothing was published.", false));
      const account = await completeInstagramLogin({ code, config });
      await db.saveConnectedSocialAccount({ userId: session.userId, platform: "instagram", externalAccountId: account.externalAccountId, accountName: account.accountName, username: account.username, encryptedAccessToken: account.encryptedToken, tokenExpiresAt: account.tokenExpiresAt, grantedScopes: session.requestedScopes, connectionStatus: "connected", connectedAt: new Date() });
      return res.type("html").send(resultPage("Instagram is connected", `@${account.username} is connected for this ViraSquare test. You will still review and confirm every post before it is published.`, true));
    } catch (error) {
      console.error("[instagram-login] connection completion failed", error instanceof Error ? error.message : "unknown error");
      return res.status(502).type("html").send(resultPage("Instagram could not connect", "The test connection was not completed. Return to ViraSquare and try again after checking the Meta app setup. Nothing was published.", false));
    }
  });
}
