# Absolute og:image URL

Type: task
Status: open
Blocked by: 05

## Question

Both pages set `og:image` to a relative path (`assets/logo-hearts.png`). Link previews do
not resolve relative paths, so a link shared to LINE or Messenger renders without its
image - which is exactly how this invitation will be sent.

Make `og:image` absolute in `site/index.html` and `site/invitation.html` once the Pages URL
exists.

Separately worth knowing: `logo-hearts.png` is 499x446, under the 1200x630 a large preview
card wants. A dedicated share image is desirable but its art is downstream of the visual
direction, so it is on the map as fog rather than in this ticket.

Done when a link to the deployed site renders a preview card with an image in at least one
real chat app.
