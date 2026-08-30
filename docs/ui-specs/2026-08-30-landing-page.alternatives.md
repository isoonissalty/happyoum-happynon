# Landing page - alternative structural approaches

Approach A ("cream panel slides up over the stripes") was chosen on 2026-08-30 and is
specified in `2026-08-30-landing-page.design.md`. B and C are recorded here so the
decision can be revisited without re-deriving the trade-offs.

All three carry the same content, copy, and motion beats. They differ only in how the
landing page inherits the invitation's CI: the striped mint/lavender ground, the cream
card, and the hand-drawn wavy edge.

## B. One continuous wavy card, two panels inside it

Reuse `.card` / `.card-inner` unchanged, sized to roughly two viewport heights, with the
two panels as sections inside it. The landing then looks like the invitation's own card,
scrolled to its first screen.

**For**
- Strongest visual continuity. A guest who scrolls through to the invitation never sees
  the frame change.
- No new wave code at all.

**Against**
- The card's outline is an *intersection* of horizontal waves on `.card` and vertical
  waves on `.card-inner`, with `mask-size` expressed in percentages tuned for a 3891px
  card and a deliberately slower bottom wave. On a ~200svh box those amplitudes read
  wrong, and correcting them means re-entering the mask composition that took three
  commits to stabilise (`5411749`, `0ccfbd9`, `0003fb6`).
- The card's `overflow:hidden` clips anything that leaves it, which fights the
  small-to-big pop that wants to overshoot the envelope.
- Both `mask-*` and `-webkit-mask-*` blocks must stay in lockstep; every future landing
  tweak inherits that hazard.

**Pick this if** the landing and the invitation should read as one continuous document
rather than a cover and its contents.

## C. Flat - both panels on the stripes, one static wavy seam

Panel 1 sits on the striped ground, panel 2 is a cream block below it, and a single
static wavy seam divides them. Parallax is limited to content inside each panel drifting
at different rates.

**For**
- Simplest and safest. One wave used as a plain `background-image` on a divider strip,
  no overlap, no sticky positioning, no iOS sticky-scroll edge cases.
- Cheapest to reason about and to change later.

**Against**
- Reads as two stacked sections rather than a story. The wireframe's "scrolling and
  content would parallax show next page content" is the point of the page, and a fixed
  seam delivers the weakest version of it.
- No signature moment. The flashing tile grid and the envelope pop then carry the whole
  page, and neither is tied to the CI.

**Pick this if** the scroll choreography turns out to be fragile on real devices and the
page needs to degrade to something dependable.
