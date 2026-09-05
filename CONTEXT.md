# Context

Glossary for the Oum & Non wedding site.

## Landing

`site/index.html`, served at `/`. The cover: one cream card on the striped ground holding
the names, the envelope that opens, and the button through to the invitation. Deliberately
withholds the date and venue - those are the invitation's job.

A single **panel**, `.panel`, sized to fit one screen at every window size the checks
cover. The earlier two-panel landing (a photo-grid tease that a cream sheet slid over) was
retired on 2026-09-05 at the user's request.

Not "home page" or "first page" - both are ambiguous between this and the invitation.

## Invitation

`site/invitation.html`, served at `/invitation.html`. Everything a guest acts on: date,
dress code, agenda, venue, RSVP. One long cream card on the striped ground.

## Striped ground

The mint/lavender vertical stripe from `base.css`, shared by both pages, and on both a
frame around a cream **card** - the wavy-edged outline that also lives in `base.css`. The
landing's card fills the viewport; the invitation's runs the length of the page.

On the invitation the frame is only a frame up to 1440. It runs ~20px on a phone and tracks `--card-inset`
to 88px at the mock's 1440, where the invitation's card caps at 1264px. Past that the band
keeps widening with the window and the stripe becomes a stage on a wide monitor.

## Envelope items

The four things that pop out of the envelope on the landing: photo strip, two cat
heads, ticket. Positioned against the pocket's top edge, which is derived from
`envelope-front.png`'s aspect ratio.

## Art

Hand-drawn assets under `site/assets/`. Everything in `assets/landing/` is currently a
**placeholder** - a flat labelled rectangle standing in for art that has not been drawn.
