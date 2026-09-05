# UI Spec - Oum & Non Landing Page

> **Superseded 2026-09-05.** The two-panel landing this spec describes was replaced by a
> single cream card holding the envelope; panel 1, the photo grid, the tile flash and the
> parallax are gone. `CONTEXT.md` describes the page as built. The envelope section below
> (layers, popped-item placement, the `.motion` gate, reduced motion) still applies.

**Wireframe:** `docs/ui-specs/assets/landing-page.png`
**Structural approach:** A - "cream panel slides up over the stripes".
Approaches B and C are recorded in `2026-08-30-landing-page.alternatives.md`.
**Existing CI reference:** `2026-08-23-wedding-site.design.md` (palette, type, wave geometry).

## Context

A two-panel scroll page that becomes the site's entry point. Panel 1 teases; panel 2
hands the guest an envelope and a button into the existing invitation. No framework, no
build step, deployed by `.github/workflows/pages.yml` which publishes `site/` as the web
root.

All artwork is mocked for now. Mocks are committed PNGs at the final intrinsic sizes so
the layout does not reflow when real art replaces them.

## Routing change

`.github/workflows/pages.yml` publishes `site/` at `/`, so the landing has to take
`index.html`:

| file | before | after |
|---|---|---|
| `site/index.html` | the invitation, served at `/` | the landing, served at `/` |
| `site/invitation.html` | - | the invitation, served at `/invitation.html` |

The "Open invitation" button targets `invitation.html` as a relative path, so the site
still works from any subpath. No redirect stub: the bare URL was chosen on the
understanding that it has not yet been sent to guests, so nothing points at the old path.

## Hashtag

The wireframe and the invitation's footer disagreed. **`#happyoumhappynon` is correct.**
The invitation's footer changes from `#oumnonhappyhappy` to match.

## File layout

```
site/
├── index.html        landing
├── invitation.html   the current page, moved verbatim apart from the footer hashtag
├── base.css          shared CI layer
├── styles.css        invitation only
├── landing.css       landing only
├── landing.js        motion
├── pixie.js          the wand's dust, shared by both pages
├── assets/           existing art, unchanged
└── assets/landing/   mock art
```

### `base.css` - what moves, and why

Moved verbatim out of `styles.css`, keeping their relative order: the `:root` block, the
`*` reset, `body`, `.script`, `.btn`, `.btn:hover`. These are the CI primitives both
pages need.

The landing must NOT link `styles.css`. That file carries page-specific rules -
`.content img{max-width:100%;height:auto}` above all - which win on specificity against
sizing rules the landing sets on its own images.

Both pages link `base.css` before their own sheet. Because the rules move verbatim and in
order, and `base.css` is linked first, computed styles on the invitation are unchanged;
the regression diff below is what proves it.

**One addition while in this file:** `.btn:focus-visible{ outline:3px solid var(--ink);
outline-offset:3px }`. The button had no visible keyboard focus.

**The hover fill** is the ground's two tints run together,
`linear-gradient(100deg, var(--mint), var(--lavender))`, so a lit button belongs to the
stripes behind the card; the text stays `--ink`. A gradient cannot transition, so it lives
on `.btn::before` at `z-index:-1` and fades in by opacity, with `isolation:isolate` on the
button so the pseudo element stays inside it rather than dropping behind the card. Hover
and focus-visible light it on fine pointers; `:active` lights it everywhere, so a tap on a
phone gets the same answer.

**New token,** appended to `:root`:

```
--pop-ease: cubic-bezier(.2,.8,.28,1.08);
```

## Page structure

Two panels. Panel 1 is pinned; panel 2 slides over it.

```css
.panel--intro  { position:sticky; top:0; height:100svh; z-index:0; }
.panel--invite { position:relative; z-index:1; min-height:100svh; background:var(--cream); }
```

That is the whole parallax mechanism. `position:sticky` is universally supported, so no
`animation-timeline` feature detection and no scroll library.

**`landing.css` must override `body{overflow-x}` to `clip`.** `base.css` inherits
`overflow-x:hidden` from the invitation, and a `hidden` value on any axis makes the
element a scroll container, which silently kills `position:sticky` in a descendant.
`clip` suppresses the same overflow without creating one. Where `clip` is unsupported
(Safari < 16) the panels simply stack without the overlap - degraded, not broken.

`100svh`, never `100vh` - mobile browser chrome resizes `vh` mid-scroll and this audience
is almost entirely on phones.

### The wavy leading edge

A cream strip sitting immediately above `.panel--invite`, masked by the existing wave:

```css
.panel--invite::before{
  content:'';
  position:absolute; left:0; right:0;
  top: calc(var(--wave-h) * -1 + 1px);   /* 1px overlap; an exact abutment leaves a
                                            sub-pixel seam at fractional clamp() values */
  height: var(--wave-h);
  background: var(--cream);
  mask-image: var(--wave-top);
  mask-repeat: repeat-x;
  mask-size: var(--wave-wl) var(--wave-h);
  /* -webkit- twin required, and must stay in lockstep - Chromium honours whichever
     of the two blocks is declared last */
}
```

`--wave-top` fills below its curve, which is exactly a wavy top edge. Masking a cream
strip avoids committing a second, cream-filled copy of the SVG to `:root`.

This is a single `repeat-x` mask layer. It deliberately does not reuse `.card`'s outline,
which is an intersection of horizontal masks on `.card` and vertical masks on
`.card-inner` with percentage `mask-size` tuned for a 3891px card.

## Panel 1 - the tease

```
        Oum & Non
    ┌─────┬─────┐
    │  ▨  │  ▨  │
    ├─────┼─────┤
    │  ▨  │  ▨  │
    └─────┴─────┘
   ARE GETTING MARRIED

          and…
```

Sits directly on the striped body background. No card.

| element | font | size | notes |
|---|---|---|---|
| `Oum & Non` | Rouge Script 400 | `clamp(43px, 5vw, 72px)` | matches the invitation's `.names` |
| `ARE GETTING MARRIED` | Oswald 400 | `clamp(18px, 2.1vw, 30px)`, `0.12em` | matches the `.date-block` register |
| `and…` | Rouge Script 400 | `clamp(30px, 3.3vw, 48px)`, `var(--label)` | the scroll hook |

The pairing is the invitation's own: Oswald states the fact, Rouge Script carries the
feeling.

### Photo grid

- 2x2, `width: min(clamp(268px, 62vw, 468px), 52vh)`, `gap: clamp(10px, 1.6vw, 18px)`,
  tiles `aspect-ratio:1`, each on a `--cream` background so a photo still loading reads as
  an empty frame rather than a striped hole.
- **The `52vh` cap is load-bearing.** `.panel--intro` is exactly one viewport tall and
  centres its content, so anything that overflows is lost at BOTH ends at once: clipped by
  the window above, and hidden under the opaque cream panel below. Sized off `vw` alone the
  stage runs ~695px, which overflows any window shorter than about 700px - including a
  1366x768 laptop after browser chrome, the most common desktop resolution there is, where
  it sliced the couple's names in half.
- Each tile has a solid cream frame, `border: clamp(4px, 0.7vw, 8px) solid var(--cream)`,
  and a small rotation - slot 1 `-1.5deg`, 2 `1.2deg`, 3 `1deg`, 4 `-1.2deg` - so the grid
  reads as hand-placed like the invitation's doodle scatter. No drop shadows; the CI has none.
- Tile images are `object-fit: cover`, `alt=""`. The grid carries
  `role="img" aria-label="Photos of Oum and Non"`.

### Tile flash

A pool of N images cycling through 4 slots, where N is read from `data-pool` on `.grid`.
The couple supplies however many photos they have; the page must not assume eight. Four is
the floor, since the markup names `tile-1.png` through `tile-4.png` directly; at exactly
four nothing is spare to rotate in and the grid holds still.

- Crossfade **600ms**, dwell **3.5s** per slot.
- **One shared timer, round robin, one swap in flight.** It ticks every `DWELL / SLOTS`
  (875ms) and advances one slot per tick, so each slot still changes every 3.5s and the
  stagger the design calls for survives.
- **Distinctness holds because only one swap can commit at a time, not because of the
  scan.** This is the important sentence in this section. An earlier version gave each slot
  its own timer and had it advance to an image no other slot was showing - and that scan is
  *not* sufficient: it runs before `decode()` and only commits after, so two slots whose
  decodes overlap both see the same index free and both take it. Placeholders decode
  instantly and hid it completely; forcing a 2.5s decode produced two slots on one photo in
  48 of 60 samples. Reserving at scan time does not rescue it either, because a slot still
  displays its old image while holding a new one, and at a pool of 5 the displayed set alone
  occupies 4 of 5 indices - a strict no-duplicate invariant is unachievable at small pools
  with concurrent decodes. Serialising is what makes it true.
- The class swap happens inside `decode()`'s success path. A missing or unreadable photo
  leaves the current one up; swapping regardless paints the browser's broken-image glyph
  inside the frame, permanently, since the timer cycles it back.
- **A stalled turn is released after `2 * DWELL`,** with a per-turn `abandoned` flag so a
  late-settling decode cannot commit out of order. Serialising couples the slots together,
  so without this one photo that never arrives would freeze all four. The timeout is
  deliberately generous: re-setting `src` cancels the fetch in flight, so an eager valve
  makes a slow connection permanently slower rather than recovering from it.
- **After three consecutive failures the rotation stops** and the grid settles on the still
  composition the no-script path already renders. Without it, a missing photo is
  re-requested every turn forever - measured at 40 requests for one file in 40 seconds.

`tools/pool-check.mjs` covers pools 3 through 8, the attribute missing, and a 2.5s
per-request delay that reproduces the race. It reports 2 distinct tiles against the
pre-serialisation scheduler and 4 against this one.

### Load sequence

| t | element |
|---|---|
| 0.15s | grid fades in |
| 1.0s | `Oum & Non` |
| 1.2s | `ARE GETTING MARRIED` |
| 1.8s | `and…`, then a slow 2.4s vertical bob |

The wireframe's "faded in text, after 1s delayed" points at both text blocks; the grid is
the thing already on screen.

### Pinned-panel drift

`landing.js` maintains `--p` on `.panel--intro`: `clamp(0, scrollY / innerHeight, 1)`,
written from a `requestAnimationFrame` loop scheduled by a passive `scroll` listener.

```css
.intro-stage{
  opacity:   calc(1 - var(--p) * .85);
  transform: translateY(calc(var(--p) * -6vh)) scale(calc(1 - var(--p) * .06));
}
```

The intro recedes as the cream sheet rises over it.

## Panel 2 - the envelope

```
        YOU ARE
   #happyoumhappynon

      ▤   ◕ ◕   ▤
    ╔═══════════════╗
    ║   envelope    ║
    ╚═══════════════╝

       invited!!

    ( Open invitation )
```

| element | font | size |
|---|---|---|
| `YOU ARE` | Oswald 400, `0.12em` | `clamp(18px, 2.1vw, 30px)` |
| `#happyoumhappynon` | Quicksand 600 | `clamp(22px, 2.8vw, 40px)`, `var(--ink)` |
| `invited!!` | Rouge Script 400 | `clamp(64px, 7.5vw, 108px)` |
| `Open invitation` | `.btn` from `base.css` | - |

The hashtag is `--ink` here; the invitation's footer uses `--cream` because it sits on the
stripes.

### Envelope

```css
.envelope{ position:relative; width:min(clamp(300px, 74vw, 640px), 40.9svh); aspect-ratio:1176/1136; margin-inline:auto; }
```

Three layers, so the items genuinely emerge from inside:

| layer | z-index | anchor |
|---|---|---|
| `envelope-back.png` | 0 | `bottom:0; width:100%` |
| popped items | 1-4 | absolute, see below |
| `envelope-front.png` | 5 | `bottom:0; width:100%` |

Each item gets its own z-index rather than sharing one. Stacking is then explicit and
independent of the entrance order: the ticket's rotated box is far wider than the ticket,
and left to DOM order it buries whatever paints before it.

The back image occupies the lower ~60% of the box; the upper ~40% is headroom the items
fly into. `.envelope` is `overflow: visible` - items are allowed to overshoot.

### Popped items

Each item is absolutely positioned at its FINAL spot and carries its own custom
properties. Percentage positions keep the arrangement intact as the envelope scales.

| item | asset | left/right | bottom | width | `--rot` | `--ox` | `--oy` | `--delay` | z |
|---|---|---|---|---|---|---|---|---|---|
| photo strip 1 | `photo-strip-1.jpg` | `left:6%` | `6%` | `23%` | `-12deg` | `90%` | `45%` | `0ms` | 1 |
| photo strip 2 | `photo-strip-2.jpg` | `left:17%` | `4%` | `23%` | `-5deg` | `50%` | `45%` | `90ms` | 2 |
| cats | `cat_heads.png` | `right:-1%` | `46%` | `46%` | `5deg` | `-40%` | `60%` | `200ms` | 3 |
| ticket | `ticket.png` | `left:27%` | `26%` | `38%` | `-4deg` | `0%` | `70%` | `330ms` | 4 |

The ticket is the payoff, so it stands centre front and lands last; the cats peek over
its right shoulder, their plate run out to the flap so the black cat clears the ticket.
Below 700px of window height the strips narrow to `21%`: at that size their tops reach
the lead-in line, and a little width costs them a lot of height.

`--ox` / `--oy` are percentages of the item's own box, so the start position scales with
the envelope. Each pair points its item back toward the envelope mouth - down and inward.
Every item's start box must sit entirely behind the front pocket: the items fade in over
280ms while still travelling for 620ms, so one that starts proud of the pocket edge shows
a faint sliver in the wrong place partway through.

Placement is bounded by two lines, and both were measured rather than estimated. Every
item must dip at least **3% of the envelope's height** BELOW the front pocket's top edge,
so the pocket genuinely occludes it, and at least **15%** of that height must show ABOVE
the edge, or the item reads as buried. An item must also clear the `.invite-tag` box
entirely. Verified at 390 / 768 / 1440 / 1920.

Both bounds are fractions of the envelope rather than pixel counts. The envelope hits its
`clamp()` floor of 280px on a 390px viewport - 54% of its desktop size - so a fixed pixel
bound is twice as strict on mobile for a composition that is proportionally identical.

```css
.pop{
  transform: translate(var(--ox), var(--oy)) scale(.2) rotate(0deg);
  opacity: 0;
  transition: transform 620ms var(--pop-ease) var(--delay),
              opacity   280ms ease-out          var(--delay);
}
.pop.is-in{ transform: translate(0,0) scale(1) rotate(var(--rot)); opacity:1; }
```

`.envelope` stays `overflow:visible` so an item may overshoot its slot mid-flight. The
`--pop-ease` overshoot is what reads as "popping".

Trigger: one `IntersectionObserver` on `.panel--invite` at `threshold: 0.35`, adding
`is-in` once and then disconnecting. Firing once matters - re-triggering on every scroll
past would turn the moment into a tic.

## The wand

The pointer is a wand on both pages: an inline SVG cursor in `base.css` with the hotspot
on the star, so the dust falls from its tip. Clickable things - links, buttons, the
envelope, the viewer - swap to a lit variant with a gold star, keeping the affordance the
pointer-hand gave. Every `cursor` keeps its keyword fallback (`auto`, `pointer`,
`zoom-out`) so a refused image still means the right thing. Nothing is fenced on
`pointer:fine`: a touch device never paints a cursor.

`pixie.js` draws the dust on a fixed, pointer-transparent canvas over the page: one spark
per 6px of travel laid along the pointer's path, so a fast sweep leaves a line rather
than a spark per event, and a burst on press. Sparks settle under light gravity, twinkle,
and go out; the loop runs only while dust is in the air. It returns at once under reduced
motion.

A touch screen has no wand to trail, so the landing flies it itself: its `<script>` tag
carries `data-hands-free`, and on a coarse pointer the emitter runs a horizontal figure of
eight - a lemniscate, `x = a sin t`, `y = b sin t cos t` - across the band between the top
of the screen and the names, one lap every 7s. The band is measured live from the `h1`,
so the figure is a hundred pixels tall on a phone held upright and a sliver on one on its
side; the dust it sheds settles down onto the copy rather than across it. The trail is
laid at 2px spacing, a third of the pointer's, because the wand moves slowly and a sparse
trail reads as a fault. The invitation does not carry the attribute and gets no dust on
touch. `motion-check.mjs` samples the canvas across a lap under touch emulation and holds
the dust to both lobes and to the band.

## Reduced motion

The page is entirely motion, so `@media (prefers-reduced-motion: reduce)` needs a real
static end-state, not a disabled page:

- All entrance transitions and delays removed; text and grid at full opacity on load.
- Tiles show their first image and never swap. `landing.js` skips the flash scheduler.
- `.pop` items render in their `is-in` state immediately.
- `--p` stays 0, so `.intro-stage` never fades or scales. The sticky overlap itself is
  kept - it is scroll-linked, not self-animating.

`landing.js` reads `matchMedia('(prefers-reduced-motion: reduce)')` once at startup and
returns immediately when it is set.

## Degrading without the script

The entrance state for `.pop` is gated on a `.motion` class that `landing.js` adds to
`<html>`, so the **landed** composition is what the page renders by default. Scripting
switched off, a script blocker matching the filename, and a 404 on `landing.js` all leave
the envelope full rather than empty. The script's body is wrapped in a `try`/`catch` that
drops the class, so a throw partway through lands the same composition rather than
stranding the page mid-entrance.

Gating on a class the script adds, rather than a `<noscript>` block, is what covers the
`landing.js`-missing case: `<noscript>` only fires when scripting is off at the browser
level. Every `.motion`-gated element is in panel 2, below the fold, and a deferred script
runs within milliseconds of parse, so the class is applied long before any of them can be
scrolled into view.

Text and tiles need no gate. Their entrances are pure CSS animations that run with or
without the script, and the tile grid's first image is a static class in the markup.

## Mock assets

Generated with PIL into `site/assets/landing/`. Flat CI-colored blocks, each labelled with
its own filename so a placeholder is never mistaken for final art. Committed at these
exact intrinsic sizes, and written into the `<img>` `width`/`height` attributes:

| file | size | becomes |
|---|---|---|
| `tile-1.png` … `tile-8.png` | 600x600 | the couple's photos |
| `envelope-back.png` | 1219x1476 | envelope body, the paper under a transparent top |
| `envelope-front.png` | 1219x1476 | envelope flaps and front pocket, transparent above the pocket's V edge |

`landing-check.mjs` reads the pocket's edge off `envelope-front.png` itself, through a
canvas, at the column under each item's centre: the edge is a V, so the front plate's box
says nothing about where an item is hidden. Chrome is launched with
`--allow-file-access-from-files` for it, since a `file://` image otherwise taints the canvas.
| `photo-strip-1.jpg`, `photo-strip-2.jpg` | 332x1268 | 4-frame photo booth strips, fanned as a pair |
| `cat_heads.png` | 1040x952 | both die-cut cat heads on one plate |
| `ticket.png` | 1241x1750 | the invitation card, portrait |

## Responsive

A single centered column at every width, scaled with `clamp()`. Unlike the invitation's
agenda, this composition is inherently centered and needs no desktop reflow.

## Head

`site/index.html` keeps the invitation's `<title>`, description, `og:` tags and favicon.
Both pages load the same Google Fonts link (Oswald 400, Quicksand 500/600, Rouge Script).

## Where the checks live

`tools/landing-check.mjs`, `tools/motion-check.mjs` and `tools/regress.mjs`, committed and
runnable after `npm install playwright@1.62.1`. Playwright drives a real Chrome and is not
part of the site, which still has no build step. They are committed rather than kept as
scratch because the placement bounds they enforce are the whole reason the envelope reads
correctly, and the couple runs them after swapping in real art.

`landing-check.mjs` covers nine viewport SIZES, not widths - short laptop windows and phone
landscape are where the intro panel fails, and a suite that only tested tall viewports could
not see it.

## Acceptance

1. No horizontal scroll at 390 / 768 / 1024 / 1440 / 1920.
2. Panel 1 is exactly one `svh` tall and stays pinned while panel 2 rises over it.
3. The wavy seam shows no transparent gap against the cream panel at any width.
4. `position:sticky` actually engages - verified by measuring the intro panel's painted
   position after a scroll, not by reading the CSS.
5. Text fades in on the specified schedule; tiles crossfade on the specified cadence and
   no two slots change in the same frame.
6. Popped items animate once, land inside the viewport at every tested width, and sit
   visually between the two envelope layers.
7. Under `prefers-reduced-motion: reduce` the finished composition is present on load with
   no animation.
8. `.btn` shows a visible focus ring on keyboard focus, on both pages.
9. **Regression:** full-page screenshots of `invitation.html` are md5-identical to HEAD's
   `index.html` at 390 / 480 / 768 / 1024 / 1100 / 1199 / 1440 / 1920, comparing against a
   HEAD baseline patched with the new footer hashtag.
