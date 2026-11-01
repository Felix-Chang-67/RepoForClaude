// node capture4k.js OUTBASE fps t0 t1 workers  -> OUTBASE.seg*.mkv + OUTBASE.list (frames piped straight into ffmpeg)
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
(async () => {
  const [out, fpsS, a, b, wk] = process.argv.slice(2); const fps = +fpsS, t0 = +a, t1 = +b, n = Math.round((t1 - t0) * fps), NW = +(wk || 3);
  const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined });
  const per = Math.ceil(n / NW), segs = [], start = Date.now(); let done = 0;
  await Promise.all([...Array(NW).keys()].map(async w => {
    const i0 = w * per, i1 = Math.min(n, (w + 1) * per); if (i0 >= i1) return;
    const seg = `${out}.seg${w}.mkv`; segs[w] = seg;
    const ff = spawn('ffmpeg', ['-hide_banner', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '9', '-pix_fmt', 'yuv420p', '-r', String(fps), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const p = await browser.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('http://127.0.0.1:8768/clip.html', { waitUntil: 'networkidle' }); await p.evaluate(() => window.ready);
    for (let i = i0; i < i1; i++) {
      const d = await p.evaluate(tt => { render(tt); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t0 + i / fps);
      if (!ff.stdin.write(Buffer.from(d.slice(d.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 120 === 0) console.log(`${done}/${n} frames, ${((Date.now() - start) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); if (errs.length) console.log('worker', w, 'errors:', errs.slice(0, 3).join(' | '));
  }));
  fs.writeFileSync(out + '.list', segs.filter(Boolean).map(s => `file '${s}'`).join('\n') + '\n');
  console.log('captured', n, 'frames in', ((Date.now() - start) / 1000).toFixed(0), 's'); await browser.close();
})();
