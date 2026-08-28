# Instagram Flyer Format and AI Disclosure Review

**Status:** Approval-only assessment. No flyer-generation or publishing behavior has changed through this document.

## What the successful test showed

The owner-authorized test published correctly to Instagram. The generated flyer uses a vertical composition, but the GPT Image 2 request currently asks for a **1024 × 1536** canvas while the design prompt asks for a **4:5** flyer. That conflict makes the result less predictable at the outer edges when Instagram displays it. The uploaded handwritten test screenshot also shows that the upper brand treatment has too little protected space and that the lower price band visually dominates the post.

## Verified Instagram publishing constraints

Meta’s current Instagram Content Publishing documentation requires image media supplied through the API to be JPEG and temporarily reachable through a public HTTPS URL. It identifies `/<IG_ID>/media` for creating a container and `/<IG_ID>/media_publish` for publishing that container. It also documents `is_ai_generated=true` as the way an API publisher can self-disclose AI use. [1]

Meta explains that Instagram’s **AI info** label can appear when Meta detects recognized AI image indicators or when the publisher discloses AI-generated content. [2] Meta’s publishing documentation explicitly permits the `is_ai_generated` parameter for both Instagram Login and Facebook Login API routes. [1]

| Concern | Cause in the successful test | Honest implication |
|---|---|---|
| Upper edge looks crowded | The source request size is 2:3 but the intended design is 4:5; the prompt does not reserve a fixed outer safe area. | Correct the source canvas and add a design safe area before generating, rather than rely on the feed display. |
| Price band feels oversized | GPT Image 2 is asked to lay out all visible text directly and can choose a very heavy price panel. | Add bounded composition rules: protected upper margin, middle product frame, limited lower information panel, and price scale ceiling. |
| Instagram displays “AI content” | The current server truthfully sends `is_ai_generated=true` because this flyer was materially generated with GPT Image 2. Meta may also recognize generator provenance metadata. | Do not disable the disclosure merely to hide the label. |

## Honest implementation options

| Option | What changes | AI label expectation | Effect on the current product promise |
|---|---|---|---|
| **A. Better AI flyer, disclosed** | Generate a strict 4:5 Instagram feed flyer with fixed safe margins and bounded text zones. Retain the current GPT Image 2 quality route. | The label remains for GPT-created or materially AI-edited work. | Preserves the current Default and Stylish generation system, with better feed composition. |
| **B. Original-photo layout, no deliberate AI-generation flag** | ViraSquare assembles the owner’s uploaded original image, verified text, logo, and colours deterministically in a fixed 4:5 template. No AI image edit is requested. | We do not self-disclose AI image generation. Meta may still label any uploaded source that already contains AI provenance. | Adds a trust-first output for owners who want the real photo preserved exactly, but is intentionally more layout-led and less visually transformative. |
| **C. Keep current output** | No generation change. | Label remains for current AI flyers. | Leaves the observed visual inconsistency and does not solve the owner concern. |

## Recommended direction

Use both **A and B**, but give them clear, honest names:

1. **Real Photo Flyer** — a deterministic, strict 4:5 layout using the owner’s original product photo and verified text. The image is not generatively altered. It is the safest choice when exact visual truth matters most.
2. **Enhanced Flyer** — the existing GPT Image 2 route, improved with the strict 4:5 canvas, protected edge margin, and restrained text hierarchy. It remains honestly disclosed as AI-generated or materially AI-edited when published.
3. **Stylish Flyer** — the current disclosed creative option, also upgraded to the new safe-area rules.

This does **not** claim that Meta will never label a Real Photo Flyer: a user-uploaded image that already contains AI provenance may still be labeled by Meta’s systems. It does ensure ViraSquare never falsely reports that a GPT-generated flyer was not AI-generated.

## Proposed safe layout rules

The proposed strict 4:5 design system is **1080 × 1350**. It reserves a minimum 72-pixel outer edge area, keeps the logo/brand name below a 96-pixel top buffer, protects the main product image from overlapping text, confines support copy to two short lines, and keeps the price panel below the product frame with no more than roughly 18% of the image height. This is a source-composition rule, not a guarantee of every possible Instagram display variation.

## Scope boundary before scheduling

Instagram scheduling should stay paused until the owner selects a flyer direction and we prove that newly generated 4:5 output reads correctly in an actual Instagram test post. The successful Publish Now transport is retained and will be used only after the owner approves a new sample.

## References

[1] [Meta for Developers, *Instagram Content Publishing* (updated June 30, 2026)](https://developers.facebook.com/documentation/instagram-platform/content-publishing)

[2] [Meta Transparency Center, *Labeling AI Content* (updated February 19, 2025)](https://transparency.meta.com/governance/tracking-impact/labeling-ai-content/)
