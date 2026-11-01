// ② 言葉の鏡像 — Japanese on the left page, its Chinese "reflection" mirrored on the right.
Engine.register('d2', function (stage) {
  const { U, L, TEX, tile } = Engine;
  const cv = stage.querySelector('canvas'); const ctx = cv.getContext('2d');
  const seg = [210.0, 232.0];
  const INV = 229.98;
  const get = (p, near) => L.find(p, near);
  const K1 = get('ウツラナイ', 210), N1 = get('言葉なんて', 211), K2 = get('キコエナイ', 214), N2 = get('なぜだろう', 215),
    K3 = get('ワカラナイ', 218), N3 = get('映り込んだ', 219), K4 = get('トマラナイ', 222), N4 = get('弱虫の', 223), CH = get('泣いてるのに', 230);
  const blocks = [[K1, N1, 'none'], [K2, N2, 'mute'], [K3, N3, 'scramble'], [K4, N4, 'scroll']].filter(b => b[0] && b[1]);
  const SMALL = 'ゃゅょっぁぃぅぇぉャュョッァィゥェォ';
  const KATA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const HAN = '镜映我你在哭泣话语听懂停下是的不了啊么';
  const INK = '#141414', PAPER = '#efece4', BLUE = '#1f3c8f', RED = '#c8102e';

  // vertical text: draws chars top->bottom; opts.mirror flips each glyph horizontally
  function vtext(str, x, y, size, opts) {
    const o = Object.assign({ n: str.length, times: null, t: 0, color: INK, font: '500', family: '"Shippori Mincho B1", serif', mirror: false, stroke: false, scramble: 0, drip: null, step: 1.06, alpha: 1 }, opts);
    ctx.font = o.font + ' ' + size + 'px ' + o.family; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let yy = y;
    for (let i = 0; i < str.length && i < o.n; i++) {
      let ch = str[i];
      if (ch === ' ' || ch === '　') { yy += size * 0.6; continue; }
      const age = o.times ? o.t - o.times[i] : 9;
      let a = U.clamp(age / 0.1, 0, 1) * o.alpha; if (a <= 0) { yy += size * o.step; continue; }
      if (o.scramble && age < o.scramble) { const pool = o.mirror ? HAN : KATA; ch = pool[Math.floor(U.hash(i * 13 + Math.floor(o.t * 20)) * pool.length)]; }
      let dx = 0, dy = 0, rot = 0;
      if (ch === '、' || ch === '。') { dx = size * 0.32; dy = -size * 0.32; }
      else if (SMALL.includes(ch)) { dx = size * 0.1; dy = -size * 0.08; }
      else if (ch === 'ー' || ch === '〜') rot = Math.PI / 2;
      if (o.drip && o.drip(i) && age > 0.35) { const k = age - 0.35; dy += k * k * size * 2.2; a *= U.clamp(1 - k / 1.6, 0, 1); }
      const pop = 1 + (1 - U.easeOut(age / 0.18)) * 0.25;
      ctx.save(); ctx.translate(x + dx, yy + dy); if (rot) ctx.rotate(rot); ctx.scale((o.mirror ? -1 : 1) * pop, pop);
      ctx.globalAlpha = a;
      if (o.stroke) { ctx.lineWidth = Math.max(1, size * 0.025); ctx.strokeStyle = o.color; ctx.strokeText(ch, 0, 0); }
      else { ctx.fillStyle = o.color; ctx.fillText(ch, 0, 0); }
      ctx.restore();
      yy += size * o.step;
    }
    ctx.globalAlpha = 1;
  }
  const lag = (arr, s) => arr.map(v => v + s);

  function manuscript(W, H, inv) {
    // 原稿用紙-like cells: vermilion on the left page, blue on the right (its reflection)
    const cols = 10, cell = W * 0.5 / (cols + 2.2), top = H * 0.08, rows = Math.floor(H * 0.84 / cell);
    ctx.lineWidth = Math.max(1, W / 1600);
    for (const side of [0, 1]) {
      ctx.strokeStyle = inv ? 'rgba(255,255,255,.07)' : (side ? 'rgba(31,60,143,.16)' : 'rgba(200,60,40,.16)');
      const x0 = side ? W * 0.5 + cell * 1.1 : cell * 1.1;
      for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(x0 + c * cell, top); ctx.lineTo(x0 + c * cell, top + rows * cell); ctx.stroke(); }
      for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(x0, top + r * cell); ctx.lineTo(x0 + cols * cell, top + r * cell); ctx.stroke(); }
    }
  }
  function regMark(x, y, r, col) {
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  }
  function annotations(W, H, t, inv) {
    const col = inv ? 'rgba(230,230,230,.55)' : 'rgba(20,20,20,.55)';
    const fs = Math.round(H * 0.022); ctx.font = '500 ' + fs + 'px "Noto Sans SC", sans-serif'; ctx.fillStyle = col; ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillText('MIRROR — ヒトリエ', W * 0.03, H * 0.055);
    ctx.textAlign = 'right'; ctx.fillText('No.10  ·  120 BPM  ·  4/4', W * 0.97, H * 0.055);
    ctx.textAlign = 'left'; ctx.fillText('BAR ' + String(Math.floor(U.barF(t)) + 1).padStart(3, '0') + ' / 150', W * 0.03, H * 0.965);
    ctx.textAlign = 'right'; ctx.fillText(U.fmt(t), W * 0.97, H * 0.965);
    regMark(W * 0.5, H * 0.04, H * 0.018, col); regMark(W * 0.5, H * 0.96, H * 0.018, col);
  }

  function drawBlock(W, H, t, b, alpha) {
    const [K, N, mode] = b;
    const big = H * 0.118, sm = H * 0.043;
    const kn = L.shown(K, t);
    const parts = K.jp.split('　'); // two repetitions
    const xs = [W * 0.37, W * 0.24];
    let offs = 0;
    for (let r = 0; r < parts.length && r < 2; r++) {
      const s = parts[r]; const times = K.ct.slice(offs, offs + s.length); offs += s.length + 1;
      const n = Math.max(0, Math.min(s.length, kn - (offs - s.length - 1)));
      const style = { n, times, t, font: '800', alpha, color: INK, step: 1.02 };
      if (mode === 'mute') { style.stroke = true; style.color = 'rgba(20,20,20,.55)'; }
      if (mode === 'scramble') style.scramble = 0.45;
      if (mode === 'scroll') {
        // the column keeps sliding down, faster and faster, with copies above it
        const v = (tt) => 0.25 * (tt - K.t0) + 0.42 * Math.pow(Math.max(0, tt - K.t0), 2.2);
        const shift = (v(t) * H) % (big * 6.2);
        ctx.save(); ctx.beginPath(); ctx.rect(0, H * 0.08, W * 0.5, H * 0.84); ctx.clip();
        for (let c = -1; c < 3; c++) vtext(s, xs[r], H * 0.16 + shift - c * big * 6.2, big, Object.assign({}, style, { n: c === 0 ? n : (n > 0 ? s.length : 0), t: c === 0 ? t : 99, times: c === 0 ? times : times.map(() => 0) }));
        ctx.restore();
      } else vtext(s, xs[r], H * 0.16, big, style);
      // reflection on the right page
      if (mode === 'none') {
        // ウツラナイ: nothing reflects — only empty dashed cells where the glyphs should be
        ctx.save(); ctx.setLineDash([big * 0.06, big * 0.06]); ctx.strokeStyle = `rgba(31,60,143,${0.35 * alpha})`; ctx.lineWidth = Math.max(1, H / 700);
        for (let i = 0; i < n; i++) { const yy = H * 0.16 + i * big * 1.02; ctx.strokeRect(W - xs[r] - big * 0.45, yy - big * 0.45, big * 0.9, big * 0.9); }
        ctx.restore();
      } else {
        const cnParts = K.cn.split(/\s+/); const cs = cnParts[r] || cnParts[0] || '';
        const ctimes = cs.split('').map((_, i) => (times[Math.min(i, times.length - 1)] || K.t0) + 0.5);
        const mstyle = Object.assign({}, style, { mirror: true, family: '"Noto Serif SC", serif', font: '900', color: BLUE, times: ctimes, n: 99 });
        if (mode === 'scroll') {
          const v = (tt) => 0.25 * (tt - K.t0 - 0.5) + 0.42 * Math.pow(Math.max(0, tt - K.t0 - 0.5), 2.2);
          const shift = (Math.max(0, v(t)) * H) % (big * 6.2);
          ctx.save(); ctx.beginPath(); ctx.rect(W * 0.5, H * 0.08, W * 0.5, H * 0.84); ctx.clip();
          for (let c = -1; c < 3; c++) vtext(cs, W - xs[r], H * 0.16 + shift - c * big * 6.2, big, Object.assign({}, mstyle, { t: c === 0 ? t : (t > K.t0 + 0.6 ? 99 : t) }));
          ctx.restore();
        } else vtext(cs, W - xs[r] + big * 0.12, H * 0.16 + big * 0.2, big, mstyle);
      }
    }
    // the sung line, small, at the outer edge of each page
    const nn = L.shown(N, t);
    const isDrip = N.jp.startsWith('なぜだろう'); const dripFrom = N.jp.indexOf('こぼれ');
    vtext(N.jp, W * 0.085, H * 0.12, sm, { n: nn, times: N.ct, t, alpha, drip: isDrip ? (i) => i >= dripFrom : null });
    if (N.jp.startsWith('映り込んだ')) {
      // the singer's own line appears in the mirror: Japanese reflected, translation as a note
      vtext(N.jp, W - W * 0.085, H * 0.12, sm, { n: nn, times: lag(N.ct, 0.5), t, alpha, mirror: true, color: BLUE });
      ctx.save(); ctx.globalAlpha = alpha * U.clamp((t - N.ct[0] - 0.6) / 0.4, 0, 1); ctx.fillStyle = 'rgba(20,20,20,.6)';
      ctx.font = '500 ' + Math.round(sm * 0.62) + 'px "Noto Serif SC", serif'; ctx.textAlign = 'right'; ctx.fillText(N.cn, W * 0.955, H * 0.9); ctx.restore();
    } else {
      const cn = N.cn.replace(/\s+/g, '　');
      const ctimes = cn.split('').map((_, i) => N.ct[0] + 0.5 + i * ((N.sungEnd - N.ct[0]) / Math.max(1, cn.length)));
      vtext(cn, W - W * 0.085, H * 0.12, sm, { n: 99, times: ctimes, t, alpha, mirror: true, family: '"Noto Serif SC", serif', color: BLUE, drip: isDrip ? (i) => i >= cn.length - 6 : null });
    }
    if (mode === 'mute') {
      // a flat line across both pages: the sound has stopped reaching the other side
      const y = H * 0.5; ctx.strokeStyle = `rgba(200,16,46,${0.75 * alpha})`; ctx.lineWidth = Math.max(1.5, H / 420); ctx.beginPath();
      const k = U.clamp((t - K.t0) / 1.2, 0, 1);
      for (let x = 0; x <= W; x += W / 240) { const amp = (1 - k) * H * 0.05 * Math.sin(x * 0.05 + t * 30) * Math.sin(x * 0.011); x === 0 ? ctx.moveTo(x, y + amp) : ctx.lineTo(x, y + amp); }
      ctx.stroke();
    }
  }

  function tunnel(W, H, t) {
    // nested frames made of 泣いてるのに: a mirror corridor built from the word itself
    const reps = CH ? [0, 6, 12].filter(i => CH.ct[i] - 0.03 <= t).length : 1;
    const e = t - INV; const beat = U.beatF(t);
    const z = Math.floor(beat) + U.easeOut(Math.min(1, U.fract(beat) * 1.4)) + 2 * (1 - Math.exp(-e * 3));
    const word = '泣いてるのに';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const glyph = (ch, x, y, fs, a, sx, sy) => { ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.fillStyle = ch === '泣' ? `rgba(230,40,60,${a})` : `rgba(236,236,236,${a})`; ctx.fillText(ch, 0, 0); ctx.restore(); };
    for (let k = 9; k >= 0; k--) {
      const s = Math.pow(0.66, k - U.fract(z)); if (s > 1.3 || s < 0.035) continue;
      const hw = W * 0.47 * s, hh = H * 0.43 * s, fs = H * 0.06 * s;
      const a = U.clamp(s * 1.8, 0, 1) * (k < reps * 3 ? 0.95 : 0.16);
      ctx.font = '800 ' + fs + 'px "Shippori Mincho B1", serif';
      const step = fs * 1.04, nT = Math.max(1, Math.floor(2 * hw / step)), nS = Math.max(1, Math.floor(2 * hh / step));
      const cx = W / 2, cy = H / 2; let j = (k * 5) % 6;
      for (let i = 0; i < nT; i++) { const x = cx - hw + (i + 0.5) * (2 * hw / nT); glyph(word[(j + i) % 6], x, cy - hh, fs, a, 1, 1); glyph(word[(j + i) % 6], x, cy + hh, fs, a * 0.55, 1, -1); }
      for (let i = 0; i < nS; i++) { const y = cy - hh + (i + 0.5) * (2 * hh / nS); glyph(word[(j + i) % 6], cx - hw, y, fs, a, 1, 1); glyph(word[(j + i) % 6], cx + hw, y, fs, a * 0.75, -1, 1); }
    }
    // 君はいないな: on the left only; the mirror side stays empty
    if (CH) {
      const i0 = CH.jp.indexOf('君'); if (t >= CH.ct[i0] - 0.03) {
        const n = L.shown(CH, t) - i0; const word2 = CH.jp.slice(i0); const fs = H * 0.085;
        ctx.fillStyle = 'rgba(8,8,9,.82)'; ctx.fillRect(W * 0.08, H * 0.40, W * 0.84, H * 0.22);
        ctx.font = '800 ' + fs + 'px "Shippori Mincho B1", serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        const w = ctx.measureText(word2).width; let x = W * 0.29 - w / 2;
        for (let i = 0; i < word2.length && i < n; i++) { const al = U.clamp((t - CH.ct[i0 + i]) / 0.1, 0, 1); ctx.fillStyle = `rgba(240,240,240,${al})`; ctx.fillText(word2[i], x, H * 0.49); x += ctx.measureText(word2[i]).width; }
        ctx.font = '500 ' + Math.round(fs * 0.34) + 'px "Noto Serif SC", serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,200,200,.75)'; ctx.fillText('你却不在了啊', W * 0.29, H * 0.575);
        ctx.save(); ctx.setLineDash([H * 0.012, H * 0.012]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, H / 500); ctx.strokeRect(W * 0.55, H * 0.43, W * 0.33, H * 0.16); ctx.restore();
      }
    }
  }
  function draw(t) {
    const W = cv.width, H = cv.height;
    const inv = t >= INV;
    if (inv) { ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, W, H); }
    else { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 0.9; tile(ctx, TEX.paper, W, H, 0, 0, W / 1400); ctx.globalAlpha = 1; }
    const silence = t >= 226.3 && t < INV;
    const fadeAll = silence ? 1 - U.smooth(226.3, 226.9, t) : 1;
    ctx.globalAlpha = inv ? 0.6 : fadeAll * 0.9 + 0.1; manuscript(W, H, inv); ctx.globalAlpha = 1;
    // mirror axis
    const axisA = silence ? 1 - U.smooth(228.6, 229.9, t) * 0.85 : 1;
    ctx.strokeStyle = inv ? 'rgba(255,255,255,.35)' : `rgba(20,20,20,${0.8 * axisA})`; ctx.lineWidth = Math.max(1, W / 1000);
    ctx.beginPath(); ctx.moveTo(W / 2, H * 0.07); ctx.lineTo(W / 2, H * 0.93); ctx.stroke();
    if (!inv) {
      for (const b of blocks) {
        const [K] = b; const next = blocks[blocks.indexOf(b) + 1];
        const end = next ? next[0].t0 - 0.05 : 226.3;
        if (t < K.t0 - 0.1 || t > end + 0.4) continue;
        const a = (1 - U.smooth(end, end + 0.35, t)) * fadeAll; if (a > 0.01) drawBlock(W, H, t, b, a);
      }
      if (silence) {
        const s = Math.round(H * 0.03); ctx.font = '500 ' + s + 'px "Noto Sans SC", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(20,20,20,${0.45 * U.smooth(226.8, 227.6, t)})`;
        ctx.fillText('（ 3.7 秒 无 音 ）', W / 2 + W * 0.18, H * 0.5);
      }
    } else tunnel(W, H, t);
    // flash on the inversion
    if (inv && t - INV < 0.12) { ctx.fillStyle = `rgba(255,255,255,${1 - (t - INV) / 0.12})`; ctx.fillRect(0, 0, W, H); }
    annotations(W, H, t, inv);
  }
  return { seg, poster: 215.9, maxW: 1600, draw };
});
