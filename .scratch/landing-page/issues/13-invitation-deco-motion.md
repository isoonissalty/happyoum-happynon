# Invitation decorations grow in and turn slowly

Type: task
Status: open

## Question

User feedback, 2026-09-05: the stars on the invitation should scale up gradually and
rotate slowly. Read as two motions on every `.deco`: an entrance that grows each piece
from nothing as its section scrolls into view, and an ambient loop after that - a slow
turn of a few degrees either way and a faint breathe in scale - so the scatter never sits
dead still.

## Constraints

- Every `.deco` carries an inline `transform: rotate(N)`. Animating `transform` would
  wipe it. Use the individual `rotate` and `scale` properties instead: they compose with
  `transform`, both act about the centre, and every browser this audience uses has them.
- Vary period and phase per piece so the field does not pulse in unison. Inline
  `--dur`/`--delay` on the pieces, or `nth-of-type` cycles, either is fine.
- The entrance gates on a `.motion` class the script adds, the way the landing does, so a
  blocked script renders the finished scatter rather than an empty one.
- `prefers-reduced-motion: reduce`: no loop, no entrance, the static scatter.
- Anything faster than a few seconds per cycle reads as a screensaver. Aim for 6 to 14s
  turns and a scale breathe of a few percent.

## Done when

At 1440, scrolling each section in grows its decorations in over roughly a second, then
each keeps turning slowly. Reduced motion renders the static page. The invitation has no
script today, so this adds one; verify the no-script render still matches the static
page. `tools/regress.mjs` shoots with animations disabled, so the landing must still be
identical at every width.
