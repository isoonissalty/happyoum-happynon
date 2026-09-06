# Viewer: smaller picture, item card beside it

Type: task
Status: resolved
Blocked by: 14

## Question

User feedback, 2026-09-06: the picture the viewer opens is too big on desktop - the
ticket runs 89% of a 900px window - and each item should carry a short description
written like an online-game item tooltip. The copy is placeholder for now; the user
writes the real text later, so it must sit in plain HTML.

Decisions taken with the user:

- Desktop: picture about 55-60% of the window's height, the card beside it, the pair
  reading as roughly 40% of the screen.
- Mobile: the picture may shrink a little so the card fits under it without scrolling.
- Style: RPG/MMO item tooltip in the site's own palette - name, rarity line, two or
  three stat lines, a flavour quote in the script face. Rarity colours: mint for the
  strips (Rare), lavender for the cats (Epic), gold for the ticket (Legendary).

## Done when

- `landing-check.mjs` opens the viewer and asserts the picture's height band, that the
  right card and only that card shows, that the card sits inside the window and clear
  of the picture, and that Escape still closes.
- Both checks green. Reduced motion shows picture and card without animation.

## Answer

Built 2026-09-06. `.viewer-body` holds the picture and four static `.item-card` cards; the
script shows the card whose `data-item` matches the clicked item. Picture caps at 58svh
beside a 240-320px card on desktop; under 720px the pair stacks and the picture drops to
56svh, and the short-window query drops it to 52svh. `--gold` joined the base tokens.
`landing-check.mjs` opens the ticket and the cats at every viewport and asserts the height
band, the single matching card inside the window and clear of the picture, no sideways
scroll, and Escape closing. Each assertion was made to fail once before trusting it.
