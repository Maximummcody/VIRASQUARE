# Meta Instagram API Reference

This source note records the official Meta documentation consulted on 2026-08-28 while restoring ViraSquare’s owner-confirmed Instagram Professional-account publishing flow.

## Instagram API with Instagram Login

Meta states that the Instagram API with Instagram Login supports **Business and Creator professional accounts**, and that this setup **does not require a Facebook Page** to be linked to the professional account. The current publishing permissions are `instagram_business_basic` and `instagram_business_content_publish`.[1]

## Business Login and Tokens

Meta’s Business Login documentation specifies `https://www.instagram.com/oauth/authorize` for authorization, `https://api.instagram.com/oauth/access_token` to exchange the returned code for a short-lived Instagram user token, and `https://graph.instagram.com/access_token` for the long-lived-token exchange. It requires that the app secret and long-lived-token exchange stay server-side. The direct Login route requests an authorization code with `client_id`, `redirect_uri`, `response_type=code`, `scope`, and a server-generated `state` value.[2]

## Single-image publishing

Meta requires a publicly accessible media URL during a publishing attempt and accepts JPEG images for image posts. The direct Login route uses the `graph.instagram.com` host and first creates a media container at `/<IG_ID>/media`, then publishes it at `/<IG_ID>/media_publish` using the returned container ID. Meta documents a 100 API-published-post limit per Instagram account in a rolling 24-hour period and provides `/<IG_ID>/content_publishing_limit` for checking that usage. Meta also documents `is_ai_generated=true` as the appropriate AI-use disclosure on the media-container request.[3]

## Sources

[1]: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login
[2]: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login
[3]: https://developers.facebook.com/documentation/instagram-platform/content-publishing
