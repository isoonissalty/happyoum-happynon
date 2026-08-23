# Design Reference - Oum & Non Wedding Site

Measured from oracle `assets/wedding-site.png` at 1440px width; values rounded to 4px.
All px below are at 1440 viewport; scale proportionally or use the given clamp() hints.

## Palette (sampled, exact)

| token | hex | use |
|---|---|---|
| --mint | `#b5d5cd` | stripe A |
| --lavender | `#cbc1e1` | stripe B |
| --cream | `#f5ebe1` | card bg, footer hashtag text |
| --ink | `#4a5560` | headings, script text, body, icons |
| --label | `#6f757c` | section labels ("Dress Code", "Agenda", "Where to celebrate") - slightly lighter than ink |

No other colors. All artwork carries its own colors.

## Typography (Google Fonts)

| role | font | size @1440 | tracking | weight |
|---|---|---|---|---|
| Script (Married!, Oum & Non) | `Rouge Script` (fallback `Great Vibes`) - AMBIGUOUS snap: mock uses a signature script not on Google Fonts; Rouge Script is the pinned approximation | Married!: 128px; Oum & Non: 72px | normal | 400 |
| Caps (WE'RE GETTING, date block) | `Oswald` 400 | eyebrow: 40px; date lines: 36px | 0.12em | 400 |
| Rounded sans (everything else) | `Quicksand` 500/600 | body: 24px; section label: 28px; agenda time: 32px (600); agenda label: 28px; venue name: 36px (600); address: 28px; buffet note: 20px | normal | 500 body, 600 bold |

Line-height: body 1.5; headings 1.1. Scale: use `clamp()` so mobile ~0.6x of the 1440 values.

## Layout proportions

- **Stripes:** vertical bars, each **84px** wide at 1440 (5.85vw), alternating mint/lavender starting mint at left edge. On mobile let them shrink with vw (min ~32px).
- **Cream card:** inset **88px** left/right (6.1vw), **100px** top; card bottom ends ~y4980 leaving ~230px of stripes for the footer hashtag zone.
- **Wavy edge:** amplitude ~14px, wavelength ~150px, irregular hand-drawn feel. Implement as CSS `border-radius` NO - must be a wave: use an inline SVG `<path>` or CSS `mask` with a repeating wave. Bottom edge of card near footer has a larger, slower wave (amplitude ~30px, wavelength ~360px).
- **Content column:** centered, max-width **720px**; everything center-aligned.

## Vertical rhythm (top of section label to next, @1440)

hero top pad 200 -> eyebrow -> 16 -> Married! -> 48 -> locket img (width **460px**) -> 40 -> Oum & Non -> 24 -> body (2 lines, max-w 480px) -> 56 -> date block.
Section gap (end of one section to next label): **~240px**. Inside sections: label -> 56 -> content.
Agenda item: bow (width **256px**) -> 8 -> icon -> 24 -> time -> 4 -> label; gap between items **112px**.
Map: label -> 56 -> map -> 40 -> venue name -> 12 -> address.
Buttons row: 96 above, 48 gap to card bottom-wave; two buttons side by side, 24px gap (stack at <480px).
Footer hashtag: vertically centered in the bottom stripe zone, font Quicksand 600 40px, color `--cream`.

## Component sizing

| element | size @1440 |
|---|---|
| logo-hearts.png | w 460px |
| dresscode-cluster.png | w 450px |
| bows (agenda) | w 256px |
| agenda icons | h ~130-165px natural ratio (icon-registration w 220, icon-camera w 230, icon-dinner w 210, icon-afterparty w 186 - render near natural size) |
| map.png | w 640px, border-radius 40px, subtle 0 (no shadow in mock) |
| buttons | pill, 2px solid `--ink`, padding 16px 40px, radius 999px, Quicksand 600 24px, transparent bg; hover: bg `--ink`, text `--cream` |

## State-weight

Mock is a static poster: NO shadows, NO borders on sections, NO heavy emphasis anywhere. Only the buttons (added scope) get an outline; keep it 2px, no shadow, no gradient. Do not invent hover rings.

## Visual grouping

No dividers anywhere. Grouping is by whitespace only (the 240px section gap) plus the grey section labels.

## Decoration scatter plan (per-icon fidelity)

Use ONLY the provided PNGs in `site/assets/` (star-*, diamond-*, sparkle-*, cross-teal, starburst-orange). Scatter them absolutely-positioned inside the card's left/right margin bands (outside the 720px content column) roughly matching mock density: 3-5 per section side, sizes 24-90px, slight rotations (-25deg..25deg). Exact star-for-star position match NOT required (acceptable deviation); keep decorations off the text column and hide the smallest ones under 480px width. The oracle's few star colorways missing from assets (e.g. yellow star, red-orange star) are acceptable omissions - reuse existing assets instead, never recolor with CSS filters.

Agenda icons, bows, locket, dresscode cluster, map: EXACT assets at pinned sizes - these are content, not decoration.
