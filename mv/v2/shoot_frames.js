const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  for (const id of process.argv.slice(2)) {
    await page.goto('http://127.0.0.1:8766/frames/frame.html?f=' + id, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `/home/user/work/v2/frames/${id}.png` });
    console.log('shot', id);
  }
  await browser.close();
})();
