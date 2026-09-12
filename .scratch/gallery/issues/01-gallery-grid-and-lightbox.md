# Gallery: three rolls, 3-column grid, lightbox

Type: task
Status: open

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
