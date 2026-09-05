# Micro-interactions everywhere they fit

Type: task
Status: resolved
Blocked by: 10, 13

## Question

User feedback, 2026-09-05: wherever a micro-interaction fits, put one in - go all the way.
The two pages are almost entirely static once the entrance finishes. This ticket is the
inventory plus the build; the user prunes on sight.

## Inventory

Landing:

- Envelope items respond to hover and touch: the piece under the pointer lifts and
  straightens a little, the others settle back. Tapping the envelope replays the pop.
- The envelope idles with a slow bob so the cover is never frozen.
- "invited!!" arrives with a hand-drawn underline that draws itself after the pop.
- Button: lift on hover, press on active, the focus ring already exists.

Invitation:

- Hero pieces rise in on load in reading order, the locket last with a gentle sway.
- Bows wiggle once when their agenda item scrolls in; agenda items rise in sequence.
- The dress-code cluster and the map lift on hover; the map link zooms its image slightly.
- Buttons as on the landing. The calendar button shows its external-link intent on hover.
- The footer hashtag gets a subtle letter-spacing ease on hover.

Shared:

- One easing vocabulary in `base.css` (`--pop-ease` already exists; add a soft
  standard ease and a press duration) so the two pages feel like one hand.
- Every hover effect is also a focus-visible effect. Touch devices get the tap
  equivalents, never a stuck hover state.
- All of it off under `prefers-reduced-motion: reduce`.

## Done when

Each item on the inventory is present or explicitly struck with a reason, both pages
pass their checks, and reduced motion renders both pages static.

## Answer

Built 2026-09-05. Every item on the inventory is in; nothing struck.

Shared (`base.css`): `--ease-soft` and `--press` tokens, `rise` keyframes moved here from
the landing, `.btn` lifts 2px on hover and presses on `:active`, the outbound calendar
button slides a small arrow into its right padding on hover and focus. Hover-only effects
are fenced behind `(hover:hover) and (pointer:fine)` so a tap never leaves a stuck state;
`:active` carries the touch equivalent.

Landing: popped items lift and half-straighten under the pointer once `.landed`
(landing.js adds it after the last item is down, so the first hover does not inherit an
entrance delay); tapping the envelope tucks everything in and replays the pop; the
envelope bobs 6px on a 4s loop after the entrance; "invited!!" gets a hand-drawn lavender
underline that draws itself at 2.7s (an inline SVG with `pathLength="1"`); the sign-off
eases its letter-spacing on hover.

Invitation: the hero rises in reading order over the first second, the locket then sways
+-1.5deg on `rotate`; agenda items rise as they scroll in and their bow wiggles once;
the dress-code cluster lifts on hover; the map link lifts and its image scales 4% inside
its rounded clip; the footer hashtag eases letter-spacing on hover.

Verified: `landing-check.mjs` and `motion-check.mjs` PASS. Pixel diff of full-page
captures against the pre-change tree at 1440 after walking the page: the invitation is
identical, the landing differs only in the underline's rows. Probed at 1440x900: hover
transforms apply on the cat head, button, map and calendar arrow; the replay tucks and
re-pops; reduced motion renders every hero, agenda and decoration element at opacity 1
with no rotate, scale or translate applied.
