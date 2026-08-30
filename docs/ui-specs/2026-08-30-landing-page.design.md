# UI Spec - Oum & Non Landing Page

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

- 2x2, `width: clamp(268px, 62vw, 468px)`, `gap: clamp(10px, 1.6vw, 18px)`, tiles `aspect-ratio:1`.
- Each tile has a solid cream frame, `border: clamp(4px, 0.7vw, 8px) solid var(--cream)`,
  and a small rotation - slot 1 `-1.5deg`, 2 `1.2deg`, 3 `1deg`, 4 `-1.2deg` - so the grid
  reads as hand-placed like the invitation's doodle scatter. No drop shadows; the CI has none.
- Tile images are `object-fit: cover`, `alt=""`. The grid carries
  `role="img" aria-label="Photos of Oum and Non"`.

### Tile flash

A pool of 8 images cycling through 4 slots.

- Crossfade **600ms**, dwell **3.5s**, slot start offsets **0 / 0.9 / 1.8 / 2.7s**.
  A slot's first swap lands at `dwell + offset`, so the opening composition holds for a
  full beat instead of one tile changing the instant the page paints.
- Deliberately slow and staggered. Four tiles strobing together is a photosensitivity
  problem, and offset fades look better regardless.
- Each slot holds two stacked `<img>` (`.tile-a`, `.tile-b`). JS sets the hidden one's
  `src`, waits for its `decode()`, then toggles opacity - so a slot never fades to a
  blank frame.
- Each slot walks the pool with a stride, so no two slots show the same image at once.

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
.envelope{ position:relative; width:clamp(280px, 64vw, 520px); aspect-ratio:78/86; margin-inline:auto; }
```

Three layers, so the items genuinely emerge from inside:

| layer | z-index | anchor |
|---|---|---|
| `envelope-back.png` | 0 | `bottom:0; width:100%` |
| popped items | 1-4 | absolute, see below |
| `envelope-front.png` | 5 | `bottom:0; width:100%` |

Each item gets its own z-index rather than sharing one. Stacking is then explicit and
independent of the entrance order: the ticket's rotated box is far wider than the ticket,
and left to DOM order it buries both cat heads.

The back image occupies the lower ~60% of the box; the upper ~40% is headroom the items
fly into. `.envelope` is `overflow: visible` - items are allowed to overshoot.

### Popped items

Each item is absolutely positioned at its FINAL spot and carries its own custom
properties. Percentage positions keep the arrangement intact as the envelope scales.

| item | asset | left/right | bottom | width | `--rot` | `--ox` | `--oy` | `--delay` | z |
|---|---|---|---|---|---|---|---|---|---|
| photo strip | `photo-strip.png` | `left:5%` | `26%` | `24%` | `-15deg` | `90%` | `45%` | `0ms` | 1 |
| ticket | `ticket.png` | `right:0%` | `27%` | `40%` | `14deg` | `-60%` | `70%` | `330ms` | 2 |
| cat head 1 | `cat-head-1.png` | `left:22%` | `29%` | `30%` | `-8deg` | `55%` | `85%` | `110ms` | 3 |
| cat head 2 | `cat-head-2.png` | `left:40%` | `30%` | `30%` | `9deg` | `15%` | `85%` | `220ms` | 4 |

`--ox` / `--oy` are percentages of the item's own box, so the start position scales with
the envelope. Each pair points its item back toward the envelope mouth - down and inward.

Placement is bounded by two lines, and both were measured rather than estimated. Every
item's bottom must fall at least 12px BELOW the front pocket's top edge, so the pocket
genuinely occludes it; and at least 55px of each item must show ABOVE that edge, or the
item reads as buried. An item must also clear the `.invite-tag` box entirely. Verified at
390 / 768 / 1440 / 1920.

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

## Reduced motion

The page is entirely motion, so `@media (prefers-reduced-motion: reduce)` needs a real
static end-state, not a disabled page:

- All entrance transitions and delays removed; text and grid at full opacity on load.
- Tiles show their first image and never swap. `landing.js` skips the flash scheduler.
- `.pop` items render in their `is-in` state immediately.
- `--p` stays 0, so `.intro-stage` never fades or scales. The sticky overlap itself is
  kept - it is scroll-linked, not self-animating.

`landing.js` reads `matchMedia('(prefers-reduced-motion: reduce)')` once at startup and
skips both loops.

## Mock assets

Generated with PIL into `site/assets/landing/`. Flat CI-colored blocks, each labelled with
its own filename so a placeholder is never mistaken for final art. Committed at these
exact intrinsic sizes, and written into the `<img>` `width`/`height` attributes:

| file | size | becomes |
|---|---|---|
| `tile-1.png` … `tile-8.png` | 600x600 | the couple's photos |
| `envelope-back.png` | 780x520 | envelope body |
| `envelope-front.png` | 780x300 | envelope front pocket |
| `photo-strip.png` | 200x580 | 3-frame photo booth strip |
| `cat-head-1.png`, `cat-head-2.png` | 240x220 | die-cut cat heads |
| `ticket.png` | 420x250 | minimal invitation ticket |

## Responsive

A single centered column at every width, scaled with `clamp()`. Unlike the invitation's
agenda, this composition is inherently centered and needs no desktop reflow.

## Head

`site/index.html` keeps the invitation's `<title>`, description, `og:` tags and favicon.
Both pages load the same Google Fonts link (Oswald 400, Quicksand 500/600, Rouge Script).

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
