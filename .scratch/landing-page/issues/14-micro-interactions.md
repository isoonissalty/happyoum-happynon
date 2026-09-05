# Micro-interactions everywhere they fit

Type: task
Status: open
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
