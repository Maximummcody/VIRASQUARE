# Group 4 — Secure Social Publishing and Scheduling

## The outcome we are building toward

Group 4 would let a ViraSquare customer connect their own Instagram professional account and, later, their own Facebook Page. From a piece of content they have already reviewed, the customer can either publish immediately or choose a specific time from the existing Calendar.

> **Nothing publishes on its own.** A customer must choose the exact content, destination, and time, then explicitly confirm **Publish now** or **Schedule post**.

The existing Download, Library, Calendar, product archive, correction, and optional feedback flows stay in place. Publishing becomes an additional final step after a person has reviewed their content; it does not replace download or force posting.

## What starts where

| Group 4 step | Customer-facing value | Supported scope | What stays out of scope at first |
| --- | --- | --- | --- |
| **4.1 Connect** | A customer links their own account from a clear “Social accounts” setting. | Instagram professional account. | Personal accounts, passwords, ad management, inbox management. |
| **4.2 Publish now** | A customer sends one reviewed, ready-to-post visual and its caption to their own Instagram feed. | Existing single-image flyer and caption. | Draft auto-publishing, unreviewed content, disappearing Stories, video/Reels. |
| **4.3 Schedule from Calendar** | A customer selects date, time, and time zone, then confirms a scheduled Instagram post. | One confirmed ViraSquare record per scheduled post, clear status and cancel option. | ViraSquare inventing or shifting dates, hidden repeat schedules. |
| **4.4 Facebook Page publishing** | A customer can also connect their own Facebook Page and publish or schedule the same ready content. | Image post with caption; native Page scheduling where appropriate. | Publishing to personal Facebook profiles. |
| **4.5 Reliable status and recovery** | A customer sees Scheduled, Publishing, Posted, Needs reconnection, or Failed—with a useful next action. | Clear retry after a failure, disconnect option, activity history. | Pretending a post succeeded when Meta has not confirmed it. |

## First release: start with one simple, strong action

The best first public release is **Instagram professional account + one reviewed image post + caption + Publish now**. It directly proves the product value, is testable with a real owner account, and gives ViraSquare a solid connection and permission foundation before automatic-at-a-chosen-time scheduling is added.

The next release adds **Schedule for a chosen time** inside the Calendar. The third adds Facebook Page publishing. This sequence prevents a customer from losing trust because a complicated schedule, carousel, or cross-post edge case failed before the simple path is proven.

## Scheduling approaches to decide between

| Approach | What customers experience | Trade-offs | Cost | Setup complexity |
| --- | --- | --- | --- | --- |
| **A. Publish-now first** | Review content, choose Instagram, press Publish now, and see the confirmed result. | No Calendar scheduling in the first release; quickest way to test real publishing. | No new background scheduling cost. | Lower. |
| **B. Full confirmed Calendar scheduling** | Review content, choose Instagram, choose a date and local time, then confirm Schedule post. ViraSquare publishes at that chosen time and records the result. | More value, but needs robust background execution, cancellation, retries, time-zone display, and a clear failure state. | Managed background calls run only for posts users schedule. | Higher. |
| **C. Facebook-native scheduling only** | Facebook Pages can schedule a post directly within Meta’s allowed window. | Does not create one consistent Calendar experience, and does not solve Instagram scheduling. | No ViraSquare scheduler for that one destination. | Medium, but inconsistent. |

Approach **A** is the lighter test path. Approach **B** is the complete Group 4 direction ViraSquare should ultimately provide. The owner should choose whether to prove direct Instagram publishing first or approve the full build after Meta preparation is complete.

## How the full confirmed Calendar scheduling would work

1. A customer opens an existing ready-to-post item and chooses **Publish** or **Schedule**.
2. They choose their connected Instagram account, local date, local time, and an optional Facebook Page only if they connected one.
3. ViraSquare shows a final confirmation: the visual thumbnail, caption, destinations, and exact local time. The customer must press **Schedule post**.
4. The schedule is stored as a ViraSquare publishing record tied to that content item. A durable background job is created only for that confirmed record.
5. At the selected time, ViraSquare obtains a short-lived, publicly fetchable publishing URL for the exact final image, creates the Meta media container, requests publication, and records the real response.
6. The Library and Calendar show one of: **Scheduled**, **Publishing**, **Posted**, **Failed**, or **Needs reconnection**. A customer can cancel before publication; a failure never silently retries into an unexpected post.

The background handler must be idempotent: a platform retry cannot create a duplicate social post. It must identify the planned post through its durable job identifier, not a request-body value. It must never use in-process timers, because those do not survive normal service scaling.

## Meta requirements and limits that shape the plan

Meta’s current Instagram content-publishing documentation supports Instagram professional accounts and uses a two-step media-container and publish process. It requires media at a publicly accessible URL during the publishing attempt, and supports a rate-limit check. Instagram also has a 100 API-published-post limit within a moving 24-hour period; ViraSquare must enforce that guard before accepting a schedule.[1]

For the first release, ViraSquare should support **JPEG single-image feed posts** only. This matches the current product flyer output and avoids adding video, Reels, Story, and carousel complexity before direct posting is dependable. A later release can add existing educational carousels after their media packaging, aspect-ratio constraints, and confirmation experience are separately tested.

For Facebook Page publishing, Meta currently requires Page permissions including `pages_manage_posts`, `pages_read_engagement`, `pages_manage_engagement`, and the appropriate Page task. Its API allows a Page post to be scheduled 10 minutes to 30 days in advance.[2]

Meta states that an app requesting data it does not own or manage may require App Review; Advanced Access requires business verification. It also warns that requesting permissions that are not necessary is a common reason for App Review rejection.[3] Group 4 should request only the permissions needed for the approved release.

Meta webhooks are real-time HTTPS callbacks and must have a valid public TLS certificate. They are useful for relevant Page and Instagram events, but ViraSquare will not rely on them as the only proof of a post publishing successfully. We will record the direct publishing response and, when needed, query the documented container status.[1] [4]

When ViraSquare publishes an AI-generated visual, it will provide Meta’s supported AI-content self-disclosure parameter where required by the chosen Meta endpoint and product policy. We will not add that label to a customer-uploaded photo that has not been AI-generated by ViraSquare.

## Protection and failure rules

| Risk | ViraSquare rule |
| --- | --- |
| A customer accidentally posts | No default destination; review screen and explicit final confirmation; Schedule and Publish actions are separate. |
| A connection expires or loses permission | Show **Needs reconnection**; do not attempt a post without a valid connection. |
| A scheduled time passes during a failure | Mark **Failed** with the reason and offer **Retry now** or **Choose a new time**. Never send it later without the customer deciding. |
| Meta retries a request or ViraSquare receives a duplicate trigger | Use one durable publishing record and idempotency checks so the same confirmed schedule cannot post twice. |
| Token exposure | Store provider tokens encrypted at rest, server-side only; never send them to the browser, logs, exports, or client-side code. |
| Media access | Generate a narrow, short-lived publishing URL for the exact approved asset when it is needed. Do not make a customer’s whole media library public. |
| AI disclosure | Track the visual origin and use the provider’s supported disclosure field only when the content was actually AI-generated or AI-edited by ViraSquare. |
| Misleading success | Show **Posted** only after Meta returns a confirmed publication identifier. |

## What the owner needs to prepare

The owner does not need to give ViraSquare a personal Instagram password. The customer will connect their own account using Meta’s permission screen.

| Preparation | Why it is needed | When it is needed |
| --- | --- | --- |
| A Meta developer account and a new ViraSquare Meta app | Creates the official integration identity. | Before development connection testing. |
| One test Instagram Professional account | Lets us safely test with a real publishing destination before any customer sees it. | Before 4.2 testing. |
| A Facebook Page connected to that test Instagram account | Recommended for broad Meta testing and needed for the Facebook Page part of Group 4. | Before Facebook testing; some Instagram paths require Page authorization. |
| ViraSquare custom domain | Provides credible app URLs, callback URLs, and an HTTPS webhook destination. | Before production Meta review and customer launch. |
| Branded support email | Required for reliable support and expected in public trust material. | Before App Review. |
| Accurate Privacy Policy, Terms, data-deletion instructions, and support page | Meta review and customer trust require clear explanations of account connections, stored tokens, publishing activity, and deletion choices. | Before App Review and live customer connections. |
| Business verification and App Review materials | Meta requires these for the needed Advanced Access and public customer use. A short screen recording should show Connect → Review → Publish of the exact approved ViraSquare flow. | Before live customer rollout. |

## Approval gates

No Group 4 code should be written until the owner chooses the delivery approach above. Before live customer publishing, the owner must separately approve the final public privacy, terms, data-deletion, and support text as accurate for the finished behaviour. Before any content is published on someone’s behalf, the customer must provide a connection and give an explicit per-post confirmation.

## Current readiness

The present generic Instagram integration available in the workspace is disabled and is not suitable for building a multi-customer ViraSquare product connection. No Meta, Instagram, or Facebook credentials have been enabled for this project. The existing product is ready to provide reviewed visuals, captions, Library records, Calendar context, secure server-side storage, and an established durable scheduling pattern. Group 4 will add the externally connected publishing layer on top of those approved foundations.

## Sources

[1]: https://developers.facebook.com/documentation/instagram-platform/content-publishing "Meta for Developers — Instagram Content Publishing"
[2]: https://developers.facebook.com/documentation/pages-api/posts "Meta for Developers — Facebook Pages API Posts"
[3]: https://developers.facebook.com/docs/permissions/ "Meta for Developers — Permissions Reference"
[4]: https://developers.facebook.com/documentation/instagram-platform/webhooks "Meta for Developers — Instagram Webhooks"
[5]: https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages/ "Meta for Developers — Webhooks for Pages"
