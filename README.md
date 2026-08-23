# Oum & Non - Wedding Invitation

The site lives entirely in `site/` as static HTML/CSS with no build step.

## Deploy (GitHub Pages via Actions)

GitHub Pages' "deploy from a branch" mode only serves `/` (repo root) or `/docs`, and this repo needs `docs/` free for private design specs - so deploy runs through a GitHub Actions workflow instead (`.github/workflows/pages.yml`), which publishes `site/` on every push to `main`.

One-time setup:

1. Settings -> Pages -> Source: **GitHub Actions**.
2. Push to `main`. The workflow builds and deploys automatically.

## Before sending invites

- The RSVP button (`href="#rsvp"`) is a placeholder - replace it with the real RSVP form/link.
- Once the Pages URL is live, make `og:image` in `site/index.html` an absolute URL (link previews won't resolve a relative path).
