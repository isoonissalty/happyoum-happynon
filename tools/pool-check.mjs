/* The couple supplies however many photos they have, so the grid has to hold together at
   any pool size. Each case gets a real site directory with only that many tile files, and
   index.html rewritten to match - mutating the live page cannot work, because landing.js
   is deferred and has already read the attribute before any page script could change it. */
import { chromium } from 'playwright';
import { mkdtempSync, rmSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../site/', import.meta.url));
const CASES = [3, 4, 5, 6, 7, 8, null];   // null = the attribute missing entirely
const SLOTS = 4;

const browser = await chromium.launch({ channel: 'chrome' });
let fail = 0;
const bad = (m) => { console.log('  FAIL ' + m); fail++; };

for (const pool of CASES) {
  const dir = mkdtempSync(join(tmpdir(), 'pool-'));
  const n = pool === null ? 8 : pool;

  mkdirSync(join(dir, 'assets', 'landing'), { recursive: true });
  for (const f of ['logo-hearts.png', 'favicon.png']) copyFileSync(join(site, 'assets', f), join(dir, 'assets', f));
  for (const f of ['envelope-back.png', 'envelope-front.png', 'photo-strip.png',
                   'cat-head-1.png', 'cat-head-2.png', 'ticket.png']) {
    copyFileSync(join(site, 'assets', 'landing', f), join(dir, 'assets', 'landing', f));
  }
  for (let i = 1; i <= n; i++) {
    copyFileSync(join(site, 'assets', 'landing', `tile-${i}.png`), join(dir, 'assets', 'landing', `tile-${i}.png`));
  }
  for (const f of ['base.css', 'landing.css', 'landing.js']) copyFileSync(join(site, f), join(dir, f));

  let html = readFileSync(join(site, 'index.html'), 'utf8');
  html = pool === null
    ? html.replace(/ data-pool="\d+"/, '')
    : html.replace(/data-pool="\d+"/, `data-pool="${pool}"`);
  // slots beyond the pool must not point at a file this case does not have
  html = html.replace(/assets\/landing\/tile-(\d+)\.png/g,
    (m0, d) => `assets/landing/tile-${((+d - 1) % n) + 1}.png`);
  writeFileSync(join(dir, 'index.html'), html);

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const missing = [];
  page.on('requestfailed', (r) => missing.push(r.url().split('/').pop()));

  await page.goto('file://' + join(dir, 'index.html'), { waitUntil: 'domcontentloaded' });
  const read = await page.evaluate(() => {
    const g = document.querySelector('.grid');
    return g.getAttribute('data-pool');
  });

  const seen = new Set();
  let collisions = 0, hung = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 16000) {
    const live = await page.evaluate(() =>
      [...document.querySelectorAll('.tile img.is-shown')].map((i) => i.src.split('/').pop()));
    if (live.length === 4) {
      live.forEach((s) => seen.add(s));
      if (new Set(live).size !== 4) collisions++;
    } else { hung++; }
    await new Promise((r) => setTimeout(r, 250));
  }

  const broken = await page.evaluate(() =>
    [...document.querySelectorAll('.tile img.is-shown')].filter((i) => i.naturalWidth === 0).length);

  const label = pool === null ? 'no attr' : `pool ${pool}`;
  console.log(`${label.padEnd(8)} read=${String(read).padEnd(4)} distinct images seen=${seen.size} collisions=${collisions} broken=${broken}`);

  if (read !== (pool === null ? null : String(pool))) bad(`${label}: the page read data-pool as ${read}`);
  if (broken) bad(`${label}: ${broken} broken image(s) on screen`);
  if (hung) bad(`${label}: ${hung} sample(s) without four visible tiles`);
  if (missing.length) bad(`${label}: requested files that do not exist: ${[...new Set(missing)].join(', ')}`);

  // fewer photos than slots cannot fill the grid distinctly, so the only thing worth
  // asserting there is that it degrades rather than breaks
  if (n >= SLOTS && collisions) bad(`${label}: two slots showed the same photo (${collisions} samples)`);
  if (pool === null || n <= SLOTS) {
    if (seen.size !== Math.min(n, SLOTS)) bad(`${label}: the grid should hold still, saw ${seen.size} images`);
  } else if (seen.size < SLOTS + 1) {
    bad(`${label}: nothing ever rotated (saw only ${seen.size} images)`);
  }

  await page.close();
  rmSync(dir, { recursive: true, force: true });
}

/* --- a slow photo must not let two slots take the same image --- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // a megabyte photo on a weak link; placeholders are a few KB and decode instantly,
  // which is exactly why every other check misses this
  await page.route('**/tile-*.png', async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    route.continue();
  });
  await page.goto(new URL('index.html', new URL('../site/', import.meta.url)).href,
                  { waitUntil: 'domcontentloaded' });

  let worst = 4;
  const t0 = Date.now();
  while (Date.now() - t0 < 25000) {
    const live = await page.evaluate(() =>
      [...document.querySelectorAll('.tile img.is-shown')].map((i) => i.src.split('/').pop()));
    if (live.length === 4) worst = Math.min(worst, new Set(live).size);
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`slow photos   fewest distinct tiles on screen = ${worst}`);
  if (worst < 4) bad(`a slow photo let two slots show the same one (${worst} distinct)`);
  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS - the grid holds at every pool size');
process.exit(fail ? 1 : 0);
