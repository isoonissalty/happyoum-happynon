import { chromium } from 'playwright';

const site = new URL('../site/', import.meta.url);
const url = new URL('index.html', site).href;
const browser = await chromium.launch({ channel: 'chrome' });
let fail = 0;
const bad = (m) => { console.log('  FAIL ' + m); fail++; };
const opacity = (page, sel) => page.evaluate((s) => +getComputedStyle(document.querySelector(s)).opacity, sel);

const POPS = ['.pop--strip', '.pop--cat1', '.pop--cat2', '.pop--ticket'];

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
  const seq = ['.names', '.line', '.lead', '.pop--strip', '.invited', '.btn', '.tag'];
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

  for (const sel of ['.names', '.line', '.lead', '.envelope', '.invited', '.btn', '.tag', '.pop--strip', '.pop--ticket']) {
    if (await opacity(page, sel) < 0.99) bad(`${sel} is not visible on load`);
  }
  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS');
process.exit(fail ? 1 : 0);
