# Invitation decorations grow in and turn slowly

Type: task
Status: resolved

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

## Answer

Built 2026-09-05. `site/invitation.js` (new, deferred) adds `.motion` and grows each
`.deco` in once via an IntersectionObserver; `site/styles.css` carries the motion.

- Entrance: `scale` 0 to 1 over 900ms on `--pop-ease`, opacity over 400ms, offset 0 /
  140 / 280ms by position in the section.
- Drift: `deco-drift`, a swing of +-4deg with a 5% breathe, at 9 / 12 / 15s periods cycled
  by position, every third piece reversed. Keyframes start at rest and the animation
  starts where the transition ends, so there is no snap at the handover.
- The entrance is a transition and the drift an animation because an animation on `scale`
  would override a transition on it; both compose with the inline `transform: rotate()`
  through the individual `scale` / `rotate` properties.

Probed at 1440x900: hero pieces at scale 0 / opacity 0 at 60ms, at 1.01 / 1 by 460ms,
rotating by 2s; agenda pieces stay hidden until scrolled to, then land at opacity 1.
Reduced motion and no-script both render every piece at opacity 1 with no scale or
rotate applied.
