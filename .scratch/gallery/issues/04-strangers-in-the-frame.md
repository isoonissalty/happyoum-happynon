# Gallery: keep strangers' faces out of the photos, and the invitation out of search

Type: task
Status: open
Blocked by: 02

## Question

The repo is public and so are the photos: anyone can pull the 1600px copy out of
`site/assets/gallery/full/`, and the names are a guessable `NN` sequence. Go through all 72
and deal with any frame where someone other than the two of us is close enough to the
camera to be recognised.

## Answer

Two halves. Search is closed; the photo edits are Oum and Non's to make.

### Out of search - done

Both pages carry `<meta name="robots" content="noindex, noimageindex, nofollow">` and
`site/robots.txt` disallows every crawler. That stops the invitation and its photos being
found; it does nothing about the files being fetchable by anyone who thinks to look, since
the repo is public and Pages on the Free plan needs it to be.

### The three frames - to edit by hand

All 72 read at full size. Three need the work, all in "Non, by Oum":

- **02**, the concert - fans either side of him, faces legible.
- **06**, the theme park - a woman and a child walking past, the clearest strangers in the
  gallery. A crop that loses them also loses the box of egg tarts; the frog survives.
- **18**, the restaurant - the diners at the next two tables.

A `CROPS` table in `make-gallery.mjs` was tried and then taken back out: the edit belongs in
the originals, where it can be judged by eye, not in a table of fractions. Edit the photo in
`assets-src/gallery/non-by-oum/`, re-run `node tools/make-gallery.mjs`, and both copies
follow. Cropping beats blurring - a blurred face is still a face that was published.

Deliberately not on the list: **us-two-09** (the third person between Chip and Dale is Oum),
and **us-two-21** with a dozen frames like it, where a crowd stands well behind the subject
in a public place - faces small, nobody the subject, and no crop that removes them leaves a
photo.
