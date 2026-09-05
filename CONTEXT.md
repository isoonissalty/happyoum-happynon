# Context

Glossary for the Oum & Non wedding site.

## Landing

`site/index.html`, served at `/`. The cover: names, photo grid, and the envelope that
opens. Deliberately withholds the date and venue - those are the invitation's job.

Two full-height panels, referred to by number:

- **Intro panel** (panel 1) - `.panel--intro`. Names, the photo grid, "ARE GETTING
  MARRIED". Sits directly on the striped ground with no cream card beneath it.
- **Invite panel** (panel 2) - `.panel--invite`. Cream ground, the hashtag, the envelope,
  and the button through to the invitation.

Not "home page" or "first page" - both are ambiguous between this and the invitation.

## Invitation

`site/invitation.html`, served at `/invitation.html`. Everything a guest acts on: date,
dress code, agenda, venue, RSVP. One long cream card on the striped ground.

## Striped ground

The mint/lavender vertical stripe from `base.css`, shared by both pages. Its **role**
differs per page and the distinction matters: a frame around the invitation's card, but
the full stage behind the intro panel.

The frame is only a frame up to 1440. It runs ~20px on a phone and tracks `--card-inset`
to 88px at the mock's 1440, where the invitation's card caps at 1264px. Past that the band
keeps widening with the window and the stripe becomes a stage on a wide monitor.

## Tile / pool

A **tile** is one of the four photo slots in the intro panel's grid. The **pool** is the
set of `tile-N.png` files the slots cycle through, declared as `data-pool` on `.grid`.
Pool size drives behaviour: under four breaks the grid, exactly four holds still, five or
more cycles.

## Envelope items

The four things that pop out of the envelope in the invite panel: photo strip, two cat
heads, ticket. Positioned against the pocket's top edge, which is derived from
`envelope-front.png`'s aspect ratio.

## Art

Hand-drawn assets under `site/assets/`. Everything in `assets/landing/` is currently a
**placeholder** - a flat labelled rectangle standing in for art that has not been drawn.
