# Invitation scatter density at desktop

Type: prototype
Status: open

## Question

Now that the invitation follows the mock at desktop (a 720px column in a 1264px card, see
[08](08-invitation-width.md)), the one visible gap left against
`docs/ui-specs/assets/wedding-site.png` at 1440 is the decoration scatter. The mock places
6-8 pieces per side per section, sized up to ~90px, spread across the whole 272px margin
band out to the wavy edge. The site places 3-4 per side, 24-70px, all within ~130px of the
column, so the outer half of the band reads empty at 1440 and wider.

Should the desktop scatter match the mock's density and spread? The design doc marked
star-for-star fidelity as an acceptable deviation, but that was written before the band
was this wide. If yes, the offsets live inline on the `.deco` images in
`site/invitation.html` and every `deco--lg` must still clear the wave at 1200, where the
band is 190px. A prototype at 1200, 1440 and 1920 is the cheapest way to react to it.

The mock also uses a yellow star and a red-orange star that have no asset; the design doc
says reuse existing pieces, never recolor with CSS filters.
