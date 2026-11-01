// MIRROR sample v4 (song time 210.0–246.0), drawn at 4K from a 1920x1080 logical layout.
// Story mode = pencil keyframe sheets (genga) with pencil-written lyrics.
// Chorus = 4-ink risograph prints, each ink plate composited separately so the plates
// misregister on the drums; knockout type and overprinted ink type.
(() => {
  const W = 1920, H = 1080, S = 2, DW = W * S, DH = H * S;
  const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = DW; c.height = DH; return c; };
  const OFF = mk(), off = OFF.getContext('2d');
  const T1 = mk(), t1 = T1.getContext('2d');

  // ---------- utils ----------
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), mix = (a, b, t) => a + (b - a) * t, fract = x => x - Math.floor(x);
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const eo = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3), ei = t => Math.pow(clamp(t, 0, 1), 3);
  const eio = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const beatF = t => (t - 10) / 0.5;
  const SIL = 226.30, SHATTER = 229.98;

  // ---------- lyrics ----------
  const LL = LYRICS;
  const find = (p, near) => { let b = null; for (const l of LL) if (l.jp.startsWith(p) && (!b || Math.abs(l.t0 - near) < Math.abs(b.t0 - near))) b = l; return b; };
  const K1 = find('ウツラナイ', 210), N1 = find('言葉なんて', 211), K2 = find('キコエナイ', 214), N2 = find('なぜだろう', 215),
    K3 = find('ワカラナイ', 218), N3 = find('映り込んだ', 219), K4 = find('トマラナイ', 222), N4 = find('弱虫の', 223),
    CA = find('泣いてるのに', 230.2), CB = find('泣いてるのに', 237.9);
  const lineAt = t => { let cur = null; for (const l of LL) { const s = Math.min(l.t0, l.ct[0]) - .1; if (t >= s && t < l.t1 - .02) cur = l; } return cur; };

  // ---------- drums ----------
  const hitIdx = (arr, t) => { let k = -1; for (let i = 0; i < arr.length; i++) { if (arr[i] <= t + 1e-4) k = i; else break; } return k; };
  const lastHit = (arr, t) => { const k = hitIdx(arr, t); return k < 0 ? -1e9 : arr[k]; };
  const kickP = (t, k = 9) => Math.exp(-(t - lastHit(DRUMS.kick, t)) * k);
  const snareP = (t, k = 12) => Math.exp(-(t - lastHit(DRUMS.snare, t)) * k);

  // ---------- inks & assets ----------
  const INK = { pink: [255, 72, 176], mint: [104, 210, 200], blue: [42, 76, 176], black: [34, 31, 36] };
  const SWAP = { pink: 'mint', mint: 'pink', blue: 'blue', black: 'black' };
  const PLATES = ['blue', 'mint', 'pink', 'black'];
  const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const RISO_PAPER = '#f2eee3', SHEET_PAPER = '#e2d8c9';
  const IM = {};
  const list = [];
  ['g1', 'g2', 'g3', 'g4', 'g5', 'blank'].forEach(n => list.push([n, 'art/' + n + '.jpg']));
  ['c1', 'c2', 'c2e', 'c3', 'c4', 'c5'].forEach(n => PLATES.forEach(k => list.push([n + '_' + k, 'art/' + n + '_' + k + '.png'])));
  const loadArt = () => Promise.all(list.map(([n, src]) => new Promise(r => { const i = new Image(); i.onload = () => { IM[n] = i; r(); }; i.onerror = () => { console.error('missing ' + src); r(); }; i.src = src; })));
  const loadFonts = () => {
    const jp = LL.map(l => l.jp).join('') + 'ウツラナイキコエナイワカラナイトマラナイ（）無音秒３．７', cn = LL.map(l => l.cn).join('');
    const jobs = [['800 80px "Shippori Mincho B1"', jp], ['600 80px "Shippori Mincho B1"', jp], ['400 80px "Dela Gothic One"', jp],
      ['700 80px "Noto Serif SC"', cn], ['300 40px "Noto Sans JP"', 'MIRROR ヒトリエ「」─'], ['600 80px "Klee One"', jp + 'MIRROR─ヒトリエ0123456789'],
      ['400 80px "Yusei Magic"', jp], ['400 80px "Long Cang"', cn]];
    return Promise.all(jobs.map(([f, s]) => document.fonts.load(f, s).catch(() => null)));
  };

  // ---------- textures ----------
  const rngOf = seed => { let s = seed; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; };
  const G = document.createElement('canvas'); G.width = G.height = 256;
  { const g = G.getContext('2d'), d = g.createImageData(256, 256), r = rngOf(12345);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
  const PAPER = document.createElement('canvas'); PAPER.width = PAPER.height = 1024;
  { const g = PAPER.getContext('2d'), r = rngOf(777); g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 9000; i++) { g.strokeStyle = `rgba(${80 + r() * 60},${70 + r() * 50},${60 + r() * 40},${0.03 + r() * 0.06})`; g.lineWidth = .5 + r() * 1.1; g.beginPath(); const x = r() * 1024, y = r() * 1024, a = r() * 6.28, l = 4 + r() * 22; g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + r() * 4, y + Math.sin(a) * l * .5 + r() * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } }
  // pencil fill: colour with paper-tooth gaps and directional strokes, one texel = one 4K pixel
  function pencilPattern(rgb, seed) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), r = rngOf(seed);
    g.fillStyle = css(rgb, .82); g.fillRect(0, 0, 256, 256);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 1400; i++) { g.strokeStyle = `rgba(0,0,0,${.08 + r() * .35})`; g.lineWidth = .4 + r() * 1.1; const x = r() * 256, y = r() * 256, l = 3 + r() * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * .55, y - l); g.stroke(); }
    const d = g.getImageData(0, 0, 256, 256), a = d.data;
    for (let i = 3; i < a.length; i += 4) if (r() > .93) a[i] *= .35;
    g.putImageData(d, 0, 0);
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 260; i++) { g.strokeStyle = css(rgb.map(v => v * .7), .25 + r() * .3); g.lineWidth = .5 + r() * .8; const x = r() * 256, y = r() * 256, l = 4 + r() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * .55, y - l); g.stroke(); }
    const p = ctx.createPattern(c, 'repeat'); p.setTransform(new DOMMatrix([1 / S, 0, 0, 1 / S, 0, 0])); return p;
  }
  const PEN = { graphite: pencilPattern([52, 50, 58], 3), red: pencilPattern([200, 46, 40], 5), blue: pencilPattern([70, 96, 170], 7) };
  const PAPERPAT = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = SHEET_PAPER; g.fillRect(0, 0, 512, 512); g.globalCompositeOperation = 'multiply'; g.drawImage(PAPER, 0, 0, 512, 512); const p = ctx.createPattern(c, 'repeat'); p.setTransform(new DOMMatrix([1 / S, 0, 0, 1 / S, 0, 0])); return p; })();

  // ---------- draw helpers ----------
  let BT = 0, JOLT = [0, 0];
  function cover(c, im, z = 1, px = .5, py = .5, rot = 0, dx = 0, dy = 0) {
    if (!im) return; const s = Math.max(W / im.width, H / im.height) * z, dw = im.width * s, dh = im.height * s;
    c.save(); c.translate(W / 2 + dx, H / 2 + dy); if (rot) c.rotate(rot);
    c.drawImage(im, -W / 2 + (W - dw) * px, -H / 2 + (H - dh) * py, dw, dh); c.restore();
  }
  function tile(c, tex, ox, oy, alpha, op, scale = 1) {
    const s = scale / S; c.save(); c.globalAlpha = alpha; c.globalCompositeOperation = op; const p = c.createPattern(tex, 'repeat');
    c.translate(-(ox % (tex.width * s)) - tex.width * s, -(oy % (tex.height * s)) - tex.height * s); c.scale(s, s);
    c.fillStyle = p; c.fillRect(0, 0, W / s + tex.width * 3, H / s + tex.height * 3); c.restore();
  }
  const SMALLK = 'ゃゅょっぁぃぅぇぉャュョッァィゥェォ';
  // shared glyph layout for horizontal / vertical text; per glyph pop-in, optional write-on, jitter, halo
  function glyphs(c, str, x, y, size, font, fill, o, vertical) {
    o = Object.assign({ n: str.length, times: null, t: 0, align: 'left', pop: .2, popK: .4, shadow: null, stroke: null, strokeOnly: false, alpha: 1, track: 0, step: 1.06, mirror: false, scramble: 0, drip: null, write: 0, jit: 0, halo: null }, o);
    c.save(); c.font = font.replace('{s}', size); c.textBaseline = 'middle'; c.textAlign = vertical ? 'center' : 'left';
    const chars = [...str]; const ws = chars.map(ch => c.measureText(ch).width);
    let full = vertical ? 0 : ws.reduce((a, b) => a + b + o.track * size, 0);
    let xx = vertical ? x : (o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x), yy = y;
    const f12 = Math.floor(o.t * 12);
    chars.forEach((ch0, i) => {
      let ch = ch0; const w = ws[i];
      const adv = () => { if (vertical) yy += (ch0 === ' ' || ch0 === '　') ? size * .55 : size * o.step; else xx += w + o.track * size; };
      if (vertical && (ch0 === ' ' || ch0 === '　')) { adv(); return; }
      const age = o.times ? o.t - o.times[Math.min(i, o.times.length - 1)] : 9;
      if (i >= o.n || age < 0) { adv(); return; }
      if (o.scramble && age < o.scramble) { const P = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロワン'; ch = P[Math.floor(hash(i * 7 + Math.floor(o.t * 24)) * P.length)]; }
      let dx = 0, dy = 0, rot = 0;
      if (vertical) { if (ch === '、' || ch === '。') { dx = size * .32; dy = -size * .32; } else if (SMALLK.includes(ch)) { dx = size * .1; dy = -size * .08; } else if (ch === 'ー') rot = Math.PI / 2; }
      let a = clamp(age / .05, 0, 1) * o.alpha;
      if (o.drip && o.drip(i) && age > .35) { const k = age - .35; dy += k * k * size * 2.6; a *= clamp(1 - k / 1.3, 0, 1); }
      if (o.jit) { dx += (hash(i * 7.1 + f12 * 1.31) - .5) * o.jit; dy += (hash(i * 3.7 + f12 * 2.17) - .5) * o.jit; }
      const k = 1 + (1 - eo(age / o.pop)) * o.popK;
      c.save(); c.globalAlpha = a; c.translate((vertical ? xx : xx + w / 2) + dx, yy + dy); if (rot) c.rotate(rot); c.scale((o.mirror ? -1 : 1) * k, k);
      if (o.write && age < o.write) { const p = eo(age / o.write); c.beginPath(); if (vertical) c.rect(-size * .7, -size * .7, size * 1.4, size * 1.4 * p); else c.rect(-w / 2 - 4, -size * .7, (w + 8) * p, size * 1.4); c.clip(); }
      const ox = vertical ? 0 : -w / 2; c.textAlign = vertical ? 'center' : 'left';
      if (o.halo) { c.lineJoin = 'round'; c.lineWidth = o.halo[1]; c.strokeStyle = o.halo[0]; c.strokeText(ch, ox, 0); }
      if (o.shadow) { c.shadowColor = o.shadow[0]; c.shadowBlur = o.shadow[1] * S; c.shadowOffsetX = (o.shadow[2] || 0) * S; c.shadowOffsetY = (o.shadow[3] || 0) * S; }
      if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.stroke[1]; c.strokeStyle = o.stroke[0]; c.strokeText(ch, ox, 0); c.shadowColor = 'transparent'; }
      if (!o.strokeOnly) { c.fillStyle = typeof fill === 'function' ? fill(ch, i) : fill; c.fillText(ch, ox, 0); }
      c.restore(); adv();
    });
    c.restore(); return full;
  }
  const hText = (c, s, x, y, size, font, fill, o = {}) => glyphs(c, s, x, y, size, font, fill, o, false);
  const vText = (c, s, x, y, size, font, fill, o = {}) => glyphs(c, s, x, y, size, font, fill, o, true);
  const F = { kata: '400 {s}px "Dela Gothic One", sans-serif', min8: '800 {s}px "Shippori Mincho B1", serif', klee: '600 {s}px "Klee One", serif',
    yusei: '400 {s}px "Yusei Magic", sans-serif', cang: '400 {s}px "Long Cang", serif', cn7: '700 {s}px "Noto Serif SC", serif', sans: '300 {s}px "Noto Sans JP", sans-serif' };
  const HALO = ['rgba(232,224,210,.85)', 9];
  const pencilNote = (o = {}) => Object.assign({ write: .14, jit: 1.1, halo: HALO, pop: .12, popK: .12 }, o);

  // ---------- story mode: pencil keyframe sheets ----------
  // [start, end, sheet, z0, z1, px0, px1, py0, py1]
  const SHEETS = [
    [210.0, 213.98, 'g1', 1.04, 1.12, .5, .46, .5, .5],
    [213.98, 218.17, 'g2', 1.05, 1.14, .55, .5, .5, .46],
    [218.17, 222.14, 'g3', 1.02, 1.10, .5, .5, .45, .5],
    [222.14, 223.58, 'g4', 1.18, 1.18, .15, .85, .5, .5],
    [223.58, SIL, 'g5', 1.02, 1.10, .5, .52, .5, .45],
    [SIL, SHATTER, 'blank', 1.0, 1.0, .5, .5, .5, .5]];
  const sheetAt = t => { for (let i = 0; i < SHEETS.length; i++) if (t < SHEETS[i][1] || i === SHEETS.length - 1) return i; };
  function drawSheet(i, t, boil = true) {
    const [a, b, n, z0, z1, px0, px1, py0, py1] = SHEETS[i]; const u = clamp((t - a) / (b - a), 0, 1);
    const ease = n === 'g4' ? eo : eio;
    const z = mix(z0, z1, ease(u)) * (1 + .01 * kickP(t)), px = mix(px0, px1, ease(u)), py = mix(py0, py1, ease(u));
    const f = Math.floor(t * 12), rx = (hash(f * 1.7) - .5) * .9, ry = (hash(f * 2.3) - .5) * .9, rr = (hash(f * 3.1) - .5) * .0012;
    if (n === 'g4') { for (let k = 3; k >= 0; k--) { ctx.globalAlpha = k ? .2 : 1; cover(ctx, IM.g4, z, px - k * .012, py); } ctx.globalAlpha = 1; return; }
    cover(ctx, IM[n], z, px, py, rr, rx + JOLT[0], ry + JOLT[1]);
    if (boil && n !== 'blank') { ctx.save(); ctx.globalCompositeOperation = 'darken'; ctx.globalAlpha = .45; cover(ctx, IM[n], z, px, py, -rr, rx + (hash(f * 4.9) - .5) * 2.4, ry + (hash(f * 5.3) - .5) * 2.4); ctx.restore(); }
  }
  function lightTable(k) { if (k <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * .7); g.addColorStop(0, `rgba(255,214,150,${.32 * k})`); g.addColorStop(1, `rgba(255,190,120,${.08 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function storyBase(t) {
    const i = sheetAt(t);
    drawSheet(i, t);
    // the next drawing shows through the paper as the light table comes up, then the top sheet flips away
    const end = SHEETS[i][1], next = SHEETS[i + 1];
    if (next && t > end - .42) {
      const k = sm(end - .42, end, t); lightTable(k);
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .3 * k; cover(ctx, IM[next[2]], next[3], next[5], next[7], .004, 9, 7); ctx.restore();
    }
    const prev = SHEETS[i - 1];
    if (prev && t < SHEETS[i][0] + .2) {
      const k = (t - SHEETS[i][0]) / .2, th = eo(k) * Math.PI / 2, sy = Math.cos(th);
      lightTable(1 - k);
      if (sy > .02) {
        ctx.save(); ctx.fillStyle = `rgba(0,0,0,${.35 * (1 - k)})`; ctx.fillRect(0, 0, W, H * sy + 40); ctx.restore();
        ctx.save(); ctx.translate(0, 0); ctx.scale(1, sy); drawSheet(i - 1, SHEETS[i][0] - .001, false);
        ctx.fillStyle = `rgba(30,25,20,${.35 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      }
    }
  }
  const pen = (name) => PEN[name];
  function storyText(t) {
    if (t < 213.98) {
      const parts = K1.jp.split('　'), n0 = parts[0].length;
      vText(ctx, parts[0], W * .86, 160, 150, F.yusei, pen('red'), pencilNote({ times: K1.ct.slice(0, n0), t, jit: 1.6 }));
      const t2 = K1.ct[n0 + 1];
      if (t >= t2 - .05) { // the second one is written mirror-wise and erased again
        const fl = t < t2 + .9 ? (hash(Math.floor(t * 20)) > .45 ? .6 : .18) : clamp(1 - (t - t2 - .9) / .35, 0, 1) * .18;
        vText(ctx, parts[1], W * .71, 160, 150, F.yusei, pen('graphite'), { times: K1.ct.slice(n0 + 1), t, mirror: true, alpha: fl, strokeOnly: true, stroke: [pen('graphite'), 3], jit: 2 });
      }
      vText(ctx, N1.jp, W * .085, 120, 48, F.klee, pen('graphite'), pencilNote({ times: N1.ct, t }));
    } else if (t < 218.17) {
      vText(ctx, K2.jp.split('　')[0], W * .955, 150, 140, F.yusei, pen('red'), { times: K2.ct.slice(0, 5), t, strokeOnly: true, stroke: [pen('red'), 6], write: .14, jit: 1.6, pop: .12, popK: .12 });
      vText(ctx, K2.jp.split('　')[1], W * .875, 210, 140, F.yusei, pen('red'), { times: K2.ct.slice(6), t, strokeOnly: true, stroke: [pen('red'), 4], alpha: .7, write: .14, jit: 1.6, pop: .12, popK: .12 });
      const k = clamp((t - K2.ct[0]) / 1.4, 0, 1); ctx.save(); ctx.strokeStyle = pen('red'); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      const f = Math.floor(t * 12);
      for (let x = 0; x <= W; x += 6) { const amp = (1 - k) * 70 * Math.sin(x * .045 + t * 28) * Math.sin(x * .009 + 1) + (hash(x * .3 + f) - .5) * 2; x ? ctx.lineTo(x, H * .5 + amp) : ctx.moveTo(x, H * .5 + amp); }
      ctx.stroke(); ctx.restore();
      const drip = N2.jp.indexOf('こぼれ');
      vText(ctx, N2.jp, W * .06, 110, 48, F.klee, pen('graphite'), pencilNote({ times: N2.ct, t, drip: i => i >= drip }));
    } else if (t < 222.14) {
      const parts = K3.jp.split('　');
      vText(ctx, parts[0], W * .055, 150, 140, F.yusei, pen('red'), pencilNote({ times: K3.ct.slice(0, 5), t, scramble: .5, jit: 1.6 }));
      vText(ctx, parts[1], W * .14, 210, 140, F.yusei, pen('red'), pencilNote({ times: K3.ct.slice(6), t, scramble: .5, jit: 1.6 }));
      vText(ctx, N3.jp, W * .9, 120, 50, F.klee, pen('graphite'), pencilNote({ times: N3.ct, t, mirror: true }));
    } else if (t < 223.58) {
      const u = (t - 222.14) / (223.58 - 222.14);
      ctx.save(); ctx.strokeStyle = pen('graphite'); const f = Math.floor(t * 12);
      for (let i = 0; i < 34; i++) { const y = hash(f * 3 + i) * H, len = 200 + hash(f + i * 3) * 600, x = (hash(f * 7 + i * 5) * 1.4 - .2) * W; ctx.lineWidth = 1.5 + hash(i) * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + (hash(i * 9) - .5) * 6); ctx.stroke(); }
      ctx.restore();
      const v = 900 + 2600 * u; ctx.save(); ctx.font = F.yusei.replace('{s}', 170); ctx.textBaseline = 'middle';
      const word = 'トマラナイ　'; const ww = ctx.measureText(word).width;
      for (const [row, dir, p] of [[H * .3, 1, pen('red')], [H * .72, -1, pen('graphite')]]) {
        let x = ((dir > 0 ? -1 : 1) * ((t - 222.14) * v) % ww) - ww;
        for (; x < W + ww; x += ww) { ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = HALO[0]; ctx.strokeText(word, x, row); ctx.fillStyle = p; ctx.fillText(word, x, row); }
      }
      ctx.restore();
    } else if (t < SIL) {
      const iS = N4.jp.indexOf('さよなら');
      vText(ctx, N4.jp.slice(0, iS).trim(), W * .9, 140, 50, F.klee, pen('graphite'), pencilNote({ times: N4.ct, t }));
      hText(ctx, 'さよなら', W * .5, H * .79, 118, F.klee, pen('graphite'), pencilNote({ times: N4.ct.slice(iS), t, align: 'center', track: .35, write: .25 }));
    }
    // translation as a red-pencil note
    const l = lineAt(t);
    if (l && l.cn && t < SIL) {
      const a = clamp((t - l.ct[0] + .1) / .25, 0, 1) * (1 - sm(l.t1 - .25, l.t1, t));
      if (a > 0) hText(ctx, l.cn, W / 2, H - 66, 42, F.cang, pen('red'), { align: 'center', alpha: a, halo: HALO, jit: .8, t });
    }
    hText(ctx, 'MIRROR ── ヒトリエ', 56, 54, 26, F.klee, pen('graphite'), { t, jit: .6 });
  }

  // ---------- the silence: blank sheet, pencil cracks ----------
  const crackSegs = [];
  (() => {
    const cx = W * .5, cy = H * .5; let seed = 3; const r = () => hash(seed++ * 1.37);
    function branch(x, y, ang, s0, depth, len) {
      let s = s0;
      for (let k = 0; k < len; k++) {
        const l = 26 + r() * 46; const nx = x + Math.cos(ang) * l, ny = y + Math.sin(ang) * l;
        crackSegs.push({ x1: x, y1: y, x2: nx, y2: ny, s, w: Math.max(1.4, 3.6 - depth * 1.1 - k * .05) });
        s += l; x = nx; y = ny; ang += (r() - .5) * .5;
        if (depth < 2 && r() < .16) branch(x, y, ang + (r() < .5 ? -1 : 1) * (.5 + r() * .7), s, depth + 1, 6 + Math.floor(r() * 10));
        if (x < -50 || x > W + 50 || y < -50 || y > H + 50) break;
      }
    }
    for (let i = 0; i < 15; i++) branch(cx, cy, i / 15 * Math.PI * 2 + r() * .3, 0, 0, 40);
  })();
  function silence(t) {
    const p = ei(sm(228.1, 229.94, t)) + (t > 228.1 ? .02 : 0);
    if (t > 228.1) {
      ctx.save(); ctx.strokeStyle = pen('graphite'); ctx.lineCap = 'round';
      for (const pass of [0, 1]) for (const g of crackSegs) {
        const lim = p * 1300; if (g.s > lim) continue; const f = clamp((lim - g.s) / 50, 0, 1);
        const j = pass ? 1.6 : 0; ctx.lineWidth = g.w * (pass ? .7 : 1.15);
        ctx.beginPath(); ctx.moveTo(g.x1 + j, g.y1 - j); ctx.lineTo(mix(g.x1, g.x2, f) + j, mix(g.y1, g.y2, f) - j); ctx.stroke();
      }
      ctx.restore();
    }
    const a = 1 - sm(229.0, 229.6, t);
    vText(ctx, '無音', W * .9, 300, 64, F.klee, pen('red'), pencilNote({ times: [226.9, 227.15], t, alpha: a, halo: null }));
    vText(ctx, '三・七秒', W * .9 - 80, 330, 40, F.klee, pen('red'), pencilNote({ times: [227.5, 227.62, 227.74, 227.86], t, alpha: a, halo: null }));
    if (t > 227.3) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = pen('red'); ctx.lineWidth = 4; ctx.beginPath(); const k = eo((t - 227.3) / .4); ctx.moveTo(W * .9 + 50, 270); ctx.lineTo(W * .9 + 50, 270 + 300 * k); ctx.stroke(); ctx.restore(); }
  }

  // ---------- riso printing ----------
  function misreg(t) {
    const out = {}; const kk = hitIdx(DRUMS.kick, t), sk = hitIdx(DRUMS.snare, t);
    const bar = Math.exp(-fract((t - 10) / 2) * 2 * 8); const shat = t >= SHATTER ? Math.exp(-(t - SHATTER) * 4) : 0;
    const base = { blue: [.8, -.6], mint: [-1, 1], pink: [1.2, .9], black: [0, 0] };
    PLATES.forEach((k, i) => {
      const a1 = hash(kk * 13.1 + i * 5.7) * 6.283, a2 = hash(sk * 7.3 + i * 3.1) * 6.283, a3 = hash(i * 9.1 + Math.floor((t - 10) / 2)) * 6.283;
      const mk = k === 'black' ? .45 : 1;
      out[k] = [base[k][0] + mk * (Math.cos(a1) * 7 * kickP(t, 10) + Math.cos(a2) * 4 * snareP(t, 12) + Math.cos(a3) * 11 * bar + Math.cos(a1 + 1) * 34 * shat),
        base[k][1] + mk * (Math.sin(a1) * 7 * kickP(t, 10) + Math.sin(a2) * 4 * snareP(t, 12) + Math.sin(a3) * 11 * bar + Math.sin(a1 + 1) * 34 * shat)];
    });
    return out;
  }
  // regions: [{x0,x1,swap}] in logical x; knock(c) draws knockout shapes (logical coords, already offset per plate)
  function print(shot, cam, t, opt = {}) {
    const M = misreg(t);
    ctx.save(); ctx.fillStyle = RISO_PAPER; ctx.fillRect(0, 0, W, H); ctx.restore();
    for (const k of PLATES) {
      const im = IM[shot + '_' + k]; if (!im) continue;
      off.setTransform(1, 0, 0, 1, 0, 0); off.globalCompositeOperation = 'source-over'; off.globalAlpha = 1; off.clearRect(0, 0, DW, DH);
      off.setTransform(S, 0, 0, S, M[k][0] * S, M[k][1] * S);
      cover(off, im, cam.z, cam.px, cam.py, cam.rot || 0, cam.dx || 0, cam.dy || 0);
      if (opt.knock) { off.globalCompositeOperation = 'destination-out'; opt.knock(off, k); }
      if (opt.regions) for (const r of opt.regions) if (r.swap && SWAP[k] !== k) {
        off.save(); off.globalCompositeOperation = 'source-in'; off.beginPath(); off.rect(r.x0 - M[k][0], -50, r.x1 - r.x0, H + 100); off.clip();
        off.fillStyle = css(INK[SWAP[k]]); off.fillRect(-100, -100, W + 200, H + 200); off.restore();
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(OFF, 0, 0); ctx.restore();
    }
    return M;
  }
  // overprinted ink (multiply) at a plate's registration
  function inkLayer(M, k, fn) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.translate(M[k][0], M[k][1]); fn(css(INK[k])); ctx.restore(); }
  const chorusWord = (line, k) => ({ times: line.ct.slice(k * 6, k * 6 + 6), started: line.ct[k * 6] });
  const giantOpt = (w, t, extra = {}) => Object.assign({ times: w.times, t, pop: .14 }, extra);
  // giant word: knocked out of every plate, then an offset overprint in the accent ink
  function giantKnock(line, k, t, x, y, size, o = {}) { const w = chorusWord(line, k); if (t < w.started - .05) return () => {}; return c => hText(c, '泣いてるのに', x, y, size, F.kata, '#000', giantOpt(w, t, o)); }
  function giantInk(M, line, k, t, x, y, size, accent, o = {}) {
    const w = chorusWord(line, k); if (t < w.started - .05) return;
    inkLayer(M, accent, col => hText(ctx, '泣いてるのに', x + 7, y + 7, size, F.kata, (ch) => ch === '泣' ? col : css(INK[accent], .55), giantOpt(w, t, o)));
  }
  function subtitleStrip(t) {
    const l = lineAt(t); if (!l || !l.cn) return null;
    const a = clamp((t - l.ct[0] + .1) / .25, 0, 1) * (1 - sm(l.t1 - .25, l.t1, t)); if (a <= 0) return null;
    ctx.save(); ctx.font = F.cn7.replace('{s}', 36); const w = ctx.measureText(l.cn).width; ctx.restore();
    return { l, a, w, knock: c => { c.save(); c.globalAlpha = a; c.translate(W / 2, H - 68); c.rotate(-.006); c.fillRect(-w / 2 - 26, -30, w + 52, 60); c.restore(); } };
  }
  function subtitleInk(M, s) {
    if (!s) return; inkLayer(M, 'black', col => { ctx.globalAlpha = s.a; ctx.translate(W / 2, H - 68); ctx.rotate(-.006); ctx.font = F.cn7.replace('{s}', 36); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s.l.cn, 0, 2); });
  }
  const camZ = (t, base = 1) => base * (1 + .028 * kickP(t, 10));
  function chorus(t) {
    const sub = subtitleStrip(t); const knocks = [];
    const both = c => { for (const f of knocks) f(c); if (sub) sub.knock(c); c.save(); c.font = F.sans.replace('{s}', 24); c.textBaseline = 'middle'; c.fillText('ヒトリエ「MIRROR」', 56, 52); c.restore(); };
    let M, cam, shot, regions = null, after = null;
    if (t < 231.95) {
      const e = t - SHATTER; shot = 'c1'; cam = { z: mix(1.35, 1.0, eo(e / .7)) * camZ(t), px: .5, py: .5, rot: (1 - eo(e / .7)) * -.04 };
      knocks.push(giantKnock(CA, 0, t, 70, 140, 170)); after = M => giantInk(M, CA, 0, t, 70, 140, 170, 'pink');
    } else if (t < 233.95) {
      shot = 'c2'; cam = { z: camZ(t, 1.02), px: .5, py: .5 };
      knocks.push(giantKnock(CA, 1, t, W / 2, H * .8, 140, { align: 'center' })); after = M => giantInk(M, CA, 1, t, W / 2, H * .8, 140, 'pink', { align: 'center' });
      if (snareP(t, 14) > .35 && Math.floor(beatF(t)) % 2 === 1) regions = [{ x0: W / 2, x1: W, swap: true }];
    } else if (t < 235.95) {
      shot = 'c3'; cam = { z: camZ(t, mix(1.0, 1.06, (t - 233.95) / 2)), px: .5, py: .5 };
      knocks.push(giantKnock(CA, 0, 999, 70, 120, 150, { alpha: .3 }), giantKnock(CA, 1, 999, 70, 290, 150, { alpha: .55 }), giantKnock(CA, 2, t, 70, 460, 150));
      after = M => { giantInk(M, CA, 2, t, 70, 460, 150, 'mint'); };
    } else if (t < 237.9) {
      shot = 'c2e'; cam = { z: camZ(t, 1.02), px: .5, py: .5 };
      const i0 = CA.jp.indexOf('君'); knocks.push(c => vText(c, CA.jp.slice(i0), W * .75, 150, 108, F.min8, '#000', { times: CA.ct.slice(i0), t, pop: .25 }));
      after = M => inkLayer(M, 'mint', col => vText(ctx, CA.jp.slice(i0), W * .75 + 6, 156, 108, F.min8, css(INK.mint, .5), { times: CA.ct.slice(i0), t, pop: .25 }));
    } else if (t < 240.0) {
      shot = 'c3'; cam = { z: camZ(t, 1.08), px: .55, py: .45 };
      knocks.push(giantKnock(CB, 0, t, 60, H * .79, 180)); after = M => giantInk(M, CB, 0, t, 60, H * .79, 180, 'mint');
      // on the downbeats the reflection flashes into the original's colours
      if (Math.floor(beatF(t)) % 2 === 0 && fract(beatF(t)) < .22) regions = [{ x0: 0, x1: W, swap: true }];
    } else if (t < 242.0) {
      const u = (t - 240) / 2; shot = 'c4'; cam = { z: camZ(t, mix(1.12, 1.02, eo(u))), px: .5, py: .5, rot: mix(.05, 0, eo(u)) };
      knocks.push(giantKnock(CB, 1, t, W * .5, H * .15, 132, { align: 'center' })); after = M => giantInk(M, CB, 1, t, W * .5, H * .15, 132, 'pink', { align: 'center' });
    } else if (t < 244.0) {
      shot = 'c2'; cam = { z: camZ(t, 1.02), px: .5, py: .5 };
      knocks.push(giantKnock(CB, 2, t, W / 2, H * .8, 140, { align: 'center' })); after = M => giantInk(M, CB, 2, t, W / 2, H * .8, 140, 'pink', { align: 'center' });
      const b = Math.floor(beatF(t)); regions = [{ x0: b % 2 ? W / 2 : 0, x1: b % 2 ? W : W / 2, swap: true }];
    } else {
      const u = (t - 244) / 2; shot = 'c5'; cam = { z: mix(1.0, 1.08, u) * (1 + .015 * kickP(t)), px: .5, py: .5 };
      const i0 = CB.jp.indexOf('此処');
      knocks.push(c => hText(c, CB.jp.slice(i0), W / 2, H * .5, 132, F.min8, '#000', { times: CB.ct.slice(i0), t, align: 'center', pop: .25, track: .08 }));
      after = M => inkLayer(M, 'pink', col => hText(ctx, CB.jp.slice(i0), W / 2 + 7, H * .5 + 7, 132, F.min8, css(INK.pink, .55), { times: CB.ct.slice(i0), t, align: 'center', pop: .25, track: .08 }));
    }
    M = print(shot, cam, t, { knock: both, regions });
    if (after) after(M);
    subtitleInk(M, sub);
  }

  // ---------- paper shatter into the print ----------
  const tris = [];
  (() => {
    const nx = 16, ny = 9, pts = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const e = i === 0 || j === 0 || i === nx || j === ny; pts.push([i / nx * W + (e ? 0 : (hash(i * 31 + j * 7) - .5) * W / nx * .8), j / ny * H + (e ? 0 : (hash(i * 17 + j * 13) - .5) * H / ny * .8)]); }
    const P = (i, j) => pts[j * (nx + 1) + i];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      for (const q of ((i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]])) { const cx = (q[0][0] + q[1][0] + q[2][0]) / 3, cy = (q[0][1] + q[1][1] + q[2][1]) / 3; tris.push({ q, cx, cy, h: hash(cx * .13 + cy * .71) }); }
    }
  })();
  function shatter(e) {
    const ox = W * .5, oy = H * .5;
    for (const tr of tris) {
      const dx = tr.cx - ox, dy = tr.cy - oy, dist = Math.hypot(dx, dy) + 1; const k = Math.max(0, e - dist / 2600);
      const sp = 900 + tr.h * 1500, mx = dx / dist * sp * k * (1 + k), my = dy / dist * sp * k * (1 + k) + 600 * k * k, a = clamp(1 - k / .7, 0, 1); if (a <= 0) continue;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(tr.cx + mx, tr.cy + my); ctx.rotate((tr.h - .5) * 9 * k); ctx.scale(1 - k * .5, 1 - k * .5);
      ctx.beginPath(); ctx.moveTo(tr.q[0][0] - tr.cx, tr.q[0][1] - tr.cy); ctx.lineTo(tr.q[1][0] - tr.cx, tr.q[1][1] - tr.cy); ctx.lineTo(tr.q[2][0] - tr.cx, tr.q[2][1] - tr.cy); ctx.closePath();
      ctx.fillStyle = PAPERPAT; ctx.fill(); ctx.strokeStyle = pen('graphite'); ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore();
    }
  }

  // ---------- post ----------
  function snapshot() { t1.setTransform(1, 0, 0, 1, 0, 0); t1.globalCompositeOperation = 'source-over'; t1.globalAlpha = 1; t1.clearRect(0, 0, DW, DH); t1.drawImage(cv, 0, 0); }
  function glitch(amount, seed) {
    if (amount <= 0) return; snapshot(); const n = 5 + Math.floor(amount * 8);
    for (let k = 0; k < n; k++) { const y = hash(seed * 13 + k) * H, h = 6 + hash(seed * 7 + k * 3) * 60 * amount, dx = (hash(seed * 3 + k * 11) - .5) * 120 * amount; ctx.drawImage(T1, 0, y * S, DW, h * S, dx, y, W, h); }
  }
  function flash(alpha, color = '255,255,255', op = 'source-over') { if (alpha <= 0) return; ctx.save(); ctx.globalCompositeOperation = op; ctx.fillStyle = `rgba(${color},${clamp(alpha, 0, 1)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function vignette(k) { const g = ctx.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, W * .66); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(20,14,8,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

  function render(t) {
    ctx.save(); ctx.setTransform(S, 0, 0, S, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; BT = t;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < SHATTER) {
      JOLT = [0, 0]; for (const l of [K1, N1, K2, N2, K3, N3, K4, N4]) { const d = t - l.ct[0]; if (d >= 0 && d < .1) { const k = 1 - d / .1; JOLT = [(hash(l.t0 * 3.1) - .5) * 16 * k, (hash(l.t0 * 7.7) - .5) * 12 * k]; } }
      storyBase(t);
      if (t < SIL) storyText(t);
      else silence(t);
      tile(ctx, G, hash(Math.floor(t * 24)) * 256, hash(Math.floor(t * 24) + 7) * 256, .06, 'overlay');
      vignette(t < SIL ? .28 : .18);
    } else {
      chorus(t);
      tile(ctx, PAPER, 0, 0, .5, 'multiply', 1);
      tile(ctx, G, hash(Math.floor(t * 24)) * 256, hash(Math.floor(t * 24) + 7) * 256, .05, 'overlay');
      if (t > 231.9 && Math.abs(t - Math.round((t - 10) / 2) * 2 - 10) < .04) glitch(.6, Math.floor(t * 30));
      if (t < SHATTER + 1.2) shatter(t - SHATTER);
      const e = t - SHATTER; flash(e < .1 ? .85 * (1 - e / .1) : 0, '255,72,176', 'multiply'); flash(Math.exp(-e * 22) * .6);
    }
    if (t < 210.35) flash(1 - (t - 210.0) / .35, '0,0,0');
    if (t > 245.0) flash((t - 245.0) / 1.0, '0,0,0');
    ctx.restore();
  }
  window.render = render;
  window.ready = Promise.all([loadArt(), loadFonts()]).then(() => true);
})();
