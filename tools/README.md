# The gallery's photos

`make-gallery.mjs` is the one tool here that is not a check. It reads the originals in
`assets-src/gallery/<roll>/` - gitignored, and never served - and writes the two copies the
page does serve:

    node tools/make-gallery.mjs

A 300px square crop per photo into `site/assets/gallery/thumb/` for the tile, and a 1600px
copy into `full/` for the lightbox. It uses `sips`, which macOS ships, so the repo gains no
dependency. Names are positional - `oum-by-non-01.jpg` through `us-two-24.jpg` - so
re-running overwrites in place and the markup never changes. To reorder a roll, rename its
originals so they sort differently and run it again.

# Checks

Playwright drives a real Chrome, so it is not part of the site - the site itself still has
no build step. Install once:

    npm install

Then, from the repo root:

    node tools/landing-check.mjs      # landing page geometry at nine viewports
    node tools/motion-check.mjs       # the entrance order, the pop, and the no-script fallback
    node tools/invitation-check.mjs   # the invitation's scatter at twelve widths

`landing-check.mjs` is the one to run after swapping in real art: it holds every envelope
item to the pocket edge and clear of the lead-in line, and holds the whole cover to a
single viewport at nine window sizes including short laptops.

`invitation-check.mjs` holds every piece of the scatter inside the card's wave band and clear of the
content, text by its glyph extent, and asserts how many render at each width - so a
placement that hides the scatter cannot pass as "nothing overlaps".

It also holds the gallery: three tiles a row at every width in that table, each tile
square and inside the content column, and the page never laid out wider than its window.
Then it drives the lightbox: a tile opens it, the arrows and a swipe turn the photo and
wrap inside that roll rather than crossing into the next, and Escape and a click off close
it. Last it checks that every tile is still a plain link to its own file with the script off,
and that the photo in the lightbox keeps its own proportions rather than stretching to the
frame's minimum square.

That last one rests on how an engine sizes an image inside a box with a minimum, which each
decides for itself, so it is checked in WebKit and Firefox too. Those two
are optional: install them with

    npx playwright install webkit firefox

and the check skips them with a note when they are absent, so a Chrome-only checkout still
passes.

`regress.mjs` compares two rendered pages and takes both URLs:

    node tools/regress.mjs "file:///path/to/a.html" "file:///path/to/b.html"

It samples each page until their render hashes intersect, because Chromium's text
rasterisation is not deterministic - a single comparison fails at random on identical pages.
