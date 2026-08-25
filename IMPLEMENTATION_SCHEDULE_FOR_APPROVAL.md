# ViraSquare Implementation Schedule for Approval

> **Status:** Discussion and approval document only. No item below is permission to build until the owner approves that numbered group. Every change must preserve existing user content and the current Today-first workflow unless this document explicitly identifies a proposed effect and the owner approves it.

## Agreed technical direction already recorded

ViraSquare will use the existing **server-only OpenAI API account** directly. Luna remains the text and planning model. **GPT Image 2** is the selected future image-model direction for product visuals. There will be no separate image-service intermediary.

## Build order at a glance

| Group | Main outcome | Why it comes at this point | Approval status |
|---:|---|---|---|
| 1 | Trustworthy product-post visuals | Makes saved products visibly worth adding before adding more product features. | Waiting for approval |
| 2 | Product selling package | Turns one product into a useful selling set, not just one image. | Waiting for approval |
| 3 | Business memory and learning | Makes ViraSquare improve from the owner’s real business and feedback. | Waiting for approval |
| 4 | Instagram/Facebook review, publishing, and scheduling | Makes Calendar useful from planning through posting. | Waiting for approval |
| 5 | Campaigns and customer-question content | Adds high-value selling workflows after the core publishing flow is stable. | Waiting for approval |
| 6 | Later platform and workspace expansion | Extends reach and reuse without weakening the first-market focus. | Waiting for approval |

---

## Group 1 — Trustworthy product-post visuals

| # | Build item | What the owner receives | Effect on current ViraSquare workflow | Approval gate |
|---:|---|---|---|---|
| 1 | Direct GPT Image 2 server route | Product-image requests use the owner’s existing OpenAI account through ViraSquare’s secure server. | Adds a new product-visual capability; does not alter educational-card generation. | Approve before any product photo is sent to the image endpoint. |
| 2 | **Generate product-post card** default | A single ready-to-post product card based on the saved product, uploaded image, price/ask-for-price, and brand identity. | Product-led content gains a new visual output; educational content stays product-free. | Approve default final-card direction. |
| 3 | Product-truth safety check and fallback | The image must retain the real product; otherwise ViraSquare uses the original uploaded image in the controlled layout. | Protects trust and prevents a failed AI result from replacing a product. | Approve the fallback behaviour. |
| 4 | **Stylish generation** option | An optional more creative product visual with a clear explanation that background, lighting, crop, and small details may change. | Adds a choice before generation; no user is forced into it. | Approve exact warning text and placement. |
| 5 | Product creative directions | Plain-language options such as Clean product spotlight, Show the details, Occasion/use-case, and Stylish campaign visual. | Adds limited helpful choice, not a prompt editor or many confusing styles. | Approve the initial directions and category rules. |
| 6 | Controlled product-card layout | ViraSquare places exact brand, price, product name, Instagram, and call to action around the GPT Image 2 visual. | Reduces AI-flyer risk and prevents incorrect factual text in the final card. | Approve the final visual system after seeing samples. |

### Group 1 dependencies

- OpenAI organisation access for GPT Image 2 must be ready.
- The OpenAI key remains server-only and is never exposed to users.
- Product image, saved product facts, and brand details remain the source of truth.

---

## Group 2 — Product selling package

| # | Build item | What the owner receives | Effect on current ViraSquare workflow | Approval gate |
|---:|---|---|---|---|
| 7 | Matching product caption | A caption based only on saved product and business facts. | Appears alongside the product card; does not replace existing captions. | Approve output format. |
| 8 | Customer reply | A short WhatsApp/Instagram reply for likely buyer questions about the product. | New optional selling aid; it does not send messages automatically. | Approve tone and safe-claim rules. |
| 9 | Next product angle | One new truthful way to talk about the same product later. | Helps the owner continue content without changing their existing calendar plan automatically. | Approve where it appears. |
| 10 | Package review screen | One place to review the visual, caption, reply, and next angle. | Adds a review step after product generation; existing content remains untouched. | Approve the final review flow. |

---

## Group 3 — Business memory and learning

| # | Build item | What the owner receives | Effect on current ViraSquare workflow | Approval gate |
|---:|---|---|---|---|
| 11 | Stronger business memory | Better use of saved business context, product facts, brand identity, past content, and recent plan. | Improves suggestions but must not overwrite profile information or posted content. | Approve what data may influence recommendations. |
| 12 | Next-best action | A calm, useful next action based on the owner’s current situation. | Could change what is highlighted on Today; the existing Today-first workflow must remain intact. | Review a screen example before build. |
| 13 | “What worked?” prompt | Optional owner feedback: messages, orders, profile visits, or nothing yet. | Adds one small post-completion question; no fake analytics and no forced answer. | Approve wording and timing. |
| 14 | Feedback-informed suggestions | Future ideas use only owner-confirmed outcomes. | Suggestions may become more personal, but no existing plan or post is changed automatically. | Approve learning rules. |

---

## Group 4 — Instagram/Facebook review, publishing, and Calendar scheduling

| # | Build item | What the owner receives | Effect on current ViraSquare workflow | Approval gate |
|---:|---|---|---|---|
| 15 | Meta account connection | A secure way to connect an Instagram professional account and/or Facebook Page. | Adds account connection settings; never asks users for social passwords. | Approve first-platform scope and connection wording. |
| 16 | Publish now | Owner reviews an approved post then publishes it to selected connected channels. | Adds a new action only after review; no automatic posting. | Approve final confirmation screen. |
| 17 | Schedule from Calendar | Owner selects platform, date, time, and time zone for an approved post. | Adds scheduling to the existing Calendar, but does not restore manual “Add a post” generation inside Calendar. | Approve Calendar schedule interaction. |
| 18 | Scheduled-post status | Calendar shows Scheduled, Published, Failed, or Cancelled with clear recovery actions. | Extends existing lifecycle status; it does not claim success unless the platform confirms it. | Approve status wording. |
| 19 | Edit, cancel, and retry | Owner can change time, cancel before publishing, or retry a recoverable failure. | Preserves owner control and avoids irreversible posting. | Approve safeguards. |
| 20 | Meta app readiness | Privacy page, Terms page, permission explanation, secure token storage, webhook handling, and app review preparation. | Operational setup required before public publishing works. | Approve when implementation begins. |

### Group 4 dependencies

- Users need a professional Instagram account and a connected Facebook Page.
- ViraSquare needs Meta app approval for normal public use.
- Scheduled posts need a durable background publishing service; it must run even while the owner is offline.

---

## Group 5 — Campaigns and customer-question content

| # | Build item | What the owner receives | Effect on current ViraSquare workflow | Approval gate |
|---:|---|---|---|---|
| 21 | New-product launch campaign | A short, purposeful plan for a new item. | Adds an intentional campaign choice; it must not overwrite an existing weekly plan without owner confirmation. | Approve campaign length and Calendar effect. |
| 22 | Restock campaign | A short plan to bring attention back to a restocked item. | Same safeguard: owner chooses whether to add it to the Calendar. | Approve campaign flow. |
| 23 | Seasonal / special-offer campaign | A short plan for an owner-confirmed seasonal focus or offer. | Must use only owner-confirmed availability and prices. | Approve allowed offer facts. |
| 24 | Customer question input | A place to add a real question a customer asked. | New optional input; no automatic access to customer messages. | Approve data/privacy wording. |
| 25 | Customer question to reply | A truthful reply based on saved business and product facts. | Does not send a message automatically. | Approve reply style. |
| 26 | Customer question to content | An educational post idea and, when appropriate, a product angle based on the real question. | Product facts are used only if the owner intentionally chooses product-led content. | Approve output paths. |

---

## Group 6 — Later platform and workspace expansion

| # | Build item | What the owner receives | Effect on current ViraSquare workflow | Approval gate |
|---:|---|---|---|---|
| 27 | TikTok adaptation | A TikTok photo-post or video-script version of approved content. | Adds a later platform path after Instagram/Facebook is proven. | Approve only after Group 4 succeeds. |
| 28 | TikTok publishing | Direct TikTok publishing, subject to platform review and policy requirements. | Adds another account connection and status path. | Separate approval required. |
| 29 | Pinterest adaptation and publishing | Discovery-focused product Pins from approved content. | Adds a later account connection and platform-specific output. | Separate approval required. |
| 30 | WhatsApp customer-support delivery | Ready customer replies and owner-approved sharing/order support. | Does not promise public WhatsApp Status posting. | Approve exact scope later. |
| 31 | LinkedIn consideration | A possible future path for service businesses. | Outside the first-market priority. | Discuss only if expansion needs it. |
| 32 | Library refinement | Better finding, reopening, reusing, and adapting past content. | Improves the existing Library without replacing saved posts. | Approve when core paid path is proven. |
| 33 | ViraSquare support channels | Owner support when real-user volume requires it. | Operations feature, not current product value. | Revisit near real-user launch. |
| 34 | Complete signed-in user testing | Full desktop/mobile test of onboarding, products, generation, visuals, lifecycle, and later publishing flows. | Validation only; it changes no user content. | Run before a wider launch. |

---

## Mandatory workflow safeguard

For **every** numbered item above, ViraSquare must stop and ask before any change that would do one of the following:

1. Change the existing Today-first or ViraSquare-led Calendar workflow.
2. Replace, alter, delete, publish, or schedule existing owner content without a fresh owner action.
3. Make a product image less truthful, make an unsupported claim, or send a product image to an image model without the agreed rule.
4. Add a new external cost, require a new account connection, or change what customer data is stored.
5. Introduce a new automated action that happens while the owner is offline.

## Recommended approval sequence

The recommended order is **Group 1 → Group 2 → Group 4 → Group 3 → Group 5 → Group 6**. This first proves the product-post value, then makes it sellable and publishable, then makes it progressively smarter.

When ready, the owner may approve a whole group, individual item numbers, or request a change to any item before implementation begins.
