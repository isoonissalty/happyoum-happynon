# Map: Finish the landing

Label: wayfinder:map
Charted: 2026-09-05

## Destination

Every decision about the landing's look and its remaining work is settled, leaving an
ordered task list that can be worked one piece at a time. The destination is the plan, not
the finished page - building it is the handoff after this map closes.

## Notes

Domain: a static site in `site/`, no build step, deployed to GitHub Pages by
`.github/workflows/pages.yml`. Read `CONTEXT.md` for the page and panel vocabulary before
opening any ticket - "หน้าแรก" was ambiguous enough to cost a charting round.

Skills every session on this map should consult: `grilling` and `domain-modeling` by
default; `prototype` for the two visual tickets; `frontend-design` where aesthetic
direction is being chosen.

Standing constraints settled while charting:

- **English only.** The current fonts (Oswald, Quicksand, Rouge Script) carry no Thai
  glyphs, so a Thai version means re-picking type across the whole site. Ruled out below.
- **The landing withholds the date.** The envelope opening is the payoff; a date line
  competing with it was considered and rejected.
- **Art comes from the partner.** Placeholders stay in place until then, and the checks
  are expected to pass against placeholders - they do today.
- **`base.css` is shared with the invitation.** Touching it means running
  `tools/regress.mjs` against the invitation before and after. Which file the visual fix
  lands in is still open, tracked as fog below.
- **Verification is scripted.** `tools/landing-check.mjs` (geometry at nine viewports),
  `motion-check.mjs`, `pool-check.mjs`. Landing-check passes today with placeholders.
- **The site publishes `site/` only.** `docs/`, `tools/` and `.scratch/` are in the repo
  but never reach the deployed site. The repo will be public and that is accepted.

## Decisions so far

<!-- one line per closed ticket -->

- [How the invitation spends width](issues/08-invitation-width.md) - the invitation
  follows the mock at desktop: the `>=1200` timeline block is gone, the page is the 720px
  column in a card tracking `--card-inset`, and the card caps at the mock's 1264px from
  1440. The design file the user sent is byte-identical to the repo's oracle. Hashtag stays
  `#happyoumhappynon` and the buttons stay. `CONTEXT.md` updated.

- **The user's feedback arrived, 2026-09-05**, and it retired the intro panel outright:
  tickets 01, 02 and 04 are superseded by [10](issues/10-landing-single-panel.md). The
  landing becomes one panel with the envelope as the cover; its copy is
  [11](issues/11-landing-copy.md). The invitation's card caps at 1024 instead of 08's 1264
  ([12](issues/12-invitation-card-1024.md)), its decorations grow in and turn slowly
  ([13](issues/13-invitation-deco-motion.md)), and both pages get a full pass of
  micro-interactions ([14](issues/14-micro-interactions.md)).

- [Landing collapses to one panel](issues/10-landing-single-panel.md) - one cream card
  with the invitation's wavy outline, now shared from `base.css`; the envelope pops on a
  timer above the fold. Grid, tile flash, parallax and `pool-check.mjs` are gone.
- [Landing copy](issues/11-landing-copy.md) - names / ARE GETTING MARRIED / and you are /
  envelope / invited!! / button / hashtag sign-off, entering in reading order.

- [Invitation card max-width 1024px](issues/12-invitation-card-1024.md) - the user's
  number, replacing 08's 1264; bites from a 1166px window, decorations still clear the wave.

- [Invitation decorations grow in and turn](issues/13-invitation-deco-motion.md) - the
  invitation gains its first script; pieces scale in once on scroll and drift on
  `rotate`/`scale`, static under reduced motion and without the script.

- [Micro-interactions](issues/14-micro-interactions.md) - buttons lift and press, the
  envelope items answer the pointer and the envelope replays on tap, the hero and agenda
  rise in, the map leans in; one easing vocabulary in `base.css`, all off under reduced
  motion.

## Not yet specified

- **How far the visual fix reaches.** Whether the fix lives in `landing.css` alone or has
  to reach `base.css`, and whether the invitation moves with it, is downstream of what the
  visual direction turns out to be. Ticket 08 landed without touching `base.css`, so the
  first change to reach it re-runs `tools/regress.mjs` on the other page.
- **How the single cream panel meets the stripe.** Ticket 10 built it as a card on the
  stripe, matching the invitation. The user has not yet ruled on it by eye.
- **The share image.** A dedicated 1200x630 image is wanted, but its art is downstream of
  the visual direction.

## Out of scope

- **RSVP.** The button in `invitation.html` stays `href="#rsvp"` for now. Choosing a form,
  storing responses, and chasing replies is its own effort, and folding it in here would
  swallow the map.
- **A Thai-language site.** Would mean re-picking every typeface and re-tuning the layout
  around different metrics. A separate effort if it ever happens.
- **Redesigning the invitation.** In scope only if the visual direction forces it, which
  is tracked as fog above rather than assumed here. The one carve-out is the invitation's
  behaviour across widths it does not currently use - the 768-1199 band and the unbounded
  card at the wide end - resolved as ticket 08 by following the mock. Its one leftover, the
  desktop scatter density, is ticket 09: fidelity to the mock, not a redesign.
