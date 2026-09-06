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

`regress.mjs` compares two rendered pages and takes both URLs:

    node tools/regress.mjs "file:///path/to/a.html" "file:///path/to/b.html"

It samples each page until their render hashes intersect, because Chromium's text
rasterisation is not deterministic - a single comparison fails at random on identical pages.
