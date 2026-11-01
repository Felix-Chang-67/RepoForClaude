const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.Engine && Engine.ready, null, { timeout: 30000 }).catch(() => errs.push('Engine.ready timeout'));
  await page.waitForTimeout(500);
  const fontsOk = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).filter((v, i, a) => a.indexOf(v) === i));
  console.log('fonts loaded:', fontsOk.join(', '));
  await page.screenshot({ path: process.argv[2] + '/page_top.png' });
  const plan = JSON.parse(process.argv[3]);
  for (const [name, times] of Object.entries(plan)) {
    for (const t of times) {
      await page.evaluate(([n, tt]) => { const d = Engine.demos[n]; d.t = tt; d.draw(tt); }, [name, t]);
      const el = await page.$(`.stage[data-demo="${name}"]`);
      await el.screenshot({ path: `${process.argv[2]}/${name}_${t.toFixed(2)}.png` });
    }
  }
  console.log('ERRORS:\n' + errs.join('\n'));
  await browser.close();
})();
