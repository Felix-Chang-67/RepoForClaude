// ③ 鏡の向こうの君 — 35mm stills cut on the bar, gate weave, grain, halation, scope letterbox.
Engine.register('d3', function (stage) {
  const { U, L, IMGS, TEX, tile, cover } = Engine;
  const cv = stage.querySelector('canvas'); const ctx = cv.getContext('2d');
  const seg = [237.9, 260.0];
  // [start, end, image, zoom0, zoom1, px0, px1, py0, py1]
  const shots = [
    [237.9, 240, 'film_elevator', 1.04, 1.12, 0.58, 0.62, 0.45, 0.42],
    [240, 242, 'film_window', 1.10, 1.14, 0.25, 0.38, 0.40, 0.40],
    [242, 244, 'film_puddle', 1.12, 1.18, 0.50, 0.50, 0.30, 0.62],
    [244, 246, 'film_empty', 1.00, 1.14, 0.55, 0.62, 0.40, 0.40],
    [246, 248, 'film_elevator', 2.05, 2.15, 0.64, 0.64, 0.42, 0.40],
    [248, 250, 'film_window', 1.95, 2.05, 0.17, 0.19, 0.33, 0.33],
    [250, 252, 'film_puddle', 1.85, 1.95, 0.43, 0.45, 0.92, 0.88],
    [252, 254, 'film_empty', 1.75, 1.90, 0.32, 0.30, 0.42, 0.44],
  ];
  const montage = ['film_elevator', 'film_window', 'film_puddle', 'film_empty'];
  const hal = {};
  function prepHalation() {
    // bright-pass, tinted red-orange, tiny canvas: upscaled it becomes a soft halation glow
    for (const n of montage) {
      const im = IMGS[n]; if (!im) continue; const w = 200, h = 112;
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.drawImage(im, 0, 0, w, h); const d = g.getImageData(0, 0, w, h); const a = d.data;
      for (let i = 0; i < a.length; i += 4) { const l = (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11) / 255; const k = U.clamp((l - 0.55) / 0.35, 0, 1); a[i] = 255 * k; a[i + 1] = 110 * k; a[i + 2] = 40 * k; }
      g.putImageData(d, 0, 0); hal[n] = c;
    }
  }
  function shotAt(t) {
    if (t >= 254 && t < 258) { // beat-cut montage
      const b = Math.floor((t - 254) / 0.5); const n = montage[b % 4];
      return { n, z: 1.25 + 0.5 * U.hash(b * 7), px: U.hash(b * 3), py: 0.3 + 0.4 * U.hash(b * 5), local: U.fract((t - 254) / 0.5), start: 254 + b * 0.5 };
    }
    if (t >= 258) return { n: 'film_empty', z: 1.0 + (t - 258) * 0.03, px: 0.5, py: 0.45, local: (t - 258) / 2, start: 258, fade: 1 - U.smooth(258.6, 260, t) };
    for (const s of shots) if (t >= s[0] && t < s[1]) { const k = (t - s[0]) / (s[1] - s[0]); return { n: s[2], z: U.mix(s[3], s[4], k), px: U.mix(s[5], s[6], k), py: U.mix(s[7], s[8], k), local: k, start: s[0] }; }
    return { n: 'film_elevator', z: 1.05, px: 0.5, py: 0.5, local: 0, start: 237.9 };
  }

  function draw(t) {
    const W = cv.width, H = cv.height;
    const fr = Math.floor(t * 24); // 24fps for weave, grain, flicker
    const sh = shotAt(t); const im = IMGS[sh.n];
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const wx = (U.hash(fr * 1.7) - 0.5) * W * 0.0025, wy = (U.hash(fr * 2.3) - 0.5) * H * 0.003;
    ctx.save(); ctx.translate(W / 2 + wx, H / 2 + wy); ctx.rotate((U.hash(fr * 3.1) - 0.5) * 0.0012); ctx.translate(-W / 2, -H / 2);
    if (im) cover(ctx, im, 0, 0, W, H, sh.z, sh.px, sh.py);
    if (hal[sh.n]) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.imageSmoothingQuality = 'high'; cover(ctx, hal[sh.n], 0, 0, W, H, sh.z, sh.px, sh.py); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
    // lifted blacks and a cool cast in the shadows
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(14,26,48,0.35)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    // flicker
    const fl = (U.hash(fr * 5.3) - 0.5) * 0.08; ctx.fillStyle = fl > 0 ? `rgba(255,240,220,${fl * 0.5})` : `rgba(0,0,0,${-fl})`; ctx.fillRect(0, 0, W, H);
    // light leak riding in on some cuts
    const leakK = (sh.start === 240 || sh.start === 246 || sh.start === 250) ? Math.sin(U.clamp(sh.local, 0, 1) * Math.PI) : 0;
    if (leakK > 0) { const g = ctx.createRadialGradient(0, H * 0.3, 0, 0, H * 0.3, W * 0.7); g.addColorStop(0, `rgba(255,120,40,${0.55 * leakK})`); g.addColorStop(0.5, `rgba(255,60,20,${0.18 * leakK})`); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    // grain
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.32; tile(ctx, TEX.grain, W, H, U.hash(fr) * 256, U.hash(fr + 9) * 256, Math.max(1, W / 1500)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // flash frames: white on line changes, black/white stutter in the montage
    const flashAt = [246.0, 254.0]; for (const f of flashAt) if (t >= f && t < f + 0.083) { ctx.fillStyle = 'rgba(255,250,240,0.92)'; ctx.fillRect(0, 0, W, H); }
    if (t >= 254 && t < 258 && sh.local < 0.08) { ctx.fillStyle = Math.floor((t - 254) / 0.5) % 2 ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,.55)'; ctx.fillRect(0, 0, W, H); }
    if (sh.fade !== undefined) { ctx.fillStyle = `rgba(0,0,0,${1 - sh.fade})`; ctx.fillRect(0, 0, W, H); }
    // 2.39:1 letterbox
    const bh = Math.round((H - W / 2.39) / 2); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
    // subtitles in the lower bar
    const line = L.at(t);
    if (line) {
      const n = L.shown(line, t); const fade = 1 - U.smooth(line.t1 - 0.3, line.t1, t);
      const fs = Math.round(H * 0.038); ctx.font = '500 ' + fs + 'px "Shippori Mincho B1", serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      const full = ctx.measureText(line.jp).width; let x = W / 2 - full / 2; const y = H - bh * 0.62;
      for (let i = 0; i < n; i++) { const a = U.clamp((t - line.ct[i]) / 0.08, 0, 1) * fade; ctx.fillStyle = `rgba(242,230,208,${a})`; ctx.fillText(line.jp[i], x, y); x += ctx.measureText(line.jp[i]).width; }
      if (line.cn) { const cs = Math.round(H * 0.024); ctx.font = '500 ' + cs + 'px "Noto Serif SC", serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(170,165,155,${fade * U.clamp((t - line.ct[0]) / 0.4, 0, 1)})`; ctx.fillText(line.cn, W / 2, y + fs * 0.95); }
    }
    // camera-report style slate in the top bar
    ctx.font = '500 ' + Math.round(H * 0.02) + 'px "Noto Sans SC", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(200,190,170,.5)';
    ctx.fillText('KODAK 5219 · 35MM · 24FPS', W * 0.03, bh / 2); ctx.textAlign = 'right'; ctx.fillText('ROLL 03  ·  ' + U.fmt(t), W * 0.97, bh / 2);
  }
  return { seg, poster: 239.0, maxW: 1600, draw, onReady: prepHalation };
});
