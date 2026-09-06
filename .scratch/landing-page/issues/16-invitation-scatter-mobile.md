# Invitation scatter on phones

Type: task
Status: resolved

## Question

User feedback 2026-09-06: "the stars on mobile did not show, I want to show them." Below
1200px the invitation rendered no decorations at all: `.deco--lg` was `display:none`
under 1200, `.deco--sm` under 480, and between 480 and 1199 the small pieces that did
render sat at fixed offsets outside the 640px column, which at those widths is outside
the card, so `.card{overflow:hidden}` clipped them.

## Answer

Each `.deco` now carries two placements in its inline custom properties, and a side
class (`deco--l`/`deco--r`) says which edge they hang from. Desktop (`--desk-x/y/w`) is
the old band placement, unchanged - the render at 1200, 1440 and 1920 is
geometry-identical to before. Below 1200 the phone placement applies: `--phone-d` is
the distance from the card's centre line to the piece's inner edge, `--phone-y` the
offset from the section top and `--phone-w` its width, all unitless and multiplied by
`--phone-unit: max(1px, 0.1157vw)`. Below ~864px every piece of content sits at its clamp() floor
in fixed px and centred, so a distance from the centre keeps a star beside the same
content at 360, 390, 430 and 768; from 864 up `--phone-unit` rides the same vw slope as the
content clamps, so the placement holds through the tablet zone.

Where there is room on a 342px card: beside the eyebrow and date block, beside section
labels, down both sides of the agenda column, and in the gaps between sections. Not
beside the locket, the invite paragraph, the dress code cluster or the map, which fill
the card. Pieces that only fit from a 360px window up carry `deco--tight` and are hidden
below; the two `.actions` pieces hide between 480 and 1199 where the buttons sit side by
side and span the card.

`tools/invitation-check.mjs` holds every rendered piece inside the card's wave band and
clear of every content box (glyph extents for text) at twelve widths, and asserts the
rendered count, so a placement that hides the scatter cannot pass.

Same round: the calendar event is "Oum & Non's Wedding"; the RSVP link's malformed
`rel` attribute is fixed; the invite copy's hard break is dropped under 360px where it
left "to" alone on a line; the landing's `.invited` margins gained the svh term every
other vertical measure on the cover already carried (the cover scrolled 2px at 1280x600).
