import { chromium } from 'playwright';
const out = process.argv[2];
const url = new URL('site/index.html', 'file://' + process.cwd() + '/').href;
const VIEWPORTS = [[390, 844], [360, 640], [844, 390], [768, 1024],
                   [1024, 600], [1280, 600], [1366, 650], [1440, 900], [1920, 1080]];
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.addStyleTag({ content: '.pop{transition:none!important} .names,.line,.lead,.envelope,.invited,.btn,.tag{animation:none!important;opacity:1!important}' });
  await page.evaluate(() => document.querySelectorAll('.pop').forEach(e => e.classList.add('is-in')));
  await page.waitForTimeout(80);
  const m = await page.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect();
    return { doc: document.documentElement.scrollHeight, docW: document.documentElement.scrollWidth,
      card: r('.card').height, cardBottom: r('.card').bottom, env: r('.envelope').width,
      popTop: Math.min(...[...document.querySelectorAll('.pop')].map(p => p.getBoundingClientRect().top)),
      leadBottom: r('.lead').bottom };
  });
  console.log(`${w}x${h}  doc=${m.doc} (${m.doc > h ? 'SCROLLS +' + (m.doc - h) : 'fits'}) card=${m.card.toFixed(0)} env=${m.env.toFixed(0)} popTop-leadBottom=${(m.popTop - m.leadBottom).toFixed(0)}${m.docW > w ? ' HSCROLL' : ''}`);
  if (out) await page.screenshot({ path: `${out}/landing-${w}x${h}.png` });
  await page.close();
}
await browser.close();
