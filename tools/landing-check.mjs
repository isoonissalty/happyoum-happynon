import { chromium } from 'playwright';

const site = new URL('../site/', import.meta.url);
const url = new URL('index.html', site).href;

// sizes, not widths: short laptop windows and phone landscape are where a one-screen
// cover fails, and a suite of tall viewports cannot see it
const VIEWPORTS = [[390, 844], [360, 640], [844, 390], [768, 1024],
                   [1024, 600], [1280, 600], [1366, 650], [1440, 900], [1920, 1080]];

// below this the cover is allowed to scroll: a phone on its side has no one-screen
// composition worth holding to, and every taller window must fit
const FIT_MIN_HEIGHT = 560;

// the pocket edge is read off the front plate through a canvas, and a file:// image
// taints one unless Chrome is told the pages' own files are same-origin
const browser = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
let fail = 0;
const bad = (msg) => { console.log('  FAIL ' + msg); fail++; };

// two convex quads meet unless some edge normal of either separates their projections
const grow = (b, by) => [[b.left - by, b.top - by], [b.right + by, b.top - by],
                         [b.right + by, b.bottom + by], [b.left - by, b.bottom + by]];
const overlaps = (a, b) => {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      const nx = y2 - y1, ny = x1 - x2;
      const span = (q) => q.reduce(([lo, hi], [x, y]) => {
        const d = x * nx + y * ny;
        return [Math.min(lo, d), Math.max(hi, d)];
      }, [Infinity, -Infinity]);
      const [alo, ahi] = span(a), [blo, bhi] = span(b);
      if (ahi < blo || bhi < alo) return false;
    }
  }
  return true;
};

for (const [width, height] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images]
      .filter((i) => !i.complete)
      .map((i) => new Promise((res) => { i.onload = i.onerror = res; })));
  });
  console.log(`\n${width}x${height}`);

  // this is a geometry check, so it must not depend on the entrance timing: killing
  // every animation lands the composition instantly
  await page.addStyleTag({ content: '.pop{ transition: none !important; } .panel > *, .viewer-img, .item-card{ animation: none !important; opacity: 1 !important; }' });
  await page.evaluate(() => document.querySelectorAll('.pop').forEach(e => e.classList.add('is-in')));
  await page.waitForTimeout(50);

  const m = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const card = r('.card');
    const front = document.querySelector('.env-front');
    const fr = front.getBoundingClientRect();

    // The front plate is transparent above the pocket, so its box says nothing about
    // where an item is hidden. The pocket's edge is read off the art itself: the first
    // opaque row in the column under the item's centre, scaled to the rendered plate.
    // The edge is a V, so each item gets the edge at its own column.
    const cv = document.createElement('canvas');
    cv.width = front.naturalWidth;
    cv.height = front.naturalHeight;
    const ctx = cv.getContext('2d');
    ctx.drawImage(front, 0, 0);
    const alpha = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const pocketTopAt = (x) => {
      const col = Math.min(cv.width - 1, Math.max(0, Math.round((x - fr.left) / fr.width * (cv.width - 1))));
      for (let row = 0; row < cv.height; row++) {
        if (alpha[(row * cv.width + col) * 4 + 3] > 128) return fr.top + row / cv.height * fr.height;
      }
      return fr.bottom;
    };

    // a die-cut plate carries empty rows above its art (the cats' hats leave a third
    // of theirs clear), so an item's top is the first opaque row of its image, as a
    // fraction of the image's height
    const artTop = (img) => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const a = x.getImageData(0, 0, c.width, c.height).data;
      for (let row = 0; row < c.height; row++) {
        for (let col = 0; col < c.width; col += 4) {
          if (a[(row * c.width + col) * 4 + 3] > 128) return row / c.height;
        }
      }
      return 0;
    };

    // an item's real outline is its rotated box, not the axis-aligned rect around it:
    // the strips lean 12deg, and the upright rect around a leaning strip reaches into
    // copy the strip itself clears. The box starts at the art, not the plate.
    const corners = (el) => {
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const w = el.offsetWidth / 2, h = el.offsetHeight / 2;
      const top = -h + artTop(el.querySelector('img')) * el.offsetHeight;
      const mtx = new DOMMatrix(getComputedStyle(el).transform);
      return [[-w, top], [w, top], [w, h], [-w, h]].map(([x, y]) => {
        const p = mtx.transformPoint(new DOMPoint(x, y));
        return [cx + p.x, cy + p.y];
      });
    };

    return {
      docW: document.documentElement.scrollWidth,
      docH: document.documentElement.scrollHeight,
      winW: innerWidth,
      winH: innerHeight,
      cardTop: card.top,
      cardBottom: card.bottom,
      namesTop: r('.names').top,
      tagBottom: r('.tag').bottom,
      lead: r('.lead').toJSON(),
      boxH: r('.envelope').height,
      pops: [...document.querySelectorAll('.pop')].map(e => {
        const b = e.getBoundingClientRect();
        const x = b.left + b.width / 2, pocketTop = pocketTopAt(x);
        // the front plate's transparent top sits over every item, so its clip has to
        // give the items back their clicks: some point of the visible part, walked down
        // the item's centre column, must hit-test to the item itself
        let clickable = false;
        for (let y = b.top + 2; y < pocketTop && !clickable; y += 4) {
          const hit = document.elementFromPoint(x, y);
          clickable = !!hit && hit.closest('.pop') === e;
        }
        return { cls: e.className, left: b.left, right: b.right, top: b.top, bottom: b.bottom,
                 pocketTop, quad: corners(e), clickable };
      }),
      // and the paper itself still takes the click, so a tap on the pocket replays the pop
      paperHit: (() => {
        const hit = document.elementFromPoint(fr.left + fr.width / 2, fr.bottom - fr.height * .15);
        return !!hit && hit.classList.contains('env-front');
      })(),
    };
  });

  // --wave-h is a calc() the browser will not resolve on a custom property read, so the
  // wave bands are measured from the real card instead: the mask intrudes by the
  // strip's full height at a trough, which is the ::before-free equivalent of the seam
  const waves = await page.evaluate(() => {
    const px = (v) => {
      const probe = document.createElement('div');
      probe.style.cssText = `position:absolute;visibility:hidden;height:${v}`;
      document.body.appendChild(probe);
      const h = probe.getBoundingClientRect().height;
      probe.remove();
      return h;
    };
    return { top: px('var(--wave-h)'), bottom: px('var(--wave-hb)') };
  });

  if (m.docW > m.winW) bad(`horizontal scroll: scrollWidth ${m.docW} > ${m.winW}`);
  if (height >= FIT_MIN_HEIGHT && m.docH > m.winH) bad(`the cover scrolls: ${m.docH} > ${m.winH}`);
  if (m.namesTop < m.cardTop + waves.top) bad(`the names sit ${(m.cardTop + waves.top - m.namesTop).toFixed(0)}px into the top wave`);
  if (m.tagBottom > m.cardBottom - waves.bottom) bad(`the hashtag sits ${(m.tagBottom - (m.cardBottom - waves.bottom)).toFixed(0)}px into the bottom wave`);

  for (const p of m.pops) {
    if (p.left < 0 || p.right > m.winW) bad(`${p.cls} escapes the viewport (${p.left.toFixed(0)}..${p.right.toFixed(0)})`);
    // The layered envelope only reads if each item both dips behind the pocket and
    // still shows above it. Both bounds are fractions of the envelope, not pixels:
    // the envelope hits its clamp() floor on mobile at roughly half its desktop size,
    // so a fixed pixel bound is twice as strict there for a composition that is identical.
    const tuck = (p.bottom - p.pocketTop) / m.boxH;
    const show = (p.pocketTop - p.top) / m.boxH;
    // the cats peek over the ticket rather than the pocket, so the ticket's top edge
    // stands in for the pocket's: they must dip behind it and still show above it
    const ticket = m.pops.find(q => q.cls.includes('pop--ticket'));
    if (p.cls.includes('pop--cats')) {
      const tuckT = (p.bottom - ticket.top) / m.boxH;
      const showT = (ticket.top - p.top) / m.boxH;
      if (tuckT < 0.03) bad(`${p.cls} tucks only ${(tuckT * 100).toFixed(1)}% behind the ticket`);
      if (showT < 0.15) bad(`${p.cls} shows only ${(showT * 100).toFixed(1)}% above the ticket`);
    } else if (tuck < 0.03) bad(`${p.cls} tucks only ${(tuck * 100).toFixed(1)}% behind the pocket`);
    if (show < 0.15) bad(`${p.cls} shows only ${(show * 100).toFixed(1)}% above the pocket`);
    if (overlaps(p.quad, grow(m.lead, 8))) bad(`${p.cls} overlaps the lead-in line`);
    if (!p.clickable) bad(`${p.cls} cannot be clicked: something covers its visible part`);
  }
  if (!m.paperHit) bad('the pocket does not take the click, so a tap cannot replay the pop');

  console.log(`  doc ${m.docH}/${m.winH} card ${(m.cardBottom - m.cardTop).toFixed(0)} envelope ${m.boxH.toFixed(0)} waves ${waves.top.toFixed(0)}/${waves.bottom.toFixed(0)}`);

  // the viewer: the tallest item and the widest, since the height cap binds one and the
  // width cap the other, each beside its own item card
  const quad = (b) => grow(b, 0);
  const isClosed = () => page.waitForFunction(() => !document.querySelector('.viewer').open && !document.querySelector('.viewer-img').hasAttribute('src'), null, { timeout: 2000 }).then(() => true, () => false);
  for (const sel of ['.pop--ticket', '.pop--cats']) {
    await page.evaluate((s) => document.querySelector(s).click(), sel);
    await page.waitForSelector('.viewer[open]');
    await page.waitForFunction(() => document.querySelector('.viewer-img').naturalWidth > 0);
    const v = await page.evaluate((s) => {
      const box = (e) => e.getBoundingClientRect().toJSON();
      const shown = [...document.querySelectorAll('.item-card')].filter((e) => !e.hidden);
      return {
        body: box(document.querySelector('.viewer-body')),
        img: box(document.querySelector('.viewer-img')),
        card: shown.map(box),
        cardFor: shown.map((e) => e.dataset.item),
        want: document.querySelector(s).dataset.item,
        docW: document.documentElement.scrollWidth,
      };
    }, sel);
    // the picture is sized to leave room for the card: never over 60% of the window, and
    // the tall ticket - the one the height cap binds - never so small it stops being the
    // point, except on a phone on its side. The wide cats are width-bound on a phone.
    const share = v.img.height / m.winH;
    if (share > 0.60) bad(`${sel} viewer picture is ${(share * 100).toFixed(0)}% of the window's height`);
    if (sel === '.pop--ticket' && height >= FIT_MIN_HEIGHT && share < 0.40) bad(`${sel} viewer picture is only ${(share * 100).toFixed(0)}% of the window's height`);
    // both sit inside the dialog's padded box, not merely the window
    const inside = (b) => b.left >= v.body.left - 1 && b.right <= v.body.right + 1 && b.top >= v.body.top - 1 && b.bottom <= v.body.bottom + 1;
    if (!inside(v.img)) bad(`${sel} viewer picture leaves the dialog's padded box`);
    if (v.card.length !== 1) bad(`${sel} viewer shows ${v.card.length} item cards`);
    else {
      if (v.cardFor[0] !== v.want) bad(`${sel} viewer shows the ${v.cardFor[0]} card`);
      const c = v.card[0];
      if (!inside(c)) bad(`${sel} item card leaves the dialog's padded box (${c.left.toFixed(0)},${c.top.toFixed(0)})..(${c.right.toFixed(0)},${c.bottom.toFixed(0)})`);
      if (overlaps(quad(c), quad(v.img))) bad(`${sel} item card overlaps the picture`);
      // a click in the gap between picture and card is a click off the picture, and closes
      const i = v.img;
      const gap = c.left >= i.right ? [(i.right + c.left) / 2, (i.top + i.bottom) / 2]
                                    : [(i.left + i.right) / 2, (i.bottom + c.top) / 2];
      await page.mouse.click(...gap);
      if (!await isClosed()) bad(`${sel} viewer stays open on a click between picture and card`);
      await page.evaluate((s) => document.querySelector(s).click(), sel);
      await page.waitForSelector('.viewer[open]');
    }
    if (v.docW > m.winW) bad(`${sel} viewer scrolls sideways: ${v.docW} > ${m.winW}`);

    await page.keyboard.press('Escape');
    if (!await isClosed()) bad(`${sel} viewer does not close on Escape`);
  }
  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS');
process.exit(fail ? 1 : 0);
