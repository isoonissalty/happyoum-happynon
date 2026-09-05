import { chromium } from 'playwright';
const url = new URL('site/invitation.html', 'file://' + process.cwd() + '/').href;
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1100, 1166, 1167, 1199, 1440, 1920]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  const m = await page.evaluate(() => { const c = document.querySelector('.card').getBoundingClientRect(); return { card: c.width, left: c.left, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
  console.log(`${w}: card=${m.card.toFixed(1)} left=${m.left.toFixed(1)}${m.sw > m.iw ? ' HSCROLL' : ''}`);
  await page.close();
}
await browser.close();
