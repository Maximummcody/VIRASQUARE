# Group 4A Instagram Login Decision Record

> **Status:** Owner-approved Group 4A test direction. This record does not authorize publishing to a real customer account.

## Decision

ViraSquare will use Meta's **Instagram API with Instagram Login** for the first Group 4A test connection. The owner created a new unpublished Meta app using the **Manage messaging & content on Instagram** use case. The initial connection is limited to an owner-controlled Instagram Professional test account.

This route does **not** require a Facebook Page to be linked to the Instagram Professional account. It requests only `instagram_business_basic` and `instagram_business_content_publish`, which are the minimum documented permissions for identifying an Instagram professional account and publishing approved content. [1] [2]

## Why this replaces the preliminary Facebook-based route

The original foundation assumed the Facebook Login route because it is needed for future Facebook Page publishing. The app dashboard shows that the owner has created the newer Instagram Login use case instead. Aligning Group 4A with that route lets us test Instagram directly without forcing Page creation now. Facebook Page publishing remains a later, separately approved extension within the same Meta app.

| Capability | Group 4A now | Later, only after approval |
|---|---|---|
| Connect an Instagram Business or Creator account | Yes, owner test account only | Yes, after requirements are met |
| Publish an owner-confirmed image post | Planned test target | Customer-ready after review and launch requirements |
| Instagram scheduling | Data foundation only | Activate only after Publish Now passes real testing |
| Facebook Page publishing | No | Add the Page capability and permissions later |
| Messaging, comments, insights, ads, tagging | No | Out of Group 4A scope |

## Security boundary

The ViraSquare browser never receives an Instagram app secret or a connected account access token. Tokens will be exchanged and extended only from server-side code, then encrypted before storage. Meta explicitly warns that its app secret must not be exposed in client-side code or a client application. [3]

The app remains **unpublished** during testing. ViraSquare will not request broad permissions, add webhooks, send a publish request, or connect a real customer account until a test connection is configured and the owner explicitly confirms the next step.

## Confirmed operating constraints

Instagram image publishing requires a publicly accessible JPEG media URL at the time Meta fetches it. ViraSquare's existing media storage must therefore produce a suitable controlled serving URL before an approved publish attempt. Published content is subject to Instagram's documented API publishing limits; scheduling work will check limits before any future scheduled attempt. [2]

## References

[1]: https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login "Meta: Instagram API with Instagram Login"
[2]: https://developers.facebook.com/documentation/instagram-platform/content-publishing "Meta: Instagram Content Publishing"
[3]: https://developers.facebook.com/documentation/instagram-platform/reference/access_token "Meta: Instagram Access Token"
