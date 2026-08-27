# Mobile Gesture Audit Notes

## Initial findings

- Pull-to-refresh is intentionally guarded to mobile top-level screens and only begins at the top of the page, which protects normal scrolling and in-progress work.
- The workspace relies on tap-first navigation and buttons, including the fixed mobile navigation; this remains safer than adding horizontal swipe navigation that could conflict with carousels, product previews, or browser gestures.
- Brand forms, product review, correction fields, and modal or sheet workflows should remain gesture-protected: no pull-to-refresh or destructive swipes should be added there.

## Home-screen finding

ViraSquare’s entry metadata still uses the previous green browser theme colour and does not yet include an install manifest. A future home-screen refinement should use the approved Navy theme colour and provide a deliberate installable web-app experience. This is more valuable than adding further gestures, because it improves the standalone experience for people who choose to save ViraSquare to their phone.
