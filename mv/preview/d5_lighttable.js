// ⑤ 透写台 — genga sheets on a light table, lyrics on the timing sheet.
Engine.register('d5', function (stage) {
  const { U, L, IMGS, TEX, tile, cover } = Engine;
  const cv = stage.querySelector('canvas:not(.ov)'); const ctx = cv.getContext('2d');
  const ov = stage.querySelector('canvas.ov'); if (ov) ov.style.display = 'none';
  const seg = [224.0, 246.0];
  const ON = 229.98;
  const CH = L.find('泣いてるのに', 230.2), CH2 = L.find('泣いてるのに', 237.9);
  const kimiT = CH ? CH.ct[CH.jp.indexOf('君')] : 236.0;
  const PHOTO = [242.0, 246.0];

  // exposure schedule: [start, top sheet, lower sheet, cel label]
  const sched = [
    [224.0, 'genga_a12', 'genga_a13', 'A12'], [224.62, 'genga_a13', 'genga_a12', 'A13'], [225.38, 'genga_a14', 'genga_a13', 'A14'],
    [ON, 'genga_color', 'genga_a12', '色'], [233.0, 'genga_c3', 'genga_a14', 'C3'], [237.9, 'genga_color', 'genga_a14', '色'],
    [240.0, 'flip', 'genga_a14', 'A12'], [PHOTO[0], 'photo', null, '—']
  ];
  const cur = t => { let s = sched[0]; for (const x of sched) if (t >= x[0]) s = x; return s; };

  function light(t) {
    if (t < 226.3) return 1;
    if (t < 226.8) { const pat = [1, 0, 0.8, 0, 0.5, 0, 0.3, 0]; return pat[Math.floor((t - 226.3) / 0.0625) % pat.length] * 0.9; }
    if (t < ON) return 0;
    return 1 + 0.9 * Math.exp(-(t - ON) * 5);
  }
  // sheet rect inside the light-table area
  function geom(W, H) { const sw = W * 0.69, sh = sw * 9 / 16; return { sx: W * 0.035, sy: H * 0.095, sw, sh }; }

  function sheet(name, g, lit, alpha, dx, dy, rot) {
    const im = IMGS[name]; if (!im) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(g.sx + g.sw / 2 + dx, g.sy + g.sh / 2 + dy); ctx.rotate(rot);
    if (lit > 0.02) {
      // backlit paper: warm light multiplied by the drawing
      ctx.fillStyle = `rgb(${Math.min(255, 255 * lit)},${Math.min(255, 236 * lit)},${Math.min(255, 196 * lit)})`; ctx.fillRect(-g.sw / 2, -g.sh / 2, g.sw, g.sh);
      ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(im, -g.sw / 2, -g.sh / 2, g.sw, g.sh);
      if (lit > 1) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,236,200,${Math.min(0.85, (lit - 1))})`; ctx.fillRect(-g.sw / 2, -g.sh / 2, g.sw, g.sh); }
    } else {
      ctx.drawImage(im, -g.sw / 2, -g.sh / 2, g.sw, g.sh); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(38,40,52)'; ctx.fillRect(-g.sw / 2, -g.sh / 2, g.sw, g.sh);
    }
    ctx.restore();
  }
  function pegBar(g) {
    const bw = g.sw * 0.42, bh = g.sh * 0.045, x = g.sx + g.sw / 2 - bw / 2, y = g.sy - bh * 0.35;
    const gr = ctx.createLinearGradient(0, y, 0, y + bh); gr.addColorStop(0, '#6d6f74'); gr.addColorStop(0.5, '#3b3d42'); gr.addColorStop(1, '#202125');
    ctx.fillStyle = gr; ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = '#8b8e94'; ctx.beginPath(); ctx.arc(g.sx + g.sw / 2, y + bh * 0.5, bh * 0.28, 0, 6.28); ctx.fill();
    [-1, 1].forEach(s => ctx.fillRect(g.sx + g.sw / 2 + s * g.sw * 0.333 - bh * 0.6, y + bh * 0.32, bh * 1.2, bh * 0.36));
  }
  function storm(g, t) {
    const e = t - ON; if (e < 0 || e > 1.8) return;
    const names = ['genga_a12', 'genga_a13', 'genga_a14', 'genga_c3'];
    for (let i = 0; i < 22; i++) {
      const a = U.hash(i * 3.7) * Math.PI * 2, sp = (0.7 + U.hash(i * 5.1) * 1.2) * g.sw;
      const x = g.sx + g.sw / 2 + Math.cos(a) * sp * e + (U.hash(i) - 0.5) * g.sw * 0.3;
      const y = g.sy + g.sh / 2 + Math.sin(a) * sp * e * 0.7 + 0.5 * g.sh * 1.8 * e * e + (U.hash(i * 2) - 0.5) * g.sh * 0.3;
      const w = g.sw * (0.22 + U.hash(i * 7.3) * 0.16), h = w * 9 / 16, rot = (U.hash(i * 9.1) - 0.5) * 7 * e + (U.hash(i * 4.2) - 0.5);
      const im = IMGS[names[i % 4]]; if (!im) continue;
      ctx.save(); ctx.globalAlpha = U.clamp(1.6 - e, 0, 1); ctx.translate(x, y); ctx.rotate(rot);
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = w * 0.05; ctx.shadowOffsetY = w * 0.03; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
    }
  }

  function timingSheet(W, H, t, lit) {
    const x0 = W * 0.755, y0 = H * 0.035, pw = W * 0.225, ph = H * 0.93;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = W * 0.01; ctx.fillStyle = '#efeadf'; ctx.fillRect(x0, y0, pw, ph); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip(); tile(ctx, TEX.paper, W, H, 0, 0, W / 1400); ctx.restore();
    const ink = '#2b2b2b', red = '#c23a2c', grid = 'rgba(70,130,120,'; const hand = '"Klee One", serif';
    const cols = [0, 0.15, 0.47, 0.66, 0.83, 1].map(c => x0 + c * pw);
    const top = y0 + ph * 0.115, bot = y0 + ph * 0.985, gh = bot - top;
    // header
    ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = '600 ' + Math.round(ph * 0.026) + 'px ' + hand; ctx.fillText('タイムシート', x0 + pw * 0.05, y0 + ph * 0.03);
    ctx.font = '400 ' + Math.round(ph * 0.02) + 'px ' + hand; ctx.fillText('MIRROR　C-12　(3+12)', x0 + pw * 0.05, y0 + ph * 0.06);
    ctx.font = '600 ' + Math.round(ph * 0.019) + 'px ' + hand; ctx.textAlign = 'center';
    ['秒', 'セリフ', '訳', 'A', 'B'].forEach((h, i) => ctx.fillText(h, (cols[i] + cols[i + 1]) / 2, y0 + ph * 0.095));
    ctx.strokeStyle = grid + '.9)'; ctx.lineWidth = Math.max(1, W / 1000);
    ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0 + pw, top); ctx.stroke();
    cols.slice(1, -1).forEach(cx => { ctx.beginPath(); ctx.moveTo(cx, y0 + ph * 0.08); ctx.lineTo(cx, bot); ctx.stroke(); });
    // rows: one row = 3 frames (a 16th note), the sheet scrolls under a fixed read line
    const rows = 34, rh = gh / rows, readY = top + gh * 0.42;
    const Y = tt => readY + (tt - t) * 8 * rh;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, top, pw, gh); ctx.clip();
    for (let k = Math.floor((t - 2.2) * 8); k <= Math.ceil((t + 3.2) * 8); k++) {
      const tt = k / 8, y = Y(tt); if (y < top || y > bot) continue;
      const sec = k % 8 === 0, beat = k % 4 === 0;
      ctx.strokeStyle = grid + (sec ? '.85)' : beat ? '.5)' : '.22)'); ctx.lineWidth = Math.max(1, W / (sec ? 700 : 1400));
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + pw, y); ctx.stroke();
      if (sec) { ctx.fillStyle = 'rgba(40,40,40,.7)'; ctx.font = '400 ' + Math.round(rh * 0.95) + 'px ' + hand; ctx.textAlign = 'center'; ctx.fillText(String(Math.round((tt - 224) * 24)), (cols[0] + cols[1]) / 2, y + rh * 0.5); }
    }
    // dialogue: pre-written lightly in pencil, darkened when sung
    const csz = Math.min(rh * 1.02, (cols[2] - cols[1]) * 0.5);
    ctx.textAlign = 'center';
    for (const l of L.all) {
      if (l.t1 < t - 2.5 || l.t0 > t + 3.5) continue;
      for (let i = 0; i < l.jp.length; i++) {
        const ch = l.jp[i]; if (' 　『』、。'.includes(ch)) continue;
        const y = Y(l.ct[i]) + rh * 0.5; if (y < top - rh || y > bot + rh) continue;
        const sung = l.ct[i] <= t + 0.02;
        ctx.font = (sung ? '600 ' : '400 ') + Math.round(csz) + 'px ' + hand; ctx.fillStyle = sung ? 'rgba(25,25,25,.95)' : 'rgba(60,60,60,.32)';
        ctx.fillText(ch, (cols[1] + cols[2]) / 2 + (U.hash(i * 3.1 + l.t0) - 0.5) * csz * 0.15, y);
      }
      if (l.cn) { // translation, red pencil, written down the 訳 column from the line start
        const cn = l.cn.replace(/\s+/g, ''); const step = Math.min(rh * 1.05, ((l.sungEnd - l.ct[0]) * 8 * rh) / cn.length);
        ctx.font = '400 ' + Math.round(Math.min(rh * 1.1, (cols[3] - cols[2]) * 0.6)) + 'px "Long Cang", "Noto Serif SC", serif'; ctx.fillStyle = red;
        for (let i = 0; i < cn.length; i++) { const y = Y(l.ct[0]) + rh * 0.5 + i * step; if (y > top - rh && y < bot + rh) { ctx.globalAlpha = l.ct[0] <= t ? 0.9 : 0.3; ctx.fillText(cn[i], (cols[2] + cols[3]) / 2, y); } }
        ctx.globalAlpha = 1;
      }
    }
    // silence note
    { const ya = Y(226.3), yb = Y(ON); if (yb > top && ya < bot) { ctx.strokeStyle = red; ctx.lineWidth = Math.max(1.2, W / 800); ctx.beginPath(); ctx.moveTo(cols[1] + pw * 0.04, ya); ctx.lineTo(cols[1] + pw * 0.02, ya); ctx.lineTo(cols[1] + pw * 0.02, yb); ctx.lineTo(cols[1] + pw * 0.04, yb); ctx.stroke(); ctx.fillStyle = red; ctx.font = '600 ' + Math.round(rh * 1.1) + 'px ' + hand; ctx.fillText('無音', (cols[1] + cols[2]) / 2, (ya + yb) / 2 - rh); ctx.fillText('3.7秒', (cols[1] + cols[2]) / 2, (ya + yb) / 2 + rh * 0.6); } }
    // cel exposures in column A
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, W / 900); ctx.fillStyle = ink; ctx.font = '600 ' + Math.round(rh * 0.95) + 'px ' + hand;
    sched.forEach((s, i) => {
      const ya = Y(s[0]) + rh * 0.5, yb = Y(sched[i + 1] ? sched[i + 1][0] : 260); const cx = (cols[3] + cols[4]) / 2;
      if (yb < top || ya > bot) return; ctx.fillText(s[3], cx, ya); ctx.beginPath(); ctx.moveTo(cx, ya + rh * 0.7); ctx.lineTo(cx, yb - rh * 0.2); ctx.stroke();
    });
    ctx.restore();
    // read line
    ctx.strokeStyle = 'rgba(200,40,40,.85)'; ctx.lineWidth = Math.max(1.5, W / 700); ctx.beginPath(); ctx.moveTo(x0 - W * 0.006, readY); ctx.lineTo(x0 + pw, readY); ctx.stroke();
    // the room light also falls on the sheet
    if (lit < 0.99) { ctx.fillStyle = `rgba(4,5,9,${(1 - Math.min(1, lit)) * 0.72})`; ctx.fillRect(x0, y0, pw, ph); }
  }

  function draw(t) {
    const W = cv.width, H = cv.height; const g = geom(W, H); const lit = light(t);
    const fr = Math.floor(t * 12);
    // desk
    ctx.fillStyle = '#0c0a09'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.07; tile(ctx, TEX.paper, W, H, 0, 0, W / 900); ctx.globalAlpha = 1;
    if (t >= PHOTO[0]) {
      const k = (t - PHOTO[0]) / (PHOTO[1] - PHOTO[0]);
      cover(ctx, IMGS.lighttable, 0, 0, W, H, U.mix(1.32, 1.04, U.easeOut(k)), 0.45, 0.48);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.25; tile(ctx, TEX.grain, W, H, U.hash(fr) * 256, U.hash(fr + 3) * 256, Math.max(1, W / 1500)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (t < PHOTO[0] + 0.08) { ctx.fillStyle = 'rgba(255,245,225,.8)'; ctx.fillRect(0, 0, W, H); }
      caption(W, H, t, 1, true); return;
    }
    // glow spill of the light table on the desk
    const lg = Math.min(lit, 1.4);
    if (lg > 0.01) { const gr = ctx.createRadialGradient(g.sx + g.sw / 2, g.sy + g.sh / 2, g.sh * 0.3, g.sx + g.sw / 2, g.sy + g.sh / 2, g.sw * 0.75); gr.addColorStop(0, `rgba(255,214,150,${0.22 * lg})`); gr.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
    // the light table frame
    const pad = W * 0.012; ctx.fillStyle = '#1b1a1a'; ctx.fillRect(g.sx - pad * 1.6, g.sy - pad * 1.6, g.sw + pad * 3.2, g.sh + pad * 3.2);
    ctx.fillStyle = lg > 0.01 ? `rgba(255,236,200,${0.85 * Math.min(1, lg)})` : '#141519'; ctx.fillRect(g.sx - pad, g.sy - pad, g.sw + pad * 2, g.sh + pad * 2);
    // rostrum camera: slow push on the crying close-up
    const s = cur(t); const push = s[1] === 'genga_c3' ? 1 + 0.06 * U.smooth(233, 236, t) : 1;
    ctx.save(); const cx = g.sx + g.sw / 2, cy = g.sy + g.sh / 2; ctx.translate(cx, cy); ctx.scale(push, push); ctx.translate(-cx, -cy);
    ctx.beginPath(); ctx.rect(g.sx - pad, g.sy - pad, g.sw + pad * 2, g.sh + pad * 2); ctx.clip();
    // line boil: the sheet shifts a hair every 2 frames, like redrawn pencil
    const bx = (U.hash(fr * 1.9) - 0.5) * W * 0.0012, by = (U.hash(fr * 2.7) - 0.5) * W * 0.0012, br = (U.hash(fr * 3.3) - 0.5) * 0.0016;
    // lower sheet, seen through the top one only when the table is lit
    if (s[2] && lit > 0.05) sheet(s[2], g, Math.min(lit, 1), 0.28 * Math.min(1, lit), g.sw * 0.012, g.sh * 0.01, 0.004);
    let top = s[1];
    if (top === 'flip') { const names = ['genga_a12', 'genga_a13', 'genga_a14']; top = names[Math.floor(U.beatF(t) * 2) % 3]; }
    if (top === 'genga_c3' && t >= kimiT) {
      // lift the top sheet away: what is underneath is the empty mirror
      const k = U.easeIn(U.clamp((t - kimiT) / 0.6, 0, 1));
      sheet('genga_a14', g, Math.min(lit, 1.2), 1, bx, by, br);
      if (k < 1) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = W * 0.03; ctx.shadowOffsetY = W * 0.02 * k; sheet('genga_c3', g, Math.min(lit, 1.2), 1, g.sw * 0.1 * k, -g.sh * 1.25 * k, -0.18 * k); ctx.restore(); }
    } else sheet(top, g, lit, 1, bx, by, br);
    ctx.restore();
    pegBar(g);
    storm(g, t);
    // overexposure when the light slams back on
    if (t >= ON) { const e = t - ON; ctx.fillStyle = `rgba(255,246,228,${Math.exp(-e * 9) * 0.95})`; ctx.fillRect(0, 0, W, H); }
    timingSheet(W, H, t, lit);
    caption(W, H, t, lit, false);
    // grain + vignette
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.22; tile(ctx, TEX.grain, W, H, U.hash(fr) * 256, U.hash(fr + 5) * 256, Math.max(1, W / 1500)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const v = ctx.createRadialGradient(W * 0.4, H / 2, H * 0.4, W * 0.4, H / 2, W * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  // the sung line, handwritten under the light table
  function caption(W, H, t, lit, photo) {
    const line = L.at(t); if (!line) return; const n = L.shown(line, t); if (n <= 0) return;
    const fade = 1 - U.smooth(line.t1 - 0.3, line.t1, t);
    const fs = Math.round(H * 0.042); ctx.font = '600 ' + fs + 'px "Klee One", serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const x0 = photo ? W * 0.05 : W * 0.04, y = photo ? H * 0.9 : H * 0.885; let x = x0;
    const glow = photo ? 1 : Math.max(0.35, Math.min(1, lit));
    if (photo) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, y - fs * 1.1, W, fs * 2.6); }
    for (let i = 0; i < n; i++) { const a = U.clamp((t - line.ct[i]) / 0.1, 0, 1) * fade * glow; ctx.fillStyle = `rgba(236,226,206,${a})`; ctx.fillText(line.jp[i], x, y); x += ctx.measureText(line.jp[i]).width; }
    if (line.cn) { ctx.font = '400 ' + Math.round(fs * 0.85) + 'px "Long Cang", "Noto Serif SC", serif'; ctx.fillStyle = `rgba(226,92,72,${fade * glow * U.clamp((t - line.ct[0] - 0.3) / 0.4, 0, 1)})`; ctx.fillText(line.cn, x0, y + fs * 1.05); }
  }
  return { seg, poster: 231.6, maxW: 1600, draw };
});
