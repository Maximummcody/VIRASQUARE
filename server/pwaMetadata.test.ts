import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("ViraSquare home-screen metadata", () => {
  it("defines a standalone Navy web app with the ViraSquare icon sizes", () => {
    const manifest = JSON.parse(readFileSync(resolve(projectRoot, "client/public/manifest.webmanifest"), "utf8"));

    expect(manifest).toMatchObject({
      name: "ViraSquare",
      short_name: "ViraSquare",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#F8FBFF",
      theme_color: "#0B1220",
    });
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192", type: "image/png" }),
      expect.objectContaining({ sizes: "512x512", type: "image/png" }),
    ]));
  });

  it("links the install manifest and iPhone home-screen metadata from the app entry", () => {
    const html = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");

    expect(html).toContain('<meta name="theme-color" content="#0B1220" />');
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(html).toContain('name="apple-mobile-web-app-title" content="ViraSquare"');
    expect(html).toContain('rel="apple-touch-icon" sizes="180x180"');
  });
});
