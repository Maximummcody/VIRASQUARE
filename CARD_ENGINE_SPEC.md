# ViraSquare Card Engine Specification

## Product promise

ViraSquare’s default visual output is a complete, ready-to-post branded card set. It must remain useful even when no external AI image service is available. Real product media is used when commercial accuracy matters; all other value comes from strong copy structure, editorial hierarchy, consistent brand styling, and clear next steps.

## Card-set contract

Every carousel is rendered locally as four to six cards at a 4:5 aspect ratio. Every card includes an **eyebrow**, a **headline**, a **structured body**, and a **purposeful footer**. A card never exists merely as a short headline on a flat background.

| Card type | Job | Required structure |
|---|---|---|
| `cover` | Earn attention and frame the promise | Eyebrow, strong headline, short value promise, brand mark. |
| `guide` | Teach one useful idea | Headline, short context paragraph, three focused points, takeaway. |
| `checklist` | Make an action easy to follow | Headline, three to five checked actions, closing prompt. |
| `comparison` | Help a customer choose | Headline, two labelled positions or examples, practical conclusion. |
| `faq` | Reduce uncertainty and build trust | Customer question, concise accurate answer, gentle next step. |
| `product` | Present a real product truthfully | Real product image, verified name, price/details, one reason to care, CTA. |
| `closing` | Turn value into an action | Summary or invitation, relevant CTA, brand information. |

## Content lifecycle

The lifecycle must show customer behaviour without pretending that ViraSquare knows off-platform results.

| Status | Meaning | Recorded evidence |
|---|---|---|
| `planned` | Idea exists in a daily or calendar plan. | Content item created. |
| `generated` | Copy or a card set has been created. | Generation timestamp and activity event. |
| `reviewed` | User has opened the content/card set for review. | Review activity event. |
| `downloaded` | User downloaded a slide or full export. | Download activity event. |
| `posted` | User explicitly confirms they posted it. | User action and posted timestamp. |
| `feedback` | User records a self-reported outcome. | Outcome category and optional note. |
| `archived` | User has intentionally set it aside. | Archive action. |

The product may show **usefulness signals** such as most-used format, most-posted content pillar, downloaded versus posted rate, and self-reported outcomes. It must not claim social reach, sales, or engagement without a connected platform or explicit user report.

## MVP information architecture

The signed-in workspace is organised around **Today**, **Calendar**, **My Products**, **Library**, and **Brand**. These are destinations, not hidden modal features.

| Destination | MVP responsibility |
|---|---|
| Today | Daily recommendation, current status, quick creation, and the next useful action. |
| Calendar | Week and month planning, rescheduling, content status, and history. |
| My Products | Product cards, cover image, gallery, verified facts, edit/delete, and use-in-content actions. |
| Library | Generated posts, card sets, exports, status filters, and reuse. |
| Brand | Business profile, logo, colours, voice, default CTA, and visual preferences. |

## Explicit non-goals for this slice

The Card Engine does not rely on external AI scene generation. Social publishing, platform analytics, paid campaign measurement, advanced image editing, and complex video production remain future capabilities.
