import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(projectRoot, path), "utf8");

describe("recovered public landing and identity", () => {
  it("restores the approved value-led public landing and established sign-in entry", () => {
    const landing = read("client/src/components/PublicLanding.tsx");
    const home = read("client/src/pages/Home.tsx");
    expect(landing).toContain("From a real business detail to content you can confidently use.");
    expect(landing).toContain("Your real product can stay at the centre.");
    expect(landing).toContain("Make content you can confidently use");
    expect(landing).toContain("Start your content rhythm");
    expect(landing).toContain("NOT YOUR DATA");
    expect(landing).not.toContain("Trusted by");
    expect(home).toContain("<PublicLanding onStart={() => startLogin()} />");
  });

  it("restores the Light Signal mark, official slogan, and approved browser identity", () => {
    const logo = read("client/src/components/ViraSquareLogo.tsx");
    const html = read("client/index.html");
    const manifest = read("client/public/manifest.webmanifest");
    expect(logo).toContain('fill="#0B1220"');
    expect(logo).toContain('fill="#2563EB"');
    expect(logo).toContain(">Vira</span><span className=\"text-[#2563EB]\">Square</span>");
    expect(html).toContain("ViraSquare — Know what to post. Create. Grow.");
    expect(html).toContain("virasquare-signal-v-32");
    expect(manifest).toContain("virasquare-signal-v-192");
    expect(manifest).toContain("virasquare-signal-v-512");
  });
});
