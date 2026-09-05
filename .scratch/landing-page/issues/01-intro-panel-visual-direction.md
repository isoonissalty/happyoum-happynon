# Intro panel visual direction

Type: prototype
Status: open

## Question

Diagnosed from screenshots on 2026-09-05 and not yet confirmed by the user. Their
per-section feedback may point somewhere else entirely, and it wins over what follows.

The intro panel reads as unfinished, and the diagnosis is that content sits directly on
the full-bleed striped ground with no cream card beneath it. The invitation uses the same
stripe as a ~20px frame around a cream card and reads calm; the intro panel makes the
stripe the whole stage.

The consequence is measurable: `--stripe-w` is `clamp(32px, 5.85vw, 84px)`, so on a phone
"ARE GETTING MARRIED" in grey crosses a new stripe every 32px and its contrast changes
under every few letters. "Oum & Non" in Rouge Script, a thin face, has the same problem
and less weight to survive it.

What should the intro panel's ground be? Produce rough candidates to react to rather than
arguing it in the abstract - at minimum: the stripe kept but calmed, a cream card
introduced behind the content the way the invitation does it, and the stripe replaced by a
flat ground with the stripe demoted to an accent.

This ticket resolves the ground and the colour treatment only. Composition is
`Intro panel layout balance`.

**Waits on the user's per-section screenshot feedback** - they are walking the landing
section by section and that feedback is this ticket's real input.

Constraints: keep the change in `landing.css` if it can be done there. If a candidate
needs `base.css`, say so explicitly, because the invitation shares it and would need
`tools/regress.mjs` run against it.
