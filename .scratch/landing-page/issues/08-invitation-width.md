# How the invitation spends width

Type: grilling
Status: resolved

## Question

Two ends of one question: what the invitation does with horizontal space it is not
currently using. The mid band has no treatment at all, and the wide end has one that never
stops growing.

## The mid band: 768 to 1199

The invitation already has a designed desktop composition - `site/styles.css:271`,
`@media (min-width:1200px)`: the agenda becomes a left-to-right timeline, `.content`
drops its 720px cap for a padding band, and the decorations re-anchor to `--y-lg`. It
reads as the intended poster at 1440 and 1920.

Nothing owns the band below it. Measured on 2026-09-05 against `site/invitation.html`:

| viewport | `.content` | `.card` | page height |
| --- | --- | --- | --- |
| 390 | 342 | 342 | 3362 |
| 768 | 674 | 674 | 3336 |
| 1024 | 720 | 899 | 4006 |
| 1199 | 720 | 1053 | 4684 |
| 1440 | 1264 | 1264 | 3891 |
| 1920 | 1744 | 1744 | 3967 |

From 1024 to 1199 the text column stays pinned at its 720px cap while the card keeps
growing with the viewport, so a mobile-width column sits stranded in a wide cream card.
`.deco--lg` is hidden across the whole band (`site/styles.css:245`), leaving only the
small decorations in margins wide enough to carry the large ones. 1199 is the tallest the
page ever gets - taller than the phone. Then 1200 arrives as a cliff, not a ramp.

How should the invitation behave across that band? Four framings, and picking between
them is the first job:

- **Fill the gap.** Keep the 1200 composition as the top end and give 768-1199 a
  treatment of its own - the column grows, the agenda stays stacked or goes to a 2x2.
- **Lower the cliff.** Move the desktop breakpoint down so the timeline and the wide
  column start earlier. The comment at `site/styles.css:265` pins 1200 to where
  `.deco--lg` begins showing, so this means re-deciding the decoration thresholds too.
- **Cap the vertical scale.** Freeze the `vw`-driven measures once the column stops
  growing, so the band holds its proportions instead of stretching. The smallest change of
  the four, and possibly enough on its own. Same move as capping the card below.
- **Redesign the top end.** Only if the >=1200 poster itself reads wrong, which the
  screenshots do not suggest.

The mechanism behind the height, worth naming because it is the lever a fix pulls: almost
every vertical measure on the page is `vw`-based - 45 occurrences in `styles.css`, 11 in
`base.css`, including `--section-gap: clamp(144px, 16.67vw, 240px)` and
`--card-inset: clamp(16px, 6.1vw, 88px)`. So the whole composition keeps scaling with the
window while the text column is hard-capped. Measured section heights from 1024 to 1199
grow by the viewport ratio almost exactly (1.171):

| section | 1024 | 1199 |
| --- | --- | --- |
| hero | 831 | 981 |
| dresscode | 328 | 384 |
| agenda | 1364 | 1595 |
| where | 458 | 536 |
| actions | 94 | 111 |

Below 1200 the page answers a wider window by growing taller, which is the opposite of
what the width is for. Above it the desktop block overrides `--section-gap` down to
`clamp(140px, 11.1vw, 176px)` and spends the width sideways instead.

Reproduce: serve `site/` (`python3 -m http.server 8899 --directory site`), then drive
Playwright over the widths above for full-page screenshots plus the `.content` / `.card`
bounding boxes. The widths match `tools/regress.mjs`. Run the script from the repo root -
`playwright` resolves out of `./node_modules`, so a script sitting in a temp directory
fails with `ERR_MODULE_NOT_FOUND`.

## The wide end: the card never stops growing

Settled by the user on 2026-09-05: **the card should carry a max-width**, the way an
ordinary web layout bounds its content column. The value is left open below.

What the cap is *not* for: line length is already bounded. From 1920 up the text band caps
at 1120px, the decorations freeze at fixed offsets from the section edge, and the page
height freezes at 3967 - the comment at `site/styles.css:279` is accurate, the scatter does
follow the content inwards rather than stranding in cream. Nothing gets harder to read on a
wider monitor.

What does grow without bound is the cream card itself, because `--card-inset` tops out at
88px and the card takes everything else:

| viewport | `.card` | text band | page height |
| --- | --- | --- | --- |
| 1440 | 1264 | 934 | 3891 |
| 1920 | 1744 | 1120 | 3967 |
| 2560 | 2384 | 1120 | 3967 |
| 3440 | 3264 | 1120 | 3967 |

So on a wide monitor a 1120px composition floats in a 3264px cream slab. That is the
defect, and a max-width is the right instrument for it.

**What still has to be decided, and it is not just a number.** `CONTEXT.md` pins the
striped ground's role on the invitation as "a ~20px frame around the invitation's card",
explicitly contrasted with "the full stage behind the intro panel", and says the
distinction matters. Cap the card at 1264 and a 3440 monitor gives 1088px of stripe per
side - that is a stage, not a frame, and the invitation would take on the landing's
treatment. Two ways out:

- **Keep the stripe a frame.** A bounded wrapper stops the card growing while the stripe
  stays proportionally narrow - the card sits in a page that is itself capped.
- **Accept a card on a stage.** Cheaper, but `CONTEXT.md` has to be updated in the same
  change, because the vocabulary would no longer be true.

The number follows from that call, not the other way round.

## Constraints

- `site/base.css` is shared with the landing - `--card-inset` and `--content-pad-y` both
  live there. A fix that reaches it must run `tools/regress.mjs` against the landing
  before and after, the mirror of the rule the map already carries for the other
  direction.
- Ticket 01 may also reach `base.css`. Whichever lands second re-runs the other page's
  checks; this ticket is not blocked on it, because the gap lives in `styles.css`.
- There is no `invitation-check.mjs`. `tools/landing-check.mjs` holds geometry at nine
  viewports for the landing only, so nothing scripted guards the invitation across widths
  today. Whether this ticket should leave one behind is part of the question.

## Answer - the wide end only

Settled and shipped on 2026-09-05. The mid band (768-1199) is still open, so this ticket
stays `open`.

`.card` caps at **1024px**, set inside the existing `@media (min-width:1200px)` block in
`site/styles.css` with `margin-inline: auto` centring it. Everything below 1200 keeps the
`--card-inset` margins untouched, which leaves the open mid-band question undisturbed.

The cap must be a literal, not a max-width computed from `--card-inset`. Restating the
inset through `calc` on the same block was tried first and shifted the 1440 render: the
calc lands a fraction of a pixel off the margin path, enough to move the wave mask.

`CONTEXT.md`'s striped-ground entry now records that the stripe is a stage on any desktop,
since the frame wording stopped being true from 1200 up.

### The cost, measured

1024 is narrower than the desktop composition was drawn for. `.content`'s 165px scatter
padding is fixed - it is the floor that keeps the largest decoration clear of the wavy edge
- so the whole reduction comes out of the text column:

| | before | after |
| --- | --- | --- |
| `.card` at 1440 / 1920 | 1264 / 1744 | 1024 / 1024 |
| section width | 934 / 1120 | 694 / 694 |
| agenda column | ~213 | ~150 |

Two agenda labels now wrap to two lines - "Guest registration" and "Dinner reception" -
which contradicts the intent recorded at `site/styles.css`'s agenda type rules, that the
type steps down "to keep every item name on one line". Measured wrap threshold: the labels
hold one line from a **1180px** card upward and wrap at 1100 and below.

So a 1024 card and the current desktop poster do not both fit. Either the cap rises to
~1180 (1264 gives it margin, and is the card's natural width at 1440), or the desktop block
is re-tuned around the narrower card - smaller scatter padding with the decorations
re-placed, or an agenda that is not a four-across row. Open.

Verified:

- `tools/regress.mjs` baseline vs current: **landing identical at all eight widths**;
  invitation identical at 390-1199, differs at 1440 and 1920, which is the intended change
- `tools/landing-check.mjs` PASS
- card 1053 at 1199, 1024 at 1200 / 1440 / 1920 / 2560; `scrollWidth` equals `innerWidth`
  at every width, so `body`'s `overflow-x: hidden` is not clipping anything

## Answer - both ends, superseding the 1024 cap

Settled on 2026-09-05 against the mock. The user re-sent the design file; it is
byte-identical to `docs/ui-specs/assets/wedding-site.png`, so every desktop deviation was a
choice made after the oracle was pinned, and the user chose to **follow the mock** at
desktop. That answers both ends at once:

- **Mid band and top end: the mock, scaled.** The `>=1200` desktop block is gone - no
  timeline agenda, no tightened `--section-gap`, no widened `.content`. From 768 up the
  page is the mock's single 720px column in a card that tracks `--card-inset`, which is
  what the mock does at 1440. The 1200 cliff is gone with the block; `.deco--lg` still
  appears from 1200, where the margin band is first wide enough for it.
- **Wide end: `.card` caps at 1264px**, the mock's own card width at 1440, inside
  `@media (min-width:1440px)` in `site/styles.css`. Scoped there because
  `margin-inline: auto` replaces the `--card-inset` margins - on any window where the cap
  does not bite it zeroes them and the card fills the viewport. The first attempt put the
  rule on `.card` unscoped and `tools/regress.mjs` caught it at every width.
- The `--y-lg` desktop offsets on the agenda scatter were only there for the short
  timeline section, so they are gone from `invitation.html`.
- Not changed: the hashtag stays `#happyoumhappynon` (the user's call; the mock reads
  `#oumnonhappyhappy`), and the RSVP / calendar buttons stay.

Measured after the change:

| viewport | `.card` | `.content` | page |
| --- | --- | --- | --- |
| 1199 | 1053 | 720 | 4684 |
| 1200 | 1054 | 720 | 4688 |
| 1440 | 1264 | 720 | 5576 |
| 1920 / 2560 | 1264 | 720 | 5577 |

The 1440 page height matches the figure the old desktop comment recorded for the mock.

Verified:

- `tools/regress.mjs` baseline (working tree before this change) vs current: invitation
  identical at 390-1199, differs at 1440 and 1920 as intended; landing identical at all
  eight widths (`base.css` untouched)
- `tools/landing-check.mjs` PASS
- `CONTEXT.md` striped-ground entry rewritten: frame up to 1440, stage beyond

Left for the map: at 1440 the mock scatters 6-8 decorations per side per section, up to
~90px, spread right out to the wavy edge. The site has fewer, smaller ones hugging the
column. That is the one visible gap remaining against the mock and is charted as its own
ticket.
