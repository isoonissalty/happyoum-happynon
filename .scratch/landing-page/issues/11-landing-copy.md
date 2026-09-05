# Landing copy for one panel

Type: task
Status: open
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
