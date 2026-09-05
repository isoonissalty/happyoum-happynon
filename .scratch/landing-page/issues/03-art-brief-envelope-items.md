# Art brief: envelope items

Type: task
Status: open

## Question

Write the brief the partner draws from for the five invite-panel pieces: envelope front,
envelope back, photo strip, two cat heads, ticket. These live in the invite panel, which
the visual direction work does not touch, so this can go now and unblock the drawing.

The brief has to carry the traps that are expensive to get wrong, which are currently
scattered across `README.md` and the code:

- **`envelope-front.png` must stay 780x300.** The pocket's top edge, the line all four
  items are positioned against, is derived from that aspect ratio. A different ratio moves
  the edge and silently re-tunes all four items at once.
- **A cat head shorter than about 240x190 falls behind the pocket** instead of showing
  above it.
- **The items overlap hard by design.** cat-head-1 loses 46% of its width behind
  cat-head-2, and the ticket 26%. Flat placeholders read as a tidy stack; two die-cut
  heads at that overlap could read as one cat eating the other. The brief should say which
  parts of each drawing must survive the overlap.
- **File names and dimensions are fixed.** Same names, same pixel sizes as the
  placeholders in `site/assets/landing/`.

Done when the brief is a document the partner can work from without asking follow-up
questions, and `tools/landing-check.mjs` still passes when art drawn to it is dropped in.
