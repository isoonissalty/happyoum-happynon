import { chromium } from 'playwright';
const [,, out, ...times] = process.argv;
const url = new URL('site/index.html', 'file://' + process.cwd() + '/').href;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
for (const t of times.map(Number)) {
  const wait = t - (Date.now() - t0);
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/frame-${t}.png`, animations: 'allow', caret: 'hide' });
}
await browser.close();
