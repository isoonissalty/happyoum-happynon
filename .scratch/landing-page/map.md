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

## Not yet specified

- **The per-section screenshot feedback.** The user is walking the landing section by
  section with screenshots. That feedback is the input to the two visual tickets and will
  likely graduate into more of them. Nothing here can sharpen until it arrives.
- **How far the visual fix reaches.** Whether the fix lives in `landing.css` alone or has
  to reach `base.css`, and whether the invitation moves with it, is downstream of what the
  visual direction turns out to be.
- **Whether the invite panel needs work too.** Only the intro panel has been diagnosed.
  The invite panel reads calm against it, but it has not had the user's eye on it yet.
- **The share image.** A dedicated 1200x630 image is wanted, but its art is downstream of
  the visual direction.

## Out of scope

- **RSVP.** The button in `invitation.html` stays `href="#rsvp"` for now. Choosing a form,
  storing responses, and chasing replies is its own effort, and folding it in here would
  swallow the map.
- **A Thai-language site.** Would mean re-picking every typeface and re-tuning the layout
  around different metrics. A separate effort if it ever happens.
- **Redesigning the invitation.** In scope only if the visual direction forces it, which
  is tracked as fog above rather than assumed here.
