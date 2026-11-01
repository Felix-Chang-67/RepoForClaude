// ④ 複写 — riso / photocopy zine collage, stop-motion at 12fps.
Engine.register('d4', function (stage) {
  const { U, L, IMGS, TEX, tile } = Engine;
  const cv = stage.querySelector('canvas'); const ctx = cv.getContext('2d');
  const seg = [161.4, 179.8];
  const PINK = '#ff48b0', BLUE = '#3255a4', BLACK = '#161616';
  const Q1 = L.find('『変テコ', 161.6), Q2 = L.find('生活に', 165.8), Q3 = L.find('教科書', 169.6), Q4 = L.find('やけくそ', 173.7), AA = L.find('ああ', 177.6);
  const quotes = [Q1, Q2, Q3, Q4].filter(Boolean);

  function jit(id, fr, amp) { return [(U.hash(id * 17.1 + fr * 1.3) - 0.5) * amp, (U.hash(id * 9.7 + fr * 2.1) - 0.5) * amp, (U.hash(id * 5.3 + fr * 0.7) - 0.5) * amp * 0.004]; }
  function tape(x, y, w, h, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = 'rgba(222,208,170,.78)'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(-w / 2, -h / 2, w, h * 0.3); ctx.restore(); }
  function print(name, cx, cy, w, rot, id, fr, enter) {
    const im = IMGS[name]; if (!im) return; const h = w * im.height / im.width;
    const [jx, jy, jr] = jit(id, fr, w * 0.006);
    const s = 1 + (1 - U.easeOut(enter)) * 0.25;
    ctx.save(); ctx.translate(cx + jx, cy + jy); ctx.rotate(rot + jr); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = w * 0.02; ctx.shadowOffsetY = w * 0.006;
    ctx.globalAlpha = U.clamp(enter * 3, 0, 1); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
    ctx.globalAlpha = 1; tape(cx - w * 0.42 + jx, cy - h * 0.48 + jy, w * 0.16, w * 0.04, rot - 0.5); tape(cx + w * 0.43 + jx, cy + h * 0.47 + jy, w * 0.16, w * 0.04, rot - 0.4);
  }
  // a lyric on a strip of paper, misregistered black + pink
  function strip(line, x, y, w, rot, id, fr, t) {
    const n = L.shown(line, t); if (n <= 0) return;
    const enter = U.clamp((t - line.ct[0]) / 0.25, 0, 1);
    const [jx, jy, jr] = jit(id, fr, w * 0.004);
    const fs = Math.round(w * 0.040), pad = fs * 0.5;
    const jp = line.jp.replace(/[『』]/g, '');
    ctx.save(); ctx.translate(x + jx, y + jy); ctx.rotate(rot + jr); const s = 1 + (1 - U.easeOut(enter)) * 0.4; ctx.scale(s, s);
    ctx.font = '400 ' + fs + 'px "Zen Kurenaido", serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const tw = Math.min(w, ctx.measureText(jp).width + pad * 2);
    ctx.fillStyle = '#fbf8f1'; ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = fs * 0.4; ctx.fillRect(0, -fs * 1.0, tw, fs * 2.3); ctx.shadowBlur = 0;
    let xx = pad; const cut = Math.min(n, jp.length + 2);
    for (let i = 0, k = 0; i < line.jp.length && k < jp.length; i++) {
      if ('『』'.includes(line.jp[i])) continue; if (i >= cut) break;
      const ch = jp[k++]; ctx.fillStyle = PINK; ctx.globalAlpha = 0.8; ctx.fillText(ch, xx + fs * 0.06, -fs * 0.18 + fs * 0.05);
      ctx.globalAlpha = 1; ctx.fillStyle = BLACK; ctx.fillText(ch, xx, -fs * 0.18); xx += ctx.measureText(ch).width;
    }
    if (line.cn) { ctx.font = '400 ' + Math.round(fs * 0.62) + 'px "Long Cang", "Noto Serif SC", serif'; ctx.fillStyle = BLUE; ctx.globalAlpha = U.clamp((t - line.ct[0] - 0.3) / 0.3, 0, 1); ctx.fillText(line.cn.replace(/[『』]/g, ''), pad, fs * 0.72); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  function web(cx, cy, R, k, fr) {
    // hand-drawn spider web growing out of the ink blot; lines re-jitter every stop-motion frame
    ctx.save(); ctx.strokeStyle = 'rgba(50,85,164,.8)'; ctx.lineWidth = Math.max(1, R / 260); ctx.lineCap = 'round';
    const spokes = 11;
    for (let s = 0; s < spokes; s++) {
      const a = s / spokes * Math.PI * 2 + 0.2; const len = R * U.clamp(k * 1.6 - s * 0.03, 0, 1) * (0.8 + 0.4 * U.hash(s));
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let i = 1; i <= 8; i++) { const r = len * i / 8; const wob = (U.hash(s * 31 + i * 7 + fr * 0.37) - 0.5) * R * 0.012; ctx.lineTo(cx + Math.cos(a) * r - Math.sin(a) * wob, cy + Math.sin(a) * r * 0.62 + Math.cos(a) * wob); }
      ctx.stroke();
    }
    const rings = Math.floor(U.clamp(k * 1.4, 0, 1) * 9);
    for (let r = 1; r <= rings; r++) {
      const rr = R * r / 9.5; ctx.beginPath();
      for (let s = 0; s <= spokes; s++) { const a = s / spokes * Math.PI * 2 + 0.2; const wob = (U.hash(r * 13 + s * 3 + fr * 0.21) - 0.5) * R * 0.01; const sag = 0.94; const x = cx + Math.cos(a) * (rr + wob), y = cy + Math.sin(a) * (rr + wob) * 0.62; if (s === 0) ctx.moveTo(x, y); else { const pa = (s - 0.5) / spokes * Math.PI * 2 + 0.2; ctx.quadraticCurveTo(cx + Math.cos(pa) * rr * sag, cy + Math.sin(pa) * rr * sag * 0.62, x, y); } }
      ctx.stroke();
    }
    ctx.restore();
  }
  function textbook(x, y, w, h, rot, rotK, fr, t) {
    // an old textbook page set in vertical columns, rotting in pink from a few spores
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#f2eee4'; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = w * 0.03; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowBlur = 0;
    const src = '教科書に載っていた台詞は鏡の中また腐って僕らは鏡だ生き急いだまま互いを映す初めて気付いたよ多分足りないものだらけだと教えてくれたねまるで知らない僕のことを';
    const fs = w / 15; ctx.font = '500 ' + fs + 'px "Shippori Mincho B1", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(30,30,30,.82)';
    const cols = 11, rows = Math.floor((h * 0.84) / (fs * 1.05)); let k = 0;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) { const ch = src[k++ % src.length]; ctx.fillText(ch, w / 2 - fs * 1.2 - c * fs * 1.25, -h * 0.42 + r * fs * 1.05); }
    ctx.font = '500 ' + fs * 0.6 + 'px "Noto Sans SC", sans-serif'; ctx.fillText('— 108 —', 0, h * 0.46);
    // rot
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 7; i++) {
      const sx = (U.hash(i * 3.3) - 0.5) * w * 0.8, sy = (U.hash(i * 5.9) - 0.5) * h * 0.8; const r = w * 0.2 * U.easeOut(rotK * (0.6 + U.hash(i) * 0.6));
      for (let j = 0; j < 14; j++) { const a = U.hash(i * 31 + j) * 6.28; const d = r * Math.sqrt(U.hash(i * 17 + j * 3)); const rr = r * (0.18 + 0.3 * U.hash(i * 7 + j)); ctx.fillStyle = j % 5 === 0 ? 'rgba(40,30,30,.25)' : 'rgba(255,72,176,.22)'; ctx.beginPath(); ctx.ellipse(sx + Math.cos(a) * d, sy + Math.sin(a) * d * 1.3, rr, rr * (0.6 + U.hash(j) * 0.8), a, 0, 6.28); ctx.fill(); }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.restore();
  }
  function splatter(cx, cy, R, k, seed) {
    if (k <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,72,176,.85)';
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.35 * U.easeOut(k * 2), 0, 6.28); ctx.fill();
    for (let i = 0; i < 26; i++) { const a = U.hash(seed + i) * 6.28; const d = R * (0.3 + U.hash(seed + i * 3) * 0.9) * U.easeOut(k * 1.5); const r = R * (0.02 + U.hash(seed + i * 7) * 0.07); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
  function ransom(str, cx, cy, size, fr, t0, t) {
    const fonts = ['"Dela Gothic One"', '"Reggae One"', '"DotGothic16"', '"Shippori Mincho B1"'];
    const bgs = ['#161616', PINK, '#fbf8f1', BLUE]; const fgs = ['#fbf8f1', '#161616', '#161616', '#fbf8f1'];
    let x = cx - str.length * size * 0.55;
    for (let i = 0; i < str.length; i++) {
      const k = i % 4; const [jx, jy, jr] = jit(40 + i, fr, size * 0.08); const enter = U.clamp((t - t0 - i * 0.18) / 0.15, 0, 1); if (enter <= 0) continue;
      ctx.save(); ctx.translate(x + size * 0.55 + jx, cy + jy); ctx.rotate((U.hash(i * 9) - 0.5) * 0.3 + jr * 30); const s = 1 + (1 - U.easeOut(enter)) * 0.8; ctx.scale(s, s);
      ctx.fillStyle = bgs[k]; ctx.fillRect(-size * 0.55, -size * 0.6, size * 1.1, size * 1.2);
      ctx.fillStyle = fgs[k]; ctx.font = '400 ' + size + 'px ' + fonts[(i + 1) % 4] + ', serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str[i], 0, size * 0.04); ctx.restore();
      x += size * 1.15;
    }
  }

  function draw(t) {
    const W = cv.width, H = cv.height; const fr = Math.floor(t * 12); const tq = fr / 12;
    // shake on ああ
    const shake = AA && tq >= AA.ct[0] ? (U.hash(fr) - 0.5) * W * 0.012 : 0;
    ctx.save(); ctx.translate(shake, -shake * 0.5);
    ctx.fillStyle = '#ece6da'; ctx.fillRect(-W, -H, W * 3, H * 3); tile(ctx, TEX.paper, W, H, (fr % 3) * 7, 0, W / 1300);
    // scene by quote; each quote brings a print and its lyric strip, later pieces are glued over earlier ones
    const stripPos = [[0.04, 0.10, -0.02], [0.30, 0.82, 0.03], [0.40, 0.14, -0.03], [0.05, 0.86, 0.02]];
    const S = (i) => { const q = quotes[i]; if (q && tq >= q.ct[0] - 0.05) { const p = stripPos[i]; strip(q, W * p[0], H * p[1], W * 0.66, p[2], 10 + i, fr, t); } };
    const k1 = Q1 ? U.clamp((tq - Q1.ct[0]) / 3.2, 0, 1) : 0;
    if (Q1 && tq >= Q1.ct[0] - 0.3) {
      const enter = U.clamp((tq - Q1.ct[0] + 0.3) / 0.25, 0, 1);
      print('riso_rorschach', W * 0.54, H * 0.50, W * 0.64, -0.02, 1, fr, enter);
      web(W * 0.54, H * 0.51, W * 0.64, k1, fr);
    }
    S(0);
    if (Q2 && tq >= Q2.ct[0] - 0.2) print('riso_hands', W * 0.66, H * 0.48, W * 0.50, 0.05, 2, fr, U.clamp((tq - Q2.ct[0] + 0.2) / 0.25, 0, 1));
    S(1);
    if (Q3 && tq >= Q3.ct[0] - 0.2) {
      const enter = U.clamp((tq - Q3.ct[0] + 0.2) / 0.25, 0, 1); const rotK = U.clamp((tq - Q3.ct[0] - 0.8) / 3.0, 0, 1);
      ctx.save(); ctx.globalAlpha = U.clamp(enter * 3, 0, 1); textbook(W * 0.26 + (1 - U.easeOut(enter)) * W * 0.1, H * 0.52, W * 0.28, H * 0.80, -0.04, rotK, fr, tq); ctx.restore();
    }
    S(2);
    if (Q4 && tq >= Q4.ct[0] - 0.2) {
      print('riso_xerox', W * 0.62, H * 0.46, W * 0.60, -0.03, 4, fr, U.clamp((tq - Q4.ct[0] + 0.2) / 0.25, 0, 1));
      const dk = U.clamp((tq - (Q4.ct[Q4.jp.indexOf('毒')] || Q4.ct[0] + 1)) / 0.6, 0, 1); splatter(W * 0.70, H * 0.64, W * 0.22, dk, 77);
    }
    S(3);
    if (AA && tq >= AA.ct[0] - 0.05) { ctx.fillStyle = 'rgba(236,230,218,.55)'; ctx.fillRect(-W, -H, W * 3, H * 3); ransom('ああ', W * 0.5, H * 0.52, H * 0.34, fr, AA.ct[0], tq); }
    ctx.restore();
    // copier streaks + misregistered pink cast over the whole page
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,72,176,.05)'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) { const y = U.hash(fr * 3 + i) * H; ctx.fillStyle = 'rgba(20,20,20,.06)'; ctx.fillRect(0, y, W, H * 0.004); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.25; tile(ctx, TEX.grain, W, H, fr * 37, fr * 11, Math.max(1, W / 1200)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // zine page number
    ctx.font = '400 ' + Math.round(H * 0.03) + 'px "DotGothic16", monospace'; ctx.fillStyle = 'rgba(22,22,22,.7)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillText('MIRROR ZINE  P.' + (12 + Math.floor((t - 161.4) / 4)), W * 0.97, H * 0.96);
  }
  return { seg, poster: 172.3, maxW: 1600, draw };
});
