import { chromium } from 'playwright';
const out = process.argv[2];
const url = new URL('site/invitation.html', 'file://' + process.cwd() + '/').href;
const browser = await chromium.launch({ channel: 'chrome' });
const st = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); const c = getComputedStyle(e); return { scale: c.scale, rotate: c.rotate, opacity: c.opacity, transform: c.transform }; }, sel);

// full motion: hero decos grow on load, agenda decos wait for scroll
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  console.log('t=60ms hero deco', JSON.stringify(await st(page, '.hero .deco')));
  await page.screenshot({ path: `${out}/deco-0.png` });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/deco-400.png` });
  console.log('t=460 hero deco', JSON.stringify(await st(page, '.hero .deco')));
  console.log('t=460 agenda deco', JSON.stringify(await st(page, '.agenda .deco')));
  await page.waitForTimeout(1500);
  console.log('t=2s hero deco', JSON.stringify(await st(page, '.hero .deco')));
  const a = await st(page, '.hero .deco'); await page.waitForTimeout(1500); const b = await st(page, '.hero .deco');
  console.log('drifting:', a.rotate !== b.rotate || a.scale !== b.scale, a.rotate, '->', b.rotate);
  await page.evaluate(() => document.querySelector('.agenda').scrollIntoView());
  await page.waitForTimeout(1600);
  const ag = await page.$$eval('.agenda .deco', (els) => els.map((e) => getComputedStyle(e).opacity));
  console.log('agenda decos after scroll:', ag.join(','));
  await page.close();
}
for (const [label, opts] of [['reduced motion', { reducedMotion: 'reduce' }], ['no script', { javaScriptEnabled: false }]]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...opts });
  await page.goto(url, { waitUntil: 'load' });
  const all = await page.$$eval('.deco', (els) => els.map((e) => { const c = getComputedStyle(e); return c.opacity + '/' + c.scale + '/' + c.rotate; }));
  console.log(label, 'all static:', all.every((v) => v === '1/none/none' || v === '1/1/none'), new Set(all));
  await page.close();
}
await browser.close();
