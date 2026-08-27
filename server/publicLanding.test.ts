import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");

describe("public landing page", () => {
  const landing = readFileSync(resolve(projectRoot, "client/src/components/PublicLanding.tsx"), "utf8");
  const home = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

  it("presents real ViraSquare value and retains the established sign-in entry", () => {
    expect(landing).toContain("Your content, in one clear flow.");
    expect(landing).toContain("One post. A fuller selling package.");
    expect(landing).toContain("Your business should still sound like your business.");
    expect(landing).toContain("Start your content rhythm");
    expect(landing).toContain("onClick={onStart}");
    expect(home).toContain("<PublicLanding onStart={() => startLogin()} />");
  });

  it("uses labelled fictional visual demonstrations instead of ungrounded product or customer claims", () => {
    const demos = readFileSync(resolve(projectRoot, "client/src/components/LandingDemos.tsx"), "utf8");

    expect(landing).toContain("<SavedProductDemo />");
    expect(landing).toContain("<ReadyFlyerDemo />");
    expect(landing).toContain("<ContentFormatPreview kind={content.kind} />");
    expect(demos).toContain("ILLUSTRATIVE SAMPLE");
    expect(demos).toContain("ILLUSTRATIVE FLYER");
    expect(demos).toContain("ILLUSTRATIVE FORMAT");
    expect(demos).toContain("Everyday Glow Oil");
    expect(landing).toContain("<ContentSystemGraphic />");
    expect(landing).toContain("For products you sell, services you offer");
    expect(landing).toContain("<HeroProductTaskCue onStart={onStart} />");
    expect(demos).toContain("MAKE THIS POST");
    expect(landing).toContain("One saved product, three useful content formats.");
    expect(demos).toContain("Understand its purpose");
    expect(demos).toContain("absolute -bottom-4 -right-3 h-12 w-12 rounded-full bg-[#DBEAFE]");
  });

  it("labels illustrative workspace content and does not introduce fake testimonials or analytics claims", () => {
    expect(landing).toContain("EXAMPLE WORKSPACE");
    expect(landing).toContain("Not your data");
    expect(landing).toContain("It is not invented analytics.");
    expect(landing).not.toContain("Trusted by");
    expect(landing).not.toContain("testimonials");
  });

  it("keeps the footer transparent until policy and support pages are accurately available", () => {
    expect(landing).toContain("Public pages are being prepared accurately for launch.");
    expect(landing).toContain("A branded support contact is being prepared for launch.");
    expect(landing).toContain("EXPLORE SERVICES");
  });
});
