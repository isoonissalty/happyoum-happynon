# Swap in real art and tune the pool

Type: task
Status: open
Blocked by: 03, 04

## Question

The closing move: replace every placeholder in `site/assets/landing/` with the partner's
art, set `data-pool` on `.grid` to the number of tiles that actually arrived, and run the
checks.

- `node tools/landing-check.mjs` - holds every envelope item to the pocket edge and the
  hashtag, and the intro to one viewport at nine sizes
- `node tools/motion-check.mjs` - the entrance, the tile flash, the no-script fallback
- `node tools/pool-check.mjs` - the grid across pool sizes and a slow connection

Then look at the envelope by eye. No check compares the items against each other, and they
overlap by design; only a person can tell whether two die-cut cat heads at 46% overlap read
as affectionate or as one eating the other.

Done when all three checks pass against real art and the page has been looked at on a real
phone.
