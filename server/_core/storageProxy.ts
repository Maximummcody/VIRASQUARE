import type { Express } from "express";
import { ENV } from "./env";

function safeAttachmentName(value: string | undefined, fallbackKey: string) {
  const fallback = fallbackKey.split("/").pop() || "virasquare-download";
  const cleaned = (value || fallback).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
  return cleaned || fallback;
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");

      if (req.query.download !== "1") {
        res.redirect(307, url);
        return;
      }

      const fileResponse = await fetch(url);
      if (!fileResponse.ok) {
        res.status(502).send("Stored file could not be downloaded");
        return;
      }

      const filename = safeAttachmentName(typeof req.query.filename === "string" ? req.query.filename : undefined, key);
      const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
      const body = Buffer.from(await fileResponse.arrayBuffer());
      res.set("Content-Type", contentType);
      res.set("Content-Length", String(body.length));
      res.set("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.status(200).send(body);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
