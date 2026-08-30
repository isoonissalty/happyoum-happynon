# Oum & Non - Wedding Invitation

The site lives entirely in `site/` as static HTML/CSS with no build step.

## Deploy (GitHub Pages via Actions)

GitHub Pages' "deploy from a branch" mode only serves `/` (repo root) or `/docs`, and this repo needs `docs/` free for private design specs - so deploy runs through a GitHub Actions workflow instead (`.github/workflows/pages.yml`), which publishes `site/` on every push to `main`.

One-time setup:

1. Settings -> Pages -> Source: **GitHub Actions**.
2. Push to `main`. The workflow builds and deploys automatically.

## Pages

- `site/index.html` - the landing page, served at `/`
- `site/invitation.html` - the invitation, served at `/invitation.html`

## Before sending invites

- Replace the placeholder art in `site/assets/landing/` with the real photos, envelope,
  photo booth strip, cat die-cuts, and ticket, keeping the file names. Then run
  `node tools/landing-check.mjs` and look at the page.
  - **Photos:** any number from five up. Set `data-pool` on the `.grid` element in
    `site/index.html` to how many `tile-N.png` files exist, numbered from 1 with no gaps.
    Five or fewer and the grid stays on its opening four instead of cycling.
  - **Keep `envelope-front.png` at 780x300.** The pocket's top edge - the line every
    envelope item is positioned against - is derived from that aspect ratio. Front art at a
    different ratio moves the edge and silently re-tunes all four items at once. The check
    will catch the consequence and report items failing their bounds.
  - If an item fails the "shows above the pocket" bound, its art is too short for its slot
    rather than mispositioned. Taller is the safe direction; a cat head squatter than about
    240x190 falls under.
  - **Look at the envelope yourself afterwards.** No check compares the items against each
    other, and they overlap hard by design: cat-head-1 loses 46% of its width behind
    cat-head-2, and the ticket 26%. Flat placeholders read as a tidy stack of cards; two
    die-cut heads at that overlap could read as one cat eating the other.
- The RSVP button in `site/invitation.html` (`href="#rsvp"`) is a placeholder - replace it
  with the real RSVP form/link.
- Once the Pages URL is live, make `og:image` in both pages an absolute URL - link previews
  will not resolve a relative path. `logo-hearts.png` is 499x446, under the 1200x630 a large
  preview card needs, so consider a dedicated share image at that size.
