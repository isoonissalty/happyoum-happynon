# Invitation inner card max-width 1024px

Type: task
Status: resolved

## Question

User feedback, 2026-09-05: cap the invitation's card at 1024px, not the 1264px ticket 08
landed on.

Ticket 08 tried 1024 once and rejected it because the agenda labels wrapped - but that was
with the four-across timeline, which 08 then removed. With the single 720px column the
card only needs to hold the column plus a decoration band, and 1024 leaves 152px a side.
Checked against the inline offsets in `site/invitation.html`: the widest `.deco--lg`
reaches 188px out from the text edge, which at a 1024 card is still 52px inside the wave,
whose amplitude is 28px. Nothing clips.

## Where the cap bites

The card is `100vw - 2 * clamp(16px, 6.1vw, 88px)`, so it reaches 1024 at a 1166px
window. The rule goes in `@media (min-width:1167px)` for the same reason 08 scoped its
rule: `margin-inline:auto` replaces the `--card-inset` margins, and on any narrower window
it would zero them. Keep the cap a literal, per 08.

## Consequences to record

- `CONTEXT.md` striped ground: the frame becomes a stage from ~1167, not 1440.
- Ticket 09's premise changes: the band it measured as 272px is now 152px, so the "empty
  outer half" it describes mostly disappears. Note that on 09 rather than closing it.

## Done when

`tools/regress.mjs` baseline vs current: landing identical at every width, invitation
identical at 390 through 1100, differs from 1199 up. Card measures 1024 at 1199, 1440
and 1920 with no horizontal scroll.

## Answer

Built 2026-09-05. `.card{ max-width:1024px; margin-inline:auto }` inside
`@media (min-width:1167px)` in `site/styles.css`, replacing 08's 1264 rule at 1440.

Measured card width: 965.8 at 1100, 1023.8 at 1166, 1024.0 from 1167 up; the margin
steps 71.1 to 71.5px across the threshold, so there is no visible cliff. No horizontal
scroll at any width. `tools/regress.mjs` against the pre-change tree: invitation identical
at 390 through 1100, differs at 1199, 1440 and 1920 as intended. Every decoration sits
inside the band clear of the wave at 1440 by eye.

`CONTEXT.md` striped-ground entry now says the frame becomes a stage from a 1166px window.
