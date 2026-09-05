# Intro panel layout balance

Type: prototype
Status: open
Blocked by: 01

## Question

Diagnosed from screenshots on 2026-09-05 and not yet confirmed by the user. Their
per-section feedback may point somewhere else entirely, and it wins over what follows.

The intro panel is a full viewport tall, but every element sits in its top half: names,
grid, then "ARE GETTING MARRIED", and roughly 500px of bare ground below it on a 390x844
phone. `.intro-and` is in the markup but did not appear in a screenshot taken at rest,
which is worth confirming as intended rather than assumed.

How should the panel's vertical composition work? Options worth making concrete: centre
the stack in the viewport, let it fill the height with deliberate spacing, or keep it top-
weighted and put something in the lower half that earns its place and pulls the eye toward
the invite panel.

Blocked on `Intro panel visual direction` because the composition sits on whatever ground
that ticket picks - a cream card changes the available space and the margins.

Whatever is chosen must still pass `tools/landing-check.mjs`, which holds the intro to a
single viewport at nine window sizes including short laptops. That check passing is the
constraint the composition has to live inside, not an afterthought.
