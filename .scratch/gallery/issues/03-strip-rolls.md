# Gallery: the two portrait rolls run as film strips

Type: task
Status: resolved
Blocked by: 01

## Question

"Oum, by Non" and "Non, by Oum" each stood as a 3x8 grid of 24 tiles, which is 24 photos
of one person in one block and a long scroll past both before "Us two" arrives. Run each
of those two rolls as a single row instead, scrolled left and right by hand. "Us two"
stays the grid it is.

## Answer

Each of the two rolls carries `roll--strip`, and `.roll--strip .tiles` is a flex row that
scrolls on x. The frames are `clamp(96px, 14vw, 168px)` wide and square, so three and a
part of a fourth stand in the column at any width - the part-frame is what says the roll
runs on.

The strip is drawn as film: the scroller's background is `--ink`, the card's own outline
colour rather than a black that is nowhere else on the page, and the perforations are
`--cream` holes in the top and bottom bands. Those bands are the scroller's padding, so
they also give the hover lift and the focus ring the room `overflow-x` would otherwise
clip. `background-attachment: local` makes the base and its sprockets travel with the
frames instead of sitting still behind them.

Three decisions worth keeping:

- `scroll-snap-type` is `proximity`, not `mandatory`. Mandatory fights the part-frame the
  strip ends on and can trap the last frame against the edge.
- `overscroll-behavior-x: contain`, or a swipe past the last frame chains into the
  browser's history on iOS and macOS Safari.
- The strip stays inside the content column rather than bleeding to the card's edge. The
  margin band is where the decoration scatter lives; a bleed would take it away, and each
  roll's `deco--desk` filler now sits level with its strip.

`invitation.js` is untouched: the lightbox scopes a roll with `closest('.roll')`, which
holds however the tiles inside it are laid out.

`invitation-check.mjs` branches on the roll: a strip must be one row and must really
overflow its scroller, the grid keeps three a row and eight rows, and every tile in either
is still square. One latent bug fell out of this - the deco overlap test read tile boxes
from `getBoundingClientRect()`, which reports the frames scrolled off the end of a strip as
sitting out in the margin band where nothing of them is painted. Tiles are now clipped to
their scroller before the comparison, so a piece beside a strip is judged against what is
actually on screen.
