/* Proves two pages render identically.
 *
 * Chromium's text rasterisation is not deterministic: repeat captures of one
 * unchanged page occasionally differ by a few dozen antialiased pixels. A single
 * md5 comparison therefore fails at random, and a tolerance would hide the small
 * regressions this exists to catch. Instead each page is sampled until the two
 * hash sets intersect - a shared hash is exact proof of an identical render,
 * with no threshold to tune. */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';

const WIDTHS = [390, 480, 768, 1024, 1100, 1199, 1440, 1920];
const MAX_SAMPLES = 4;
const [ , , urlA, urlB ] = process.argv;

const browser = await chromium.launch({ channel: 'chrome' });

async function shoot(url, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  // the webfonts swap and the artwork decodes after load; capturing before
  // either lands is what a fixed settle gambles on
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images]
      .filter((i) => !i.complete)
      .map((i) => new Promise((res) => { i.onload = i.onerror = res; })));
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  const shot = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return createHash('md5').update(shot).digest('hex');
}

let failed = 0;

for (const width of WIDTHS) {
  const a = new Set();
  const b = new Set();
  let shared = false;

  for (let n = 0; n < MAX_SAMPLES && !shared; n++) {
    a.add(await shoot(urlA, width));
    b.add(await shoot(urlB, width));
    shared = [...a].some((h) => b.has(h));
  }

  const samples = Math.max(a.size, b.size);
  if (shared) {
    console.log(`${String(width).padStart(5)}px IDENTICAL${samples > 1 ? ` (after ${samples} variants)` : ''}`);
  } else {
    failed++;
    console.log(`${String(width).padStart(5)}px DIFFERS - no shared render in ${MAX_SAMPLES} samples`);
  }
}

await browser.close();
console.log(failed ? `\nFAIL - ${failed} width(s) differ` : '\nPASS - all widths identical');
process.exit(failed ? 1 : 0);
