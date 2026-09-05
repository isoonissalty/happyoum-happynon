import { chromium } from 'playwright';
const [,, file, out, w, h, full] = process.argv;
const url = new URL(file, 'file://' + process.cwd() + '/').href;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(async () => { await document.fonts.ready; });
await page.screenshot({ path: out, fullPage: full === 'full', animations: 'disabled' });
await browser.close();
