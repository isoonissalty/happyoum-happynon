# Checks

Playwright drives a real Chrome, so it is not part of the site - the site itself still has
no build step. Install once:

    npm install playwright@1.62.1

Then, from the repo root:

    node tools/landing-check.mjs   # landing page geometry at nine viewports
    node tools/motion-check.mjs    # the entrance, the tile pool, and the no-script fallback

`landing-check.mjs` is the one to run after swapping in real art: it holds every envelope
item to the pocket edge and to the hashtag, and holds the intro to a single viewport at
nine window sizes including short laptops.

`regress.mjs` compares two rendered pages and takes both URLs:

    node tools/regress.mjs "file:///path/to/a.html" "file:///path/to/b.html"

It samples each page until their render hashes intersect, because Chromium's text
rasterisation is not deterministic - a single comparison fails at random on identical pages.
