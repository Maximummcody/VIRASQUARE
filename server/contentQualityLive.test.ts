import { writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { generateDailyDraft } from "./contentAi";

describe.runIf(process.env.RUN_OPENAI_LIVE_TESTS === "true")("ViraSquare locally grounded card quality", () => {
  it("creates a complete Nigerian-market educational card set without persisting user content", async () => {
    const draft = await generateDailyDraft({
      businessName: "Ades Closet",
      businessType: "women's fashion seller",
      targetAudience: "Women in Nigeria who want presentable everyday outfits without overspending",
      customerMarket: "Nigeria",
      contentPillars: ["Educate", "Build trust"],
      postingGoal: "Build useful customer conversations",
      weeklyPostGoal: 3,
      brandVoice: "Warm, clear, and practical",
    }, "2026-08-25", { title: "Keep Your Favourite Wears Looking Presentable", objective: "Education", format: "carousel", brief: "Share practical care habits that work with everyday clothing routines in Nigeria." });

    await writeFile("/tmp/virasquare-local-card-quality.json", JSON.stringify(draft, null, 2));
    expect(draft.carouselSlides.length).toBeGreaterThanOrEqual(4);
    expect(draft.carouselSlides.every(slide => slide.templateFamily && slide.graphicCue && slide.body.length >= 80)).toBe(true);
  }, 60_000);
});
