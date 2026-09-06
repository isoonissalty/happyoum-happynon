/* Holds the invitation's decoration scatter to the card at every width.
 *
 * Each piece carries a desktop and a phone placement (see the .deco block in
 * site/styles.css). Both are checked the same way: every rendered piece must sit
 * inside the cream card, so the wave mask never cuts one, and clear of every piece
 * of content - images by their box, text by the extent of its glyphs, because a
 * centred paragraph's element box spans the whole column. The count is asserted
 * too, so a placement that hides the scatter cannot pass as "nothing overlaps". */
import { chromium } from 'playwright';

const site = new URL('../site/', import.meta.url);
const invitation = new URL('invitation.html', site).href;

// width -> pieces that must render. 28 in all; the two beside the buttons hide while the
// buttons sit side by side, and 13 more hide on a 320px window (see .deco in styles.css)
const WIDTHS = [
  [320, 15], [360, 28], [390, 28], [430, 28], [480, 28],
  [768, 26], [900, 26], [1024, 26], [1100, 26], [1199, 26],
  [1440, 28], [1920, 28],
];
const EDGE_TOLERANCE = 2;
const CLEARANCE = 2;

const browser = await chromium.launch({ channel: 'chrome' });
let failures = 0;
const bad = (msg) => { failures++; console.log(`  FAIL ${msg}`); };

for (const [width, expected] of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(invitation, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((i) => !i.complete)
      .map((i) => new Promise((res) => { i.onload = i.onerror = res; })));
  });

  const report = await page.evaluate(() => {
    const box = (r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });
    // the cream is only guaranteed inside the wave band; a piece within the card's box
    // but on the band is cut by the mask, so the safe area is the box less the band
    const cardEl = document.querySelector('.card');
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;width:var(--wave-h);height:var(--wave-hb)';
    cardEl.appendChild(probe);
    const waveX = probe.offsetWidth, waveBottom = probe.offsetHeight;
    probe.remove();
    const outer = cardEl.getBoundingClientRect();
    const card = { l: outer.left + waveX, r: outer.right - waveX, t: outer.top + waveX, b: outer.bottom - waveBottom };
    const content = [];
    for (const el of document.querySelectorAll('.content img:not(.deco), .content .btn')) {
      content.push({ name: el.className || el.tagName, ...box(el.getBoundingClientRect()) });
    }
    for (const el of document.querySelectorAll('.content p, .content h1, .content h2')) {
      const range = document.createRange();
      range.selectNodeContents(el);
      content.push({ name: el.className || el.tagName, ...box(range.getBoundingClientRect()) });
    }
    const shown = [...document.querySelectorAll('.deco')].filter((d) => getComputedStyle(d).display !== 'none');
    return {
      card, content,
      shown: shown.map((d) => ({ name: d.getAttribute('src').replace('assets/', ''),
        section: d.parentElement.className, ...box(d.getBoundingClientRect()) })),
    };
  });

  console.log(`\n${width}px: ${report.shown.length} pieces rendered`);
  if (report.shown.length !== expected) bad(`${expected} pieces expected, ${report.shown.length} rendered`);

  for (const d of report.shown) {
    const c = report.card;
    if (d.l < c.l - EDGE_TOLERANCE || d.r > c.r + EDGE_TOLERANCE || d.t < c.t - EDGE_TOLERANCE || d.b > c.b + EDGE_TOLERANCE) {
      bad(`${d.section} ${d.name} reaches the wave: x ${Math.round(d.l)}..${Math.round(d.r)} of ${Math.round(c.l)}..${Math.round(c.r)}`);
    }
    for (const k of report.content) {
      const overlap = d.l < k.r - CLEARANCE && d.r > k.l + CLEARANCE && d.t < k.b - CLEARANCE && d.b > k.t + CLEARANCE;
      if (overlap) bad(`${d.section} ${d.name} sits on ${k.name} (deco x ${Math.round(d.l)}..${Math.round(d.r)} y ${Math.round(d.t)}..${Math.round(d.b)}; content x ${Math.round(k.l)}..${Math.round(k.r)} y ${Math.round(k.t)}..${Math.round(k.b)})`);
    }
  }
  await page.close();
}

await browser.close();
console.log(failures ? `\nFAIL - ${failures} problem(s)` : '\nPASS - every piece inside the card and clear of the content');
process.exit(failures ? 1 : 0);
