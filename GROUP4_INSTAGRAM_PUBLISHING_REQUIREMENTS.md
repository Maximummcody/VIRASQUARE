# Group 4A Instagram Publish Now Requirements

**Status:** Implementation reference for the owner-only test-account stage. This document does not enable scheduling, Facebook Page publishing, webhooks, or customer-account use.

## Verified Meta Requirements

Meta’s Instagram API with Instagram Login publishes a single image in two server-side steps: create a media container at `/<IG_ID>/media`, then publish it at `/<IG_ID>/media_publish` using the returned container ID. The app user must grant `instagram_business_basic` and `instagram_business_content_publish`.[^meta-publishing]

| Requirement | Group 4A response |
|---|---|
| The image must be cURL-accessible from a public server during the publishing attempt. | ViraSquare will create a short-lived server-side S3 URL only after the owner explicitly confirms Publish now. |
| JPEG is the only supported image format. | ViraSquare will convert its stored flyer to JPEG server-side before giving Meta the short-lived media URL. |
| Container status can be `IN_PROGRESS`, `FINISHED`, `ERROR`, `EXPIRED`, or `PUBLISHED`. | ViraSquare will save the attempt first, show a clear publishing state, and only call `media_publish` after `FINISHED`. |
| Accounts are limited to 100 API-published posts per rolling 24 hours. | Group 4A will pre-check the account’s Meta publishing limit and refuse a publish when the provider reports no remaining capacity. |
| `is_ai_generated` is available for Instagram Login image posts. | ViraSquare will send this disclosure when the ready flyer was produced with the AI image-generation pathway. |

## Product Boundaries

Every publishing attempt remains linked to the owner, connected Instagram Professional account, ViraSquare content item, ready single-post deliverable, one visual slide, caption snapshot, and idempotency key. Browser clients never receive the Instagram access token.

The owner must see the final flyer and caption, then make a separate explicit confirmation. Retrying a failed attempt creates a new owner-confirmed request; ViraSquare never silently retries or schedules a post. A successful API publication records the published Instagram media ID and permalink, then updates the linked content to the already-established posted lifecycle.

## Deferred Until a Separate Approval

Instagram scheduling, background status polling beyond the immediate Publish Now window, webhooks, carousel/video/reel publishing, direct-message/comment tooling, Facebook Page publishing, and production app review are outside Group 4A.

[^meta-publishing]: [Meta, “Instagram API with Instagram Login — Content Publishing,” updated June 30, 2026](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing)
