# Landing copy for one panel

Type: task
Status: resolved
Blocked by: 10

## Question

User feedback, 2026-09-05: with the landing down to one panel, tidy the text. Today the
copy is split across two panels as a reveal - "Oum & Non / ARE GETTING MARRIED / and..."
then "YOU ARE / #happyoumhappynon / [envelope] / invited!!". Read on one screen it repeats
itself and the "and..." scroll hook points at nothing.

## Proposal

    Oum & Non              Rouge Script, the names
    ARE GETTING MARRIED    Oswald, the fact
    and you are            Rouge Script in --label, the lead-in
    [ envelope ]
    invited!!              Rouge Script, the payoff
    ( Open invitation )
    #happyoumhappynon      small, below the button, as the invitation's footer does

The hashtag drops from headline to sign-off: as a headline it competed with the names.
English only, per the map's standing constraint. The landing still withholds the date.

## Done when

The panel reads top to bottom as one sentence, fits one viewport at the nine
`landing-check.mjs` sizes, and the entrance stagger in `motion-check.mjs` covers the new
lines in reading order.

## Answer

Built with 10, 2026-09-05, as proposed: names / ARE GETTING MARRIED / and you are /
envelope / invited!! / button / hashtag as a small sign-off in `--label`. The entrance runs
in that order - names at 0.15s, line 0.45s, lead 0.75s, pop at 1.3s, invited 2s, button
2.3s, hashtag 2.5s - and `motion-check.mjs` asserts the order and a spread of at least
1.5s. Measured reveal at 1440x900: names 423ms, line 723, lead 1023, first pop 1407,
invited 2274, button 2573, hashtag 2773.
