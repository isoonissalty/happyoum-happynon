# Gallery: real photos, two sizes per photo

Type: task
Status: open
Blocked by: 01

## Question

Issue 01 leaves 72 empty tiles. This one fills them.

The user has ~72 straight-from-phone photos, 24 a roll, and will hand over a folder. At
~3.5MB each that is ~250MB of originals - far too much to serve, and nothing the repo
should carry.

Decisions taken with the user, 2026-09-12:

- **Two derived copies a photo**: a 300px square thumb for the tile, a 1600px copy for the
  lightbox. Roughly 30KB and 400KB each, so ~31MB in `site/` all told - GitHub Pages
  allows 1GB published and 100GB a month of bandwidth.
- **jpg or png only.** No webp.
- **Originals are never committed.** The source folder is gitignored; only `thumb/` and
  `full/` ship.
- **`tools/make-gallery.mjs`** does the resizing with `sips`, already on the user's
  machine, so the repo gains no dependency and keeps its no-build-step property.
- File names are final and positional - `oum-by-non-01.jpg` through `us-two-24.jpg` - so
  re-running the tool overwrites in place and the markup never changes.

## Done when

- The tool turns a folder of originals into `site/assets/gallery/thumb/` and `full/`.
- Tiles carry `loading="lazy"`, so only what scrolls into view is fetched.
- Every tile and every lightbox picture has alt text.
- `site/` measures under 40MB.
- Both checks green, and the page looked at by eye - no check compares photos against
  each other.
