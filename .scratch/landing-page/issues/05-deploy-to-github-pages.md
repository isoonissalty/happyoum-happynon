# Deploy to GitHub Pages

Type: task
Status: open

## Question

The repo has no git remote at all. `.github/workflows/pages.yml` is written and correct,
but nothing has ever been pushed, so the site has never been deployed and has never been
seen on a real phone over a real network.

Push to a public repo under `isoonissalty` and turn on Pages. The workflow publishes
`site/` only, so `docs/`, `tools/` and `.scratch/` stay in the repo without reaching the
deployed site - that separation is already correct and needs no change.

Decide and record: the repo name, which fixes the URL. `isoonissalty.github.io` serves at
the account root; any other name serves at `isoonissalty.github.io/<repo>`.

Not urgent - the user said this can wait - but it is unblocked, it blocks the og:image
work, and it is the only way to see the landing on a real device. Worth doing early
despite not being urgent.

Done when a Pages URL serves the landing and the invitation, and the URL is recorded on
the map.
