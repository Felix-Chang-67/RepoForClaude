// node capture.js OUTDIR fps t0 t1 [workers]   or   node capture.js OUTDIR test t1,t2,...
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [out, mode, a, b, wk] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined });
  const open = async () => { const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('http://127.0.0.1:8767/clip.html', { waitUntil: 'networkidle' }); await p.evaluate(() => window.ready); p._errs = errs; return p; };
  const grab = async (p, t, file) => { const d = await p.evaluate(tt => { render(tt); return document.getElementById('c').toDataURL('image/png'); }, t); fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64')); };
  if (mode === 'test') {
    const p = await open();
    for (const t of a.split(',').map(Number)) await grab(p, t, `${out}/t_${t.toFixed(2)}.png`);
    console.log('errors:', p._errs.join(' | ') || 'none');
  } else {
    const fps = Number(mode), t0 = Number(a), t1 = Number(b), n = Math.round((t1 - t0) * fps), W = Number(wk || 3);
    const per = Math.ceil(n / W); const start = Date.now();
    await Promise.all([...Array(W).keys()].map(async w => {
      const p = await open();
      for (let i = w * per; i < Math.min(n, (w + 1) * per); i++) await grab(p, t0 + i / fps, `${out}/${String(i).padStart(5, '0')}.png`);
      if (p._errs.length) console.log('worker', w, 'errors:', p._errs.slice(0, 3).join(' | '));
    }));
    console.log('frames', n, 'in', ((Date.now() - start) / 1000).toFixed(1), 's');
  }
  await browser.close();
})();
