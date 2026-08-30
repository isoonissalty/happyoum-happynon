import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const site = new URL('../site/', import.meta.url);
const url = new URL('index.html', site).href;

const VIEWPORTS = [[390, 844], [360, 640], [844, 390], [768, 1024],
                   [1024, 600], [1280, 600], [1366, 650], [1440, 900], [1920, 1080]];

const browser = await chromium.launch({ channel: 'chrome' });
let fail = 0;
const bad = (msg) => { console.log('  FAIL ' + msg); fail++; };

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

  // measure the pops in their landed state: a no-op before the motion pass, and the
  // position that actually has to fit the viewport after it
  // this is a geometry check, so it must not depend on the entrance timing: killing the
  // transition lands every item instantly, whether or not a motion pass exists yet
  await page.addStyleTag({ content: '.pop{ transition: none !important; }' });
  await page.evaluate(() => document.querySelectorAll('.pop').forEach(e => e.classList.add('is-in')));
  await page.waitForTimeout(50);

  const m = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return {
      docW: document.documentElement.scrollWidth,
      winW: innerWidth,
      winH: innerHeight,
      intro: r('.panel--intro').height,
      invite: r('.panel--invite').height,
      sticky: getComputedStyle(document.querySelector('.panel--intro')).position,
      seamTop: parseFloat(getComputedStyle(document.querySelector('.panel--invite'), '::before').top),
      waveH: parseFloat(getComputedStyle(document.querySelector('.panel--invite'), '::before').height),
      frontTop: r('.env-front').top,
      boxH: r('.envelope').height,
      tagBottom: r('.invite-tag').bottom,
      tagLeft: r('.invite-tag').left,
      tagRight: r('.invite-tag').right,
      pops: [...document.querySelectorAll('.pop')].map(e => {
        const b = e.getBoundingClientRect();
        return { cls: e.className, left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      }),
    };
  });

  if (m.docW > m.winW) bad(`horizontal scroll: scrollWidth ${m.docW} > ${m.winW}`);
  if (Math.abs(m.intro - m.winH) > 1) bad(`intro is ${m.intro}, expected ~${m.winH}`);
  if (m.invite < m.winH - 1) bad(`invite is ${m.invite}, expected >= ${m.winH}`);
  if (m.sticky !== 'sticky') bad(`intro position is ${m.sticky}`);
  if (Math.abs(m.seamTop + m.waveH - 1) > 0.6) bad(`seam overlap is ${(m.seamTop + m.waveH).toFixed(2)}px, expected 1`);
  for (const p of m.pops) {
    if (p.left < 0 || p.right > m.winW) bad(`${p.cls} escapes the viewport (${p.left.toFixed(0)}..${p.right.toFixed(0)})`);
    // The layered envelope only reads if each item both dips behind the pocket and
    // still shows above it. Both bounds are fractions of the envelope, not pixels:
    // the envelope hits its clamp() floor on mobile at 54% of its desktop size, so a
    // fixed pixel bound is twice as strict there for a composition that is identical.
    const tuck = (p.bottom - m.frontTop) / m.boxH;
    const show = (m.frontTop - p.top) / m.boxH;
    if (tuck < 0.03) bad(`${p.cls} tucks only ${(tuck * 100).toFixed(1)}% behind the pocket`);
    if (show < 0.15) bad(`${p.cls} shows only ${(show * 100).toFixed(1)}% above the pocket`);
    const clearsTag = p.top > m.tagBottom + 8 || p.right < m.tagLeft || p.left > m.tagRight;
    if (!clearsTag) bad(`${p.cls} overlaps the hashtag`);
  }

  // the load-bearing claim: sticky must actually pin, not merely compute as sticky
  await page.evaluate(() => scrollTo(0, innerHeight * 0.6));
  await page.waitForTimeout(120);
  const pinned = await page.evaluate(() => document.querySelector('.panel--intro').getBoundingClientRect().top);
  if (Math.abs(pinned) > 1) bad(`intro did not pin: top is ${pinned.toFixed(1)} after scrolling`);

  // the intro is exactly one viewport tall and centres its content, so anything that
  // overflows is lost at both ends at once - clipped above, hidden under panel 2
  const stage = await page.evaluate(() => {
    const n = document.querySelector('.intro-names').getBoundingClientRect();
    const a = document.querySelector('.intro-and').getBoundingClientRect();
    return { top: n.top, bottom: a.bottom, vh: innerHeight };
  });
  if (stage.top < 0) bad(`the names are clipped at the top by ${(-stage.top).toFixed(0)}px`);
  if (stage.bottom > stage.vh) bad(`the scroll hook is ${(stage.bottom - stage.vh).toFixed(0)}px below the fold`);

  console.log(`  intro ${m.intro} invite ${m.invite} vh=${stage.vh} sticky=${m.sticky} pinnedTop=${pinned.toFixed(1)}`);
  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS');
process.exit(fail ? 1 : 0);
