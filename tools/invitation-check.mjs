/* Holds the invitation's decoration scatter to the card at every width.
 *
 * Each piece carries a desktop and a phone placement (see the .deco block in
 * site/styles.css). Both are checked the same way: every rendered piece must sit
 * inside the cream card, so the wave mask never cuts one, and clear of every piece
 * of content - images by their box, text by the extent of its glyphs, because a
 * centred paragraph's element box spans the whole column. The count is asserted
 * too, so a placement that hides the scatter cannot pass as "nothing overlaps". */
import { chromium, firefox, webkit } from 'playwright';

const site = new URL('../site/', import.meta.url);
const invitation = new URL('invitation.html', site).href;

// width -> pieces that must render. 39 in all, and three rules thin them (see .deco in
// styles.css): the 13 deco--desk fillers need the margin band, so they only show from
// 1200 up; the two beside the buttons hide while the buttons sit side by side; and the
// 9 deco--tight pieces hide on a 320px window.
const WIDTHS = [
  [320, 17], [360, 26], [390, 26], [430, 26], [480, 26],
  [768, 24], [900, 24], [1024, 24], [1100, 24], [1199, 24],
  [1440, 39], [1920, 39],
];
const EDGE_TOLERANCE = 2;
const CLEARANCE = 2;

// the gallery's shape: three rolls of 24. The two strip rolls run their 24 frames in one
// scrolling row; "Us two" keeps three tiles a row. Neither tile size is asserted in px -
// both ride the column, which rides the card inset
const ROLLS = 3;
const PER_ROLL = 24;
const PER_GRID_ROW = 3;
const TILE_TOLERANCE = 1.5;

const browser = await chromium.launch({ channel: 'chrome' });
let failures = 0;
const bad = (msg) => { failures++; console.log(`  FAIL ${msg}`); };

for (const [width, expected] of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(invitation, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // a lazy tile below the fold is never fetched, so waiting on its load event never
    // returns - and the tiles take their size from the grid rather than from the photo
    await Promise.all([...document.images]
      .filter((i) => !i.complete && i.loading !== 'lazy')
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
    for (const el of document.querySelectorAll('.content img:not(.deco), .content .btn, .content .tile')) {
      const r = box(el.getBoundingClientRect());
      // a frame scrolled off the end of a strip still reports a box out in the margin
      // band, where nothing of it is painted, so it is clipped to its scroller first
      const scroller = el.closest('.tiles');
      if (scroller && getComputedStyle(scroller).overflowX !== 'visible') {
        const s = scroller.getBoundingClientRect();
        r.l = Math.max(r.l, s.left);
        r.r = Math.min(r.r, s.right);
        if (r.r <= r.l) continue;
      }
      content.push({ name: el.className || el.tagName, ...r });
    }
    for (const el of document.querySelectorAll('.content p, .content h1, .content h2, .content h3')) {
      const range = document.createRange();
      range.selectNodeContents(el);
      content.push({ name: el.className || el.tagName, ...box(range.getBoundingClientRect()) });
    }
    const shown = [...document.querySelectorAll('.deco')].filter((d) => getComputedStyle(d).display !== 'none');
    return {
      card, content,
      column: box(document.querySelector('.content').getBoundingClientRect()),
      // body{overflow-x:hidden} hides a spill from a scroll test, so the layout is measured instead
      pageWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      rolls: [...document.querySelectorAll('.roll')].map((roll) => {
        const tiles = roll.querySelector('.tiles');
        return {
          name: roll.querySelector('h3').textContent,
          strip: roll.classList.contains('roll--strip'),
          // a strip has to overflow its scroller, or its 24 frames were never in one row
          scrolls: tiles.scrollWidth > tiles.clientWidth,
          scroller: box(tiles.getBoundingClientRect()),
          tiles: [...roll.querySelectorAll('.tile')].map((t) => box(t.getBoundingClientRect())),
        };
      }),
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

  // the gallery: every tile square, a strip's 24 frames in one scrolling row, the grid's
  // three to a row, and nothing of either past the column
  if (report.rolls.length !== ROLLS) bad(`${ROLLS} rolls expected, ${report.rolls.length} rendered`);
  for (const roll of report.rolls) {
    if (roll.tiles.length !== PER_ROLL) bad(`${roll.name}: ${PER_ROLL} tiles expected, ${roll.tiles.length} rendered`);
    // rows are clustered rather than keyed on an exact top: fractional column widths
    // leave neighbours in one row a sub-pixel apart
    const rows = [];
    for (const t of roll.tiles) {
      const row = rows.find((r) => Math.abs(r.top - t.t) < 4);
      if (row) row.n++; else rows.push({ top: t.t, n: 1 });
    }
    if (roll.strip) {
      if (rows.length !== 1) bad(`${roll.name}: ${rows.length} rows, not the strip's one`);
      if (!roll.scrolls) bad(`${roll.name}: the strip does not scroll - its frames fit the column`);
    } else {
      for (const r of rows) if (r.n !== PER_GRID_ROW) bad(`${roll.name}: ${r.n} tiles on the row at y ${Math.round(r.top)}, not ${PER_GRID_ROW}`);
      if (rows.length !== PER_ROLL / PER_GRID_ROW) bad(`${roll.name}: ${rows.length} rows, not ${PER_ROLL / PER_GRID_ROW}`);
    }
    for (const t of roll.tiles) {
      const w = t.r - t.l, h = t.b - t.t;
      if (Math.abs(w - h) > TILE_TOLERANCE) bad(`${roll.name}: a tile is ${w.toFixed(1)}x${h.toFixed(1)}, not square`);
      // a strip's frames run past the column by design; what must stay inside it is the
      // scroller that clips them
      if (roll.strip) continue;
      const c = report.column;
      if (t.l < c.l - EDGE_TOLERANCE || t.r > c.r + EDGE_TOLERANCE) {
        bad(`${roll.name}: a tile leaves the column: x ${Math.round(t.l)}..${Math.round(t.r)} of ${Math.round(c.l)}..${Math.round(c.r)}`);
      }
    }
    if (roll.strip) {
      const s = roll.scroller, c = report.column;
      if (s.l < c.l - EDGE_TOLERANCE || s.r > c.r + EDGE_TOLERANCE) {
        bad(`${roll.name}: the strip leaves the column: x ${Math.round(s.l)}..${Math.round(s.r)} of ${Math.round(c.l)}..${Math.round(c.r)}`);
      }
    }
  }
  if (report.pageWidth > report.windowWidth) {
    bad(`the page lays out ${report.pageWidth}px wide in a ${report.windowWidth}px window`);
  }

  await page.close();
}

/* --- the lightbox: arrows and Escape, wrapping inside one roll ---
   Every assertion here runs under reduced motion, which is where invitation.js
   returns early: the wiring has to sit above that return or a tile click navigates
   to the photo's path instead of opening the dialog. */
// one tile of a roll, by their positions on the page
const tile = (page, roll, n) => page.locator('.roll').nth(roll).locator('.tile').nth(n);

// the file name of the photo the lightbox is showing, or null when it is closed
const showing = (page) => page.evaluate(() => {
  const d = document.querySelector('.lightbox');
  if (!d || !d.open) return null;
  return (d.querySelector('.lb-img').getAttribute('src') || '').split('/').pop();
});

for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(invitation, { waitUntil: 'networkidle' });
  console.log(`\nlightbox at ${width}px`);

  const before = failures;
  let at;

  await tile(page, 0, PER_ROLL - 1).click();
  at = await showing(page);
  if (at !== 'oum-by-non-24.jpg') bad(`the lightbox opened on ${at}, not the tile that was clicked`);

  // the photo itself decoded, and is drawn at its own proportions rather than stretched
  // to the frame's minimum square
  const shape = await page.evaluate(async () => {
    const img = document.querySelector('.lb-img');
    if (!img.complete) await new Promise((res) => { img.onload = img.onerror = res; });
    const r = img.getBoundingClientRect();
    return { natural: img.naturalWidth / img.naturalHeight, drawn: r.width / r.height, w: img.naturalWidth };
  });
  if (!shape.w) bad('the lightbox photo did not load');
  else if (Math.abs(shape.natural - shape.drawn) > 0.01) {
    bad(`the photo is drawn at ${shape.drawn.toFixed(3)}, not its own ${shape.natural.toFixed(3)}`);
  }

  await page.keyboard.press('ArrowRight');
  at = await showing(page);
  if (at !== 'oum-by-non-01.jpg') bad(`past roll 1's last tile the lightbox shows ${at}, not roll 1's first`);

  await page.keyboard.press('ArrowLeft');
  at = await showing(page);
  if (at !== 'oum-by-non-24.jpg') bad(`back from roll 1's first tile the lightbox shows ${at}`);

  await page.keyboard.press('Escape');
  at = await showing(page);
  if (at !== null) bad(`Escape left the lightbox open on ${at}`);

  // the other end of the same seam: roll 2's first tile wraps to roll 2's last
  await tile(page, 1, 0).click();
  await page.keyboard.press('ArrowLeft');
  at = await showing(page);
  if (at !== 'non-by-oum-24.jpg') bad(`before roll 2's first tile the lightbox shows ${at}, not roll 2's last`);

  // a click off the picture closes, as it does on the landing
  await page.mouse.click(6, 6);
  at = await showing(page);
  if (at !== null) bad(`a click off the picture left the lightbox open on ${at}`);

  if (failures === before) console.log('  opens, wraps inside its roll, closes on Escape and on a click off');
  await page.close();
}

/* --- the finger's arrow key ---
   A swipe across the scrim ends in a click on the scrim, so this also holds the
   click-off handler to letting a turned photo stand. */
{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce',
  });
  await page.goto(invitation, { waitUntil: 'networkidle' });
  console.log('\nswipe');
  const before = failures;

  await tile(page, 0, 4).click();
  if (await showing(page) !== 'oum-by-non-05.jpg') bad('a tap did not open the lightbox on a touch screen');

  // a finger through the real input pipeline, so the page sees the touch events a hand makes
  const cdp = await page.context().newCDPSession(page);
  const swipe = async (from, to) => {
    const y = 120;   // above the picture, on the scrim, where a click would otherwise close
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y, id: 1 }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + (to - from) * i / 8, y, id: 1 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(60);
  };

  await swipe(300, 90);
  let at = await showing(page);
  if (at !== 'oum-by-non-06.jpg') bad(`a swipe left showed ${at}, not the next photo`);

  await swipe(90, 300);
  at = await showing(page);
  if (at !== 'oum-by-non-05.jpg') bad(`a swipe right showed ${at}, not the one before`);

  if (failures === before) console.log('  a swipe turns the photo and leaves the lightbox open');
  await cdp.detach();
  await page.close();
}

/* --- reduced motion renders the finished section, with nothing in flight --- */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(invitation, { waitUntil: 'networkidle' });
  console.log('\nreduced motion');
  // the lightbox is opened first: its pieces only carry computed style while the dialog
  // is, so a closed one would report every animation as absent whether it is or not
  await tile(page, 0, 0).click();
  const still = (page) => page.evaluate(() => {
    const out = [];
    const sel = '.gallery .tile, .gallery .tile-fill, .gallery h3, .gallery .label,'
      + ' .lightbox, .lb-frame, .lb-img, .lb-close, .lb-prev, .lb-next';
    for (const el of document.querySelectorAll(sel)) {
      const s = getComputedStyle(el);
      if (s.animationName !== 'none') out.push(`${el.className} runs ${s.animationName}`);
      if (parseFloat(s.transitionDuration) > 0) out.push(`${el.className} transitions over ${s.transitionDuration}`);
    }
    // the gallery itself must also be fully painted, which the lightbox's own pieces
    // are not expected to be until it opens
    for (const el of document.querySelectorAll('.gallery .tile, .gallery .tile-fill, .gallery h3, .gallery .label')) {
      const o = +getComputedStyle(el).opacity;
      if (o < 0.99) out.push(`${el.className} is at opacity ${o}`);
    }
    return out;
  });
  const moving = await still(page);
  for (const m of moving) bad(m);
  if (!moving.length) console.log('  the gallery and the lightbox are finished and still');
  await page.close();
}

/* --- the picture's shape, in the other two engines ---
   The frame carries a minimum square and the img is left to size itself, so whether a
   photo keeps its own proportions is each engine's decision, and Chrome is the only one
   the rest of this file drives. These run when the browsers are installed and say so when
   they are not, so a checkout with only Chrome still passes. */
for (const [name, type] of [['webkit', webkit], ['firefox', firefox]]) {
  let engine;
  try {
    engine = await type.launch();
  } catch {
    console.log(`\n${name}: not installed, skipped - npx playwright install ${name}`);
    continue;
  }
  const page = await engine.newPage({ viewport: { width: 900, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(invitation, { waitUntil: 'networkidle' });
  console.log(`\n${name}`);

  await tile(page, 0, 0).click();
  const shape = await page.evaluate(async () => {
    const img = document.querySelector('.lb-img');
    if (!img.complete) await new Promise((res) => { img.onload = img.onerror = res; });
    const r = img.getBoundingClientRect();
    return { natural: img.naturalWidth / img.naturalHeight, drawn: r.width / r.height, w: img.naturalWidth };
  });
  if (!shape.w) bad(`${name}: the lightbox photo did not load`);
  else if (Math.abs(shape.natural - shape.drawn) > 0.01) {
    bad(`${name}: the photo is drawn at ${shape.drawn.toFixed(3)}, not its own ${shape.natural.toFixed(3)}`);
  } else {
    console.log('  the photo keeps its own shape inside the frame');
  }
  await page.close();
  await engine.close();
}

/* --- with no script at all, every tile is still a link to its photo --- */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, javaScriptEnabled: false });
  await page.goto(invitation, { waitUntil: 'load' });
  console.log('\nno script');
  const hrefs = await page.$$eval('.tile', (els) => els.map((e) => e.getAttribute('href')));
  if (hrefs.length !== ROLLS * PER_ROLL) bad(`${hrefs.length} tiles with no script, not ${ROLLS * PER_ROLL}`);
  const shape = /^assets\/gallery\/full\/(oum-by-non|non-by-oum|us-two)-(0[1-9]|1\d|2[0-4])\.jpg$/;
  const off = hrefs.filter((h) => !shape.test(h || ''));
  if (off.length) bad(`${off.length} tiles do not link to a photo, the first being ${off[0]}`);
  else console.log(`  all ${hrefs.length} tiles link to their photo`);
  await page.close();
}

await browser.close();
console.log(failures ? `\nFAIL - ${failures} problem(s)` : '\nPASS - every piece inside the card and clear of the content');
process.exit(failures ? 1 : 0);
