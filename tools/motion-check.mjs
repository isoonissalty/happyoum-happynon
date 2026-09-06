import { chromium } from 'playwright';

const site = new URL('../site/', import.meta.url);
const url = new URL('index.html', site).href;
const invitation = new URL('invitation.html', site).href;
const browser = await chromium.launch({ channel: 'chrome' });
let fail = 0;
const bad = (m) => { console.log('  FAIL ' + m); fail++; };
const opacity = (page, sel) => page.evaluate((s) => +getComputedStyle(document.querySelector(s)).opacity, sel);

const POPS = ['.pop--strip1', '.pop--strip2', '.pop--cats', '.pop--ticket'];

/* --- full motion --- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // not networkidle: it waits for a mandatory 500ms quiet window, so it resolves at
  // least half a second after the CSS animation clock starts at first paint. That is a
  // structural floor rather than network noise, and no threshold survives it.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  console.log('\nfull motion');

  // Record when each element crosses half opacity, then assert on the ORDER and the
  // SPREAD. Both are differences against one clock, so any offset between navigation
  // and first paint cancels out instead of becoming a flaky threshold. The cover reads
  // as one sentence, so it has to arrive in reading order with the pop in the middle.
  const seq = ['.names', '.line', '.lead', '.pop--strip1', '.invited', '.btn', '.tag'];
  const at = await page.evaluate(async (sels) => {
    const seen = {};
    const t0 = performance.now();
    while (performance.now() - t0 < 6000 && Object.keys(seen).length < sels.length) {
      for (const s of sels) {
        const el = document.querySelector(s);
        if (el && seen[s] === undefined && +getComputedStyle(el).opacity > 0.5) {
          seen[s] = Math.round(performance.now() - t0);
        }
      }
      await new Promise((r) => requestAnimationFrame(r));
    }
    return seen;
  }, seq);
  console.log('  revealed at ms: ' + JSON.stringify(at));

  for (const sel of seq) if (at[sel] === undefined) bad(`${sel} never became visible`);
  for (let i = 1; i < seq.length; i++) {
    if (!(at[seq[i - 1]] < at[seq[i]])) bad(`${seq[i]} does not follow ${seq[i - 1]}`);
  }
  if (at['.tag'] - at['.names'] < 1500) {
    bad(`the reveal spans only ${at['.tag'] - at['.names']}ms, so it is not staggered`);
  }
  // the probe above records the HALF-opacity crossing, so the last element is still
  // mid-fade at that moment; poll for the settled state rather than assuming it
  const settled = await page.evaluate(async (sels) => {
    const t0 = performance.now();
    while (performance.now() - t0 < 4000) {
      if (sels.every((s) => +getComputedStyle(document.querySelector(s)).opacity > 0.99)) return true;
      await new Promise((r) => requestAnimationFrame(r));
    }
    return false;
  }, [...seq, ...POPS]);
  if (!settled) bad('the reveal never reached full opacity');

  await page.close();
}

/* --- the landed composition must survive with no script at all --- */
for (const [label, opts] of [
  ['no script, reduced motion', { reducedMotion: 'reduce', javaScriptEnabled: false }],
  ['no script, full motion',    { javaScriptEnabled: false }],
]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...opts });
  await page.goto(url, { waitUntil: 'load' });
  console.log('\n' + label);
  for (const sel of POPS) {
    const o = await page.$eval(sel, (el) => +getComputedStyle(el).opacity);
    if (o < 0.99) bad(`${sel} is at opacity ${o} - the envelope renders empty`);
  }
  await page.close();
}

/* --- reduced motion --- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  console.log('\nreduced motion');

  for (const sel of ['.names', '.line', '.lead', '.envelope', '.invited', '.btn', '.tag', ...POPS]) {
    if (await opacity(page, sel) < 0.99) bad(`${sel} is not visible on load`);
  }
  if (await page.$('.pixie')) bad('the dust canvas is present under reduced motion');
  await page.close();
}

/* --- the dust on a touch screen ---
   The finger is the wand on both pages. The landing also flies one itself: a figure of
   eight across the band above the names, so the dust is there before a touch. */
const TOUCH = { hasTouch: true, isMobile: true };
const W = 390;

// a finger drawn from (x0,y0) to (x1,y1) through the real input pipeline, so the page
// sees the same touchstart/touchmove/touchend a hand produces
async function drag(page, x0, y0, x1, y1, steps = 16) {
  const cdp = await page.context().newCDPSession(page);
  const at = (x, y) => ({ touchPoints: [{ x, y, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', ...at(x0, y0) });
  for (let i = 1; i <= steps; i++) {
    const f = i / steps;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', ...at(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

// where the drawn dust sits: every lit canvas pixel's bounding box and centroid, in CSS px
const lit = (page) => page.evaluate(() => {
  const c = document.querySelector('.pixie');
  if (!c) return null;
  const scale = c.width / innerWidth;
  const a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0, sx = 0, sy = 0, top = Infinity, bottom = -Infinity;
  for (let i = 3; i < a.length; i += 4) {
    if (a[i] < 40) continue;
    const y = ((i >> 2) / c.width | 0) / scale;
    n++; sx += ((i >> 2) % c.width) / scale; sy += y;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  return { n, cx: sx / n, cy: sy / n, top, bottom };
});

{
  const page = await browser.newPage({ viewport: { width: W, height: 844 }, ...TOUCH });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  console.log('\ntouch, landing');
  const coarse = await page.evaluate(() => matchMedia('(hover:none) and (pointer:coarse)').matches);
  if (!coarse) bad('the emulated page still reports a fine pointer, so this section proves nothing');

  // Only the last second or so of the path is lit at any instant, so one frame shows a
  // lobe, not the figure. Sample across a lap: the wand must never go dark, must visit
  // both lobes, and must keep its weight in the band above the names.
  const namesTop = await page.$eval('.names', (el) => el.getBoundingClientRect().top);
  const samples = [];
  for (let i = 0; i < 11; i++) {
    await page.waitForTimeout(700);
    samples.push(await lit(page));
  }
  if (samples.some((d) => !d)) bad('no dust canvas on a touch screen');
  else {
    const xs = samples.map((d) => d.cx), ys = samples.map((d) => d.cy);
    const meanY = ys.reduce((a, b) => a + b) / ys.length;
    console.log(`  lit px ${samples.map((d) => d.n).join(' ')}; centroid x ${Math.min(...xs).toFixed(0)}..${Math.max(...xs).toFixed(0)}, mean y ${meanY.toFixed(0)}; names at ${namesTop.toFixed(0)}`);
    if (samples.some((d) => d.n < 100)) bad('the dust went dark mid-lap - the wand is not flying');
    // each lobe's weight sits well off centre, so a centroid that never leaves the middle
    // third is a wand that is not looping
    if (!(Math.min(...xs) < W / 3 && Math.max(...xs) > W * 2 / 3)) bad('the wand stays on one side: no figure of eight');
    if (!(meanY < namesTop)) bad(`the dust's weight (y ${meanY.toFixed(0)}) is below the names (${namesTop.toFixed(0)})`);
    if (samples.some((d) => d.top < 0)) bad('the dust is clipped at the top of the screen');
  }

  // a finger drawn well below the band must leave dust where the wand never flies
  const H = 844;
  await drag(page, 40, H * .75, W - 40, H * .8);
  await page.waitForTimeout(60);
  const after = await lit(page);
  console.log(`  after a finger drag: lit px ${after.n}, bottom ${after.bottom.toFixed(0)}`);
  if (after.bottom < H * .6) bad(`the finger leaves no dust: the lit area stops at y ${after.bottom.toFixed(0)}`);
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, ...TOUCH });
  await page.goto(invitation, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  console.log('\ntouch, invitation');
  const before = await lit(page);
  if (!before) bad('no dust canvas on the invitation on a touch screen');
  else if (before.n) bad(`${before.n} lit pixels before a touch - the invitation flies a wand`);
  await drag(page, 40, 500, 350, 560);
  await page.waitForTimeout(60);
  const after = await lit(page);
  console.log(`  after a finger drag: lit px ${after ? after.n : 0}`);
  if (!after || after.n < 100) bad(`only ${after ? after.n : 0} lit pixels after a finger drag`);
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, ...TOUCH, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  console.log('\ntouch, reduced motion');
  if (await page.$('.pixie')) bad('the wand flies under reduced motion');
  await page.close();
}

/* --- the dust under a real pointer is unchanged: it trails the hand and nothing else --- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  console.log('\npointer');
  const before = await lit(page);
  if (!before) bad('no dust canvas under a fine pointer');
  else if (before.n) bad(`${before.n} lit pixels before the pointer has moved - the wand flies on desktop`);
  await page.mouse.move(400, 400);
  await page.mouse.move(700, 450, { steps: 12 });
  await page.waitForTimeout(100);
  const after = await lit(page);
  if (after && after.n < 100) bad(`only ${after.n} lit pixels after a sweep`);
  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS');
process.exit(fail ? 1 : 0);
