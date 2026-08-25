# Social Publishing and Image-Model Research

This research supports discussion only. It does not approve or implement integrations.

## Direct Publishing and Scheduling

| Platform | Current official capability | Practical implication for ViraSquare |
|---|---|---|
| Instagram | The Instagram Platform can publish single images, videos, reels, Stories, and carousels for professional accounts. Publishing needs an Instagram business or creator account, user authorization, relevant permissions, publicly accessible media, and account-level rate-limit handling. The API supports an AI-content disclosure parameter. | Strong first publishing candidate for ViraSquare’s initial audience. Begin with an explicit owner review and “Publish now” action; calendar scheduling can follow after reliable publishing exists. |
| Facebook Pages | The Pages API can publish text, links, photos, and videos. It can schedule Page posts 10 minutes to 30 days ahead using a scheduled publishing time. The user needs a Page token and sufficient Page tasks/permissions. | Best first scheduling candidate because native scheduled publishing is supported. Useful as an optional companion for users with Pages. |
| TikTok | The Content Posting API can direct-post videos and photos to authorized creators. It needs an approved `video.publish` scope, user authorization, a registered app, and client audit before public visibility for production use. Photos must be hosted at a verified domain or verified URL prefix. | Valuable for later visual-first sellers, but greater approval and media-format complexity. Not a first direct-publishing build. |
| LinkedIn | Posts API supports organic text, images, video, documents, and multi-image posts for an authorized member or organization. Permissions differ for member and organization publishing. | Suitable later for service businesses and professional founders; not core to the initial fashion/accessories/beauty audience. |
| Pinterest | The Pinterest API can create image and video Pins on behalf of an authenticated user. It supports boards, descriptions, links, product tagging, analytics, and an AI disclosure field. | A strong later fit for fashion, accessories, beauty, and evergreen product discovery. It is a better expansion candidate than LinkedIn for ViraSquare’s first audience. |
| WhatsApp | The WhatsApp Business Platform is for customer messaging, not publishing public feed or Status content. It supports rich-media messages, interactive messages, approved templates, and delivery/read events. | Do not promise direct WhatsApp Status publishing. Instead, later use it for owner-approved product replies, order updates, and opt-in follow-up messages. |

Meta supports Instagram webhook subscriptions for events such as comments, mentions, stories, and messages, but webhook use requires a live Meta app, business verification, an HTTPS endpoint, and server-side validation. A future insight loop can use this only after the product has a clear owner-approved purpose for each signal.

## Image Model Options for Real Product Photos

| Provider / model | Evidence-based strengths | Published starting cost | Initial ViraSquare view |
|---|---|---:|---|
| OpenAI GPT Image 2 | Proven in ViraSquare testing with an owner-like product-photo reference. Image generation and edits accept real images. | Refer to current OpenAI image pricing. | Safe baseline because the text provider is already in place and the reference-photo workflow has been tested. |
| Google Gemini 3.1 Flash Image (Nano Banana 2) | Accepts image editing and multiple references; designed for consistent reference processing and text rendering. Supports up to 10 object references. | Roughly $0.067 for a 1K paid-tier image output; batch equivalent is roughly $0.034, plus small input charges. | Best controlled challenger to test against GPT Image 2 for reference fidelity, text, and commercial product layouts. |
| xAI Grok Imagine Image 2.0 | Supports real-image editing, 1K/2K output, base64 results, and temporary URLs. | $0.01 input image plus output from $0.04. | Cost-competitive challenger. Must be tested for product fidelity and brand/text reliability before use. |
| Black Forest Labs FLUX.2 | API image editing with high-volume and typography-oriented variants. | Image editing from $0.014 (Klein), $0.045 (Pro), $0.05 (Flex), $0.07 (Max). | Potential later cost/quality option, but it should be benchmarked on real product images before any customer-facing use. |

## Proposed Fair Benchmark

Before selecting an image model, run the same owner-provided product image, same fictional product facts, same brand logo/name/Instagram direction, and same 4:5 single-post prompt through the selected candidates. Score only these practical criteria:

1. The physical product remains recognisable and unaltered.
2. Brand and price fields remain correct after ViraSquare adds its final controlled layout.
3. The output looks commercially useful on a phone screen.
4. The image renders reliably and within an acceptable time.
5. The cost is low enough for a paid plan.

The image model must create or enhance the visual treatment. ViraSquare should continue to place factual text, price, logo, and Instagram in its own deterministic final layout.

## Provider Setup Notes

| Provider | What the owner needs to do before a real API benchmark |
|---|---|
| OpenAI GPT Image 2 | Complete OpenAI organization verification if requested. The existing server-only OpenAI key can then call the image endpoint. |
| Google Gemini / Nano Banana 2 | Open Google AI Studio, create or import a Google Cloud project, set up billing for the Paid Tier, create an auth API key, and provide it securely only when a benchmark is approved. Paid Tier requests are not used to improve Google products. |
| xAI Grok Imagine | Create an xAI Console account, enable billing, and create a server-only API key. |
| FLUX.2 | Create a BFL dashboard account, add credits, create a project API key, and provide it securely only when a benchmark is approved. |

## Sources

1. Meta Instagram Content Publishing: https://developers.facebook.com/documentation/instagram-platform/content-publishing
2. Meta Instagram Webhooks: https://developers.facebook.com/documentation/instagram-platform/webhooks
3. Meta Facebook Pages Posts: https://developers.facebook.com/documentation/pages-api/posts
4. TikTok Content Posting API: https://developers.tiktok.com/doc/content-posting-api-get-started
5. LinkedIn Posts API: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-08
6. Google Gemini Image Generation: https://ai.google.dev/gemini-api/docs/image-generation
7. Google Gemini Pricing: https://ai.google.dev/gemini-api/docs/pricing
8. xAI Image Generation: https://docs.x.ai/developers/model-capabilities/images/generation
9. xAI Image Editing: https://docs.x.ai/developers/model-capabilities/images/editing
10. xAI API Pricing: https://x.ai/api
11. Black Forest Labs Pricing: https://docs.bfl.ml/quick_start/pricing
