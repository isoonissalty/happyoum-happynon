# Gallery: real photos, two sizes per photo

Type: task
Status: resolved
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

## Answer

Done. 72 photos, 24 a roll, in `site/assets/gallery/thumb/` and `full/`; `site/` is 35MB.

The estimate of ~3.5MB originals was wrong - they arrived as a LINE album export, 37MB all
told and no long edge past 1773px. So the 1600px resize is a no-op for two of the three
rolls and the byte win there is the re-encode, not the resampling. `make-gallery.mjs`
guards against upscaling and encodes at quality 80 either way. Thumbs came out at 2.5MB,
the full copies at 29MB.

Four things the work turned up that the issue did not foresee:

- **The originals landed in `site/assets/gallery/`**, which ships. They now sit in
  `assets-src/gallery/`, gitignored, and were never committed.
- **The tile needed an `<img>`** inside the existing `.tile-fill`, plus
  `object-fit: cover` so a portrait and a landscape thumb crop to the same square. The
  lightbox JS reads the tile's `href`, so it did not change, exactly as issue 01 promised.
- **The check's image wait hung** on the lazy tiles: an image below the fold is never
  fetched, so `complete` stays false and no load event ever fires. It now skips
  `loading="lazy"` images, which the geometry does not depend on anyway.
- **The lightbox arrows were painted over by the photo on phones.** `.lb-frame` carries a
  `filter`, so it paints as though positioned at z-index 0 and won on DOM order. The
  controls now take a layer of their own and a text shadow, since they sit over a photo of
  any brightness once it is that wide. It was latent before the photos landed - the
  placeholder square reached the arrows too.

Alt text is the tile link's `aria-label`; the thumb inside it is `alt=""` so a screen
reader announces the photo once rather than twice.

Ordering within a roll is the export's own numbering, sorted naturally. To reorder, rename
the originals and re-run the tool - the markup never changes.
