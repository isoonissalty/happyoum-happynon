# Landing collapses to one panel

Type: task
Status: resolved

## Question

User feedback, 2026-09-05: remove the intro panel - the names-plus-photo-grid tease - and
bring the envelope up to take its place. The landing becomes a single panel: the envelope
is the cover, not the payoff after a scroll.

This supersedes tickets 01, 02 and 04, which were all about the intro panel's look. It
also removes the whole parallax mechanism (the sticky intro, `--p` drift, the wavy leading
edge on the cream sheet) and the tile flash (`data-pool`, `landing.js`'s scheduler,
`tools/pool-check.mjs`), because the thing they animate no longer exists.

## Scope

- `site/index.html`: one `.panel`, cream ground, holding the envelope and its copy. The
  copy itself is ticket 11; this ticket carries the current invite-panel text across so the
  page is never empty.
- `site/landing.css`: drop the intro, grid, tile and drift rules. The panel is `min-height:
  100svh` and centres its content. The cream sheet no longer needs a wavy leading edge;
  what the striped ground does around a single cream panel is the one design call here -
  see below.
- `site/landing.js`: keep the envelope pop, drop the tile flash and the drift.
- `tools/`: `pool-check.mjs` goes. `landing-check.mjs` loses its intro/sticky assertions
  and keeps the envelope-placement bounds. `motion-check.mjs` loses the grid/tile probes
  and keeps the pop, no-script and reduced-motion cases. `tools/README.md` follows.
- `CONTEXT.md`: the Landing entry becomes one panel; the Tile / pool entry goes; the
  striped ground's "full stage behind the intro panel" wording goes.

## The one design call

With no stripe-backed intro above it, the cream panel either fills the viewport edge to
edge (stripe never shows on the landing) or sits as a card on the stripe the way the
invitation does. The second keeps the two pages one family and reuses the invitation's
card treatment, so it is the default here. The user can flip it on sight.

## Done when

`landing-check.mjs` and `motion-check.mjs` pass against the new page, the landing is one
viewport at the nine sizes with nothing clipped, and the envelope still pops once on load.

## Answer

Built 2026-09-05. The landing is one `.card` on the stripe, using the invitation's wavy
outline, which moved verbatim from `styles.css` into `base.css` (`tools/regress.mjs`:
invitation identical at all eight widths). The card fills the viewport with a
`clamp(12px, 2.5svh, 40px)` vertical inset and `--card-inset` at the sides.

Every vertical measure carries an svh term, and a `max-height: 700px` block trades
envelope size for fit on short windows. Measured: the cover fits one screen at eight of
the nine `landing-check.mjs` sizes; phone landscape (844x390) scrolls 7px, which the
check tolerates below 560px tall.

Removed: the intro panel, the photo grid and its tile flash, `pool-check.mjs`, the
`tile-*.png` placeholders, the sticky parallax and the cream sheet's wavy seam. The
envelope pop now fires on a 1.3s timer rather than an intersection observer, since it is
above the fold. One fix that fell out: the pop transition moved from `.pop` to
`.pop.is-in`, because on `.pop` it animated the flip into the hidden state when the
script added `.motion`, visible now that the envelope is on screen at load.

`CONTEXT.md` Landing and Striped ground entries rewritten, Tile / pool entry removed;
`tools/README.md` and the 2026-08-30 design doc carry a superseded note.
