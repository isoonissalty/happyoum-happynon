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
  await page.addStyleTag({ content: '.pop{ transition: none !important; } .panel > *{ animation: none !important; opacity: 1 !important; }' });
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

    // an item's real outline is its rotated box, not the axis-aligned rect around it:
    // the strips lean 12deg, and the upright rect around a leaning strip reaches into
    // copy the strip itself clears
    const corners = (el) => {
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const w = el.offsetWidth / 2, h = el.offsetHeight / 2;
      const mtx = new DOMMatrix(getComputedStyle(el).transform);
      return [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => {
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
        return { cls: e.className, left: b.left, right: b.right, top: b.top, bottom: b.bottom,
                 pocketTop: pocketTopAt(b.left + b.width / 2), quad: corners(e) };
      }),
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
    if (tuck < 0.03) bad(`${p.cls} tucks only ${(tuck * 100).toFixed(1)}% behind the pocket`);
    if (show < 0.15) bad(`${p.cls} shows only ${(show * 100).toFixed(1)}% above the pocket`);
    if (overlaps(p.quad, grow(m.lead, 8))) bad(`${p.cls} overlaps the lead-in line`);
  }

  console.log(`  doc ${m.docH}/${m.winH} card ${(m.cardBottom - m.cardTop).toFixed(0)} envelope ${m.boxH.toFixed(0)} waves ${waves.top.toFixed(0)}/${waves.bottom.toFixed(0)}`);
  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS');
process.exit(fail ? 1 : 0);
