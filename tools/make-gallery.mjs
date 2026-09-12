/* Turns the gallery's originals into the two derived copies the page serves.

   Reads assets-src/gallery/<roll>/ - whatever the camera or the export named them - and
   writes site/assets/gallery/thumb/<roll>-NN.jpg and full/<roll>-NN.jpg. The originals
   never ship; only these two do.

   sips is macOS's own image tool, so the repo gains no dependency and keeps its
   no-build-step property.

       node tools/make-gallery.mjs

   Names are positional, so re-running overwrites in place and the markup never changes.
   To reorder a roll, rename its originals so they sort differently and run it again. */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(repo, 'assets-src', 'gallery');
const out = join(repo, 'site', 'assets', 'gallery');

const ROLLS = ['oum-by-non', 'non-by-oum', 'us-two'];
const PER_ROLL = 24;
const THUMB = 300;       // the tile, at roughly twice its painted size
const FULL = 1600;       // the lightbox's long edge
const QUALITY = 80;

const sips = (...args) => execFileSync('sips', args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

const dimensions = (file) => {
  const text = sips('-g', 'pixelWidth', '-g', 'pixelHeight', file);
  const read = (key) => Number(text.match(new RegExp(`${key}:\\s*(\\d+)`))[1]);
  return { width: read('pixelWidth'), height: read('pixelHeight') };
};

// the export numbers files as it pleases, so _10 must not sort before _2
const collate = new Intl.Collator('en', { numeric: true }).compare;

// a stale file from a previous run would ship as a photo nothing links to
for (const kind of ['thumb', 'full']) {
  rmSync(join(out, kind), { recursive: true, force: true });
  mkdirSync(join(out, kind), { recursive: true });
}

let written = 0;

for (const roll of ROLLS) {
  const files = readdirSync(join(src, roll))
    .filter((name) => /\.(jpe?g|png)$/i.test(name))
    .sort(collate);

  if (files.length !== PER_ROLL) {
    console.error(`${roll}: ${files.length} photos, ${PER_ROLL} expected - names are positional, so this has to be exact`);
    process.exit(1);
  }

  files.forEach((name, i) => {
    const from = join(src, roll, name);
    const to = `${roll}-${String(i + 1).padStart(2, '0')}.jpg`;
    const { width, height } = dimensions(from);

    // scaling up would cost bytes and buy nothing, so the long edge only ever comes down
    const full = ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY)];
    if (Math.max(width, height) > FULL) full.push('-Z', String(FULL));
    sips(from, ...full, '--out', join(out, 'full', to));

    // a square thumb is the short edge brought to THUMB, then a centred crop - sips
    // scales one named edge at a time, so which one depends on the shape
    const edge = width < height ? '--resampleWidth' : '--resampleHeight';
    sips(from, edge, String(THUMB), '-c', String(THUMB), String(THUMB),
      '-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY),
      '--out', join(out, 'thumb', to));

    written++;
  });

  console.log(`${roll}: ${files.length} photos`);
}

console.log(`\n${written} photos, two copies each, in site/assets/gallery`);
