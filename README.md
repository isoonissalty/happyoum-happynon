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
  photo booth strip, cat die-cuts, and ticket. Keep the file names; the layout is built
  against their intrinsic sizes. Then look at the envelope again: the automated checks
  verify each item against the pocket edge and the hashtag, but nothing checks the items
  against each other, and art with soft or translucent edges can read as a collision where
  flat placeholders did not.
- The RSVP button in `site/invitation.html` (`href="#rsvp"`) is a placeholder - replace it
  with the real RSVP form/link.
- Once the Pages URL is live, make `og:image` in both pages an absolute URL (link previews
  won't resolve a relative path).
