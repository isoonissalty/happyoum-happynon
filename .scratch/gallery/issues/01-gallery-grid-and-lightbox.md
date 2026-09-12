# Gallery: three rolls, 3-column grid, lightbox

Type: task
Status: resolved

## Question

The invitation ends at the RSVP buttons. Add a gallery below them: three rolls of 24
photos each, every photo a square tile three to a row, tapping one to see it large.

The photos do not exist yet and the pipeline that sizes them is issue 02. This issue
builds the section and the interaction against empty tiles, so the layout and the
lightbox are finished and proven before a single jpg lands.

Decisions taken with the user, 2026-09-12:

- **Placement**: last section, after `.actions`, inside the 640px content column. A grid
  bleeding to the card edge would land on the neighbouring sections' scatter.
- **Headings**: "Us, lately" as the section's `h2.label`; the three roll names beneath it
  as smaller `h3`s.
- **Grid**: three columns at every width. ~88px a tile at 320px, ~100px at 360px, ~208px
  at 640px and up.
- **Tile, for now**: a styled square `div` inside the tile's `<a>`. No `img`, no files.
- **Lightbox**: the landing's mechanism - a real `<a href>` that JS upgrades to a
  `<dialog>` where `showModal` exists - minus the item card. Arrows, swipe, Escape, click
  off to close. Wraps within one roll, never crosses into the next.
- **What the lightbox shows while there are no files**: an `img` loaded from the tile's
  `href`, exactly as the landing's viewer does, sized by CSS and backed by the tile's
  pastel. A missing file then paints as a plain square, and issue 02 changes no JS at
  all. Check this renders empty rather than as a broken-image icon before building on
  it - a sized `img` with `alt=""` and a 404 `src`, in Chrome, Safari and Firefox.
- **Scatter on a phone**: the grid fills the 640px column, so the only room left is
  beside the `h2` and the three `h3`s. The rows themselves take none.
- **No captions**. The picture and nothing else.
- **Scatter**: the section gets its own, like every other.

## Done when

- `invitation-check.mjs`'s per-width deco count table covers the new scatter, and both it
  and `motion-check.mjs` are green.
- The check asserts three tiles a row at every width in the table, tiles square, and no
  sideways scroll.
- The check opens the lightbox, asserts arrow and Escape behaviour and that the last tile
  of a roll wraps to that roll's first rather than the next roll's.
- With JS off, each tile is still a link to its photo's path.
- Reduced motion renders the finished section with no animation.

## Answer

Built as specced. `.gallery` is the last section inside the 640px column, `h2.label`
"Us, lately" over three `.roll`s, each an `h3` and a 3-column grid of 24 `a.tile`s
wrapping a square `span.tile-fill`. The tiles link to `assets/gallery/full/<slug>-NN.jpg`,
the names issue 02 will write, and carry a four-step pastel cycle so the tints run
diagonally across a three-wide grid instead of striping the columns.

Three things came out differently from the decisions above, all of them from checking
before building:

- **The lightbox picture is an `img` inside a frame, not a sized `img`.** Sizing a broken
  `img` with `min-width` *and* `min-height`, which is what it takes to hold the square
  open, stretches a real photo off its own proportions - measured at 300x312 for a
  296x1156 source in all three engines. Putting the square and the tint on a wrapper and
  leaving the `img` to size itself keeps both: a missing file is a plain tinted square, a
  real one is exactly its own shape. Verified in Chrome, WebKit and Firefox.
- **The alt goes on at `load`, not with the `src`.** An `img` that carries alt text while
  its file is missing paints the browser's broken-image glyph, and clearing the alt on
  `error` only removes it once the load gives out - the check caught that glyph on screen
  intermittently. Holding the alt back until the photo is actually there has no such
  window. Issue 02 still changes no JS.
- **A swipe suppresses the click that follows it**, or a swipe across the scrim would turn
  the photo and then close the lightbox on the same gesture.

### One decision left open: the tile sizes

The spec asks for two things that cannot both hold, and the layout follows the one that
carries a reason:

> **Placement**: last section, after `.actions`, inside the 640px content column. A grid
> bleeding to the card edge would land on the neighbouring sections' scatter.

> **Grid**: three columns at every width. ~88px a tile at 320px, ~100px at 360px, ~208px
> at 640px and up.

`.content` is 640px wide *including* its own 24px of side padding, so a grid inside it has
592px to divide, not 640. Tiles come out at 74px at 320, 85px at 360 and 187px from 688
up - around 15% under the figures above, which were written as approximations and assume
the grid spans the full column edge to edge.

Reaching the spec's numbers means cancelling that padding. At desktop widths that is
harmless. At 320 it is not: 88px tiles need 276px of the card's 281px interior, and the
wave band alone eats 18px a side, so the tiles would be cut by the card's own edge - the
exact failure the placement decision was taken to avoid.

So the tiles are the size the column leaves them, the check asserts three a row and
squareness rather than any px figure, and the spec's px line wants correcting. If the
bigger tiles matter more than the column, the fix is a negative inline margin on `.tiles`
above some width, and the numbers become reachable from about 688px up but never at 320. `.lb-frame`'s `min-width`/`min-height` of
`min(78vw, 58svh)` is only there to hold the empty square open. Once the files exist it
earns nothing and can cost something - on a 390px phone the square is 304px, so a
landscape photo capped at `88vw` renders 343x257 inside it and gets a pastel bar above and
below. Dropping the two `min-*` lines when the photos land fixes that, and it is CSS, so
"issue 02 changes no JS" still holds.

The dialog's accessible name is "Photo", not "Photo viewer": CONTEXT.md keeps **viewer**
for the landing's item-card version and the lightbox is deliberately not that.

`invitation-check.mjs` was already red at HEAD, at every width below 1440: the count table
predated the rule that hides `deco--desk` below 1200 and was ten pieces short everywhere.
Fixed along with the new counts - 39 pieces in all, 17/26/24/39 across the four bands.

### The check

It now also covers the grid (three a row, square, inside the column, no sideways
layout), the lightbox (open, arrows, swipe, Escape, click off, wrapping inside one roll),
the script-off links, the reduced-motion stillness, and - by sampling the rendered pixels
through a canvas, so it costs no dependency - that an absent photo paints as one flat
tint. `invitation-check.mjs`, `motion-check.mjs` and `landing-check.mjs` are all green.
