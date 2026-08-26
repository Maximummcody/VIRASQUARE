# Daily Brief: Today Screen Specification for Approval

> **Status:** Discussion and approval only. This document does not authorize implementation. The Daily Brief must use only owner-confirmed ViraSquare data and must not claim reach, orders, sales, or social-platform results.

## Purpose

Today should be ViraSquare’s daily command centre, not only a weekly plan display. Within a few seconds, an owner should understand their current content rhythm, the one useful action available now, and the alternative available if the planned post is not right for the day.

The screen should remain composed rather than dashboard-like. It must guide a small business owner toward an action without replacing the Today-first workflow, automatically changing their plan, or implying business performance ViraSquare cannot verify.

## Exact hierarchy

| Order | Area | Job | Data used |
|---:|---|---|---|
| 1 | **Daily Brief header** | Establish the date and the owner’s current content context. | Current date and saved weekly plan. |
| 2 | **Weekly momentum** | Show calm factual progress toward the owner’s weekly posting goal. | Completed posts this week and `weeklyPostGoal`. |
| 3 | **Today’s move** | Make the one best action prominent and immediately actionable. | Today’s planned item, its status, caption readiness, and product requirement. |
| 4 | **Choose your path** | Offer a clear alternative without competing with the primary action. | Existing alternative-idea flow. |
| 5 | **This week at a glance** | Show the remaining plan as supporting context. | Existing weekly rhythm items. |
| 6 | **Calm reflection** | Reinforce real consistency, not invented analytics. | Owner-confirmed completed-post count for this week. |

## Weekly momentum

The top of the Daily Brief should say **Weekly momentum**, followed by a truthful count such as **“2 of 4 planned posts completed.”** A quiet horizontal progress bar or four small markers should represent the weekly goal. The copy should encourage momentum rather than grade the owner.

| Weekly state | Primary copy | Supporting copy |
|---|---|---|
| No completed posts yet | **Your week is ready to begin** | Start with today’s move when you are ready. |
| Some posts completed | **2 of 4 planned posts completed** | Your plan is moving forward at your pace. |
| Weekly goal reached | **This week’s rhythm is complete** | You can still create something extra if it serves your business. |
| No active plan | **Set your weekly rhythm** | Prepare a focused week so ViraSquare can guide your next move. |

The initial version should not show a score, streak, reach, likes, profile visits, orders, or sales. Those would either feel judgmental or require data ViraSquare does not yet have. A separate saved-draft count can be considered later only if the home query is deliberately expanded; it is not needed for the first Daily Brief.

## Today’s move: exact states and actions

| Situation | Main heading | Supporting copy | Primary action | Secondary action |
|---|---|---|---|---|
| No active weekly plan | **Build your first content week** | Answer a few focused questions and ViraSquare will map a practical posting rhythm. | **Prepare my week** | Make something different |
| Today has a planned post without a ready caption | **Your next post is ready to shape** | ViraSquare has a direction for today. Open it to create and review the post. | **Create today’s post** | Make something different |
| Today has a product-led post needing preparation | **Prepare today’s product post** | Add or confirm the real product details needed for this content. | **Prepare product** | Make something different |
| Today’s post is ready to use | **Your post is ready to review** | Check the visual, caption, and selling details before you share it. | **Open ready post** | Make something different |
| Today’s post is marked completed | **Today is done** | Your planned post has been recorded. Keep your rhythm going when the next move is right. | **View this week** | Make something different |
| Intentional rest day in an active plan | **Today is a rest day** | Your plan left today clear. You can rest or create something extra by choice. | **View this week** | Make something different |

The primary action opens existing ViraSquare experiences. It does not create, post, schedule, or alter content automatically. **Make something different** remains the only optional alternative path and opens the existing Today idea flow.

## First-visit activation

For a new owner with no active plan, the current passive “Finding your focus” state should be replaced with an activation-oriented Daily Brief. The screen should make ViraSquare’s first promise concrete: a practical content week and a clear first action, not an empty dashboard.

> **Build your first content week**  
> Tell ViraSquare a little about your business, then get a realistic plan and the first post to work on.  
> **Prepare my week**

The owner can still use **Make something different** if they want an immediate idea instead of a full plan.

## Supporting weekly context and reflection

The current weekly rhythm stays, but moves below the Daily Brief decision area. On mobile, retain the current compact first two visible days with the Calendar entry point; on desktop, retain the full weekly board. It must remain supporting context, not the first large block competing with today’s action.

At the bottom, one short factual reflection should be used only when useful:

| Condition | Reflection copy |
|---|---|
| At least one completed post this week | **You have completed 2 planned posts this week.** |
| No completed post, but an active plan exists | **Your next planned move is ready when you are.** |
| No active plan | No reflection block; the activation action is enough. |

## Explicit exclusions

This first Daily Brief should **not** add a generic dashboard, fake social analytics, new publishing controls, new product-generation modes, a feed of past content, or more than two action choices. It should not displace Calendar, Library, product review, or the current separate educational-carousel flow.

## Approval decision

Approval is requested for the following limited change package only:

1. Replace the current passive Today hero hierarchy with the Daily Brief sequence above.
2. Add the truthful Weekly momentum display based on weekly completed posts and the saved posting goal.
3. Add the state-specific Today’s move action and copy, reusing existing ViraSquare routes.
4. Keep **Make something different** as the one secondary path.
5. Move weekly rhythm below the decision area and add a short factual reflection when appropriate.

No Group 3 learning, social analytics, publishing, scheduling, or colour-system changes are included in this proposal.

## Implementation validation notes

The implemented Daily Brief was reviewed at a 375 px mobile viewport and a 1280 px desktop viewport. On mobile, the Daily Brief stacks into a clear action-first sequence above the two-day weekly preview and the existing alternative-idea flow. On desktop, the action and Weekly Momentum form a composed two-column decision area above the existing seven-day weekly board.

The validated rest-day state now says **“Your weekly rhythm is ready”** rather than implying that an action is due today. The mobile-only bottom navigation and desktop top navigation remain unchanged by the Daily Brief itself.

The follow-up interaction polish was reviewed at desktop and mobile widths. The current date now has a visible **Today** marker, a softened green surface, a stronger border, and restrained elevation in the weekly board. The primary action and secondary alternative action have hover, focus, and press feedback, while the weekly-momentum bar expands over a short transition and respects reduced-motion settings.

The weekly time-state refinement was reviewed on mobile. The current card now has one calm **Today · weekday** label instead of competing current-day labels. Mobile shows today and the next two upcoming dates, while desktop retains the complete seven-day board. Past dates remain quiet history, and future rest days use planning language rather than implying an action is due today. Lifecycle status and workflow destinations remain unchanged.
