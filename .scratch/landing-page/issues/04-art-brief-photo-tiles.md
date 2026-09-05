# Art brief: photo tiles

Type: task
Status: open
Blocked by: 01, 02

## Question

Write the brief for the photo pool the intro panel's grid cycles through. About 20 candid
photos exist; the brief has to say which to pick, how to crop them, and how to name them.

Known constraints:

- **Square, named `tile-1.png` upward with no gaps.** A gap paints a broken-image icon.
- **Pool size drives behaviour.** Under four breaks the grid, exactly four fills it but
  never cycles, five or more cycles, eight or more gives every slot two spares and reads
  liveliest. `data-pool="8"` is set today and is being kept for now.
- **Photos crossfade in place**, so neighbouring photos in the pool should not clash when
  one replaces the other mid-grid.

Blocked on both visual tickets because the tiles are the intro panel's largest visual
element: a cream card behind them, a border treatment, or a different grid shape all
change the crop and the tonal range the photos need to sit in.

Done when the partner can select and crop from the ~20 without a second pass.
