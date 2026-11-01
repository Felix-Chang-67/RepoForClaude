// MIRROR sample clip (song time 210.0–246.0): deterministic canvas renderer.
// window.render(t) draws the frame for song time t. Story shots are monochrome + pink,
// the final chorus is flat colour with giant lyrics. Effects follow the real drum hits.
(() => {
  const W = 1920, H = 1080;
  const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const T1 = mk(), t1 = T1.getContext('2d');

  // ---------- utils ----------
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), mix = (a, b, t) => a + (b - a) * t, fract = x => x - Math.floor(x);
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const eo = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3), ei = t => Math.pow(clamp(t, 0, 1), 3);
  const eio = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const beatF = t => (t - 10) / 0.5;
  const SHATTER = 229.98, SIL = 226.30;

  // ---------- lyrics ----------
  const LL = LYRICS;
  const find = (p, near) => { let b = null; for (const l of LL) if (l.jp.startsWith(p) && (!b || Math.abs(l.t0 - near) < Math.abs(b.t0 - near))) b = l; return b; };
  const shown = (l, t, lead = .03) => { let n = 0; for (let i = 0; i < l.ct.length; i++) if (l.ct[i] - lead <= t) n = i + 1; return n; };
  const K1 = find('ウツラナイ', 210), N1 = find('言葉なんて', 211), K2 = find('キコエナイ', 214), N2 = find('なぜだろう', 215),
    K3 = find('ワカラナイ', 218), N3 = find('映り込んだ', 219), K4 = find('トマラナイ', 222), N4 = find('弱虫の', 223),
    CA = find('泣いてるのに', 230.2), CB = find('泣いてるのに', 237.9);
  const lineAt = t => { let cur = null; for (const l of LL) { const s = Math.min(l.t0, l.ct[0]) - .1; if (t >= s && t < l.t1 - .02) cur = l; } return cur; };

  // ---------- drums ----------
  const lastHit = (arr, t) => { let h = -1e9; for (const x of arr) { if (x <= t + 1e-4) h = x; else break; } return h; };
  const kickP = (t, k = 9) => Math.exp(-(t - lastHit(DRUMS.kick, t)) * k);
  const snareP = (t, k = 12) => Math.exp(-(t - lastHit(DRUMS.snare, t)) * k);
  const beatP = (t, k = 7) => Math.exp(-fract(beatF(t)) * 0.5 * k);

  // ---------- assets ----------
  const IM = {};
  const ART = ['m1', 'm2', 'm3', 'm4', 'm5', 'c1', 'c2', 'c2e', 'c3', 'c4', 'c5', 'c5g'];
  const loadArt = () => Promise.all(ART.map(n => new Promise(r => { const i = new Image(); i.onload = () => { IM[n] = i; r(); }; i.onerror = () => r(); i.src = 'art/' + n + '.png'; })));
  const loadFonts = () => {
    const jp = LL.map(l => l.jp).join('') + 'ウツラナイキコエナイワカラナイトマラナイ（）', cn = LL.map(l => l.cn).join('');
    const jobs = [['800 80px "Shippori Mincho B1"', jp], ['600 80px "Shippori Mincho B1"', jp], ['500 80px "Shippori Mincho B1"', jp],
      ['400 80px "Dela Gothic One"', jp], ['900 80px "Noto Serif SC"', cn], ['700 80px "Noto Serif SC"', cn], ['500 80px "Noto Serif SC"', cn],
      ['300 40px "Noto Sans JP"', 'MIRROR ヒトリエ 0123456789:.—「」'], ['400 40px "Noto Sans JP"', 'MIRROR ヒトリエ「」']];
    return Promise.all(jobs.map(([f, s]) => document.fonts.load(f, s).catch(() => null)));
  };
  const G = document.createElement('canvas'); G.width = G.height = 256;
  { const g = G.getContext('2d'), d = g.createImageData(256, 256); let s = 12345; const r = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 110; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
  const HT = document.createElement('canvas'); HT.width = HT.height = 12; { const g = HT.getContext('2d'); g.fillStyle = '#000'; g.beginPath(); g.arc(6, 6, 2.2, 0, 6.283); g.fill(); }

  // ---------- drawing helpers ----------
  function cover(c, im, z = 1, px = .5, py = .5, rot = 0, dx = 0, dy = 0) {
    if (!im) return; const s = Math.max(W / im.width, H / im.height) * z, dw = im.width * s, dh = im.height * s;
    c.save(); c.translate(W / 2 + dx, H / 2 + dy); if (rot) c.rotate(rot);
    c.drawImage(im, -W / 2 + (W - dw) * px, -H / 2 + (H - dh) * py, dw, dh); c.restore();
  }
  function tile(c, tex, ox, oy, alpha, op, scale = 1, rect = null) {
    c.save(); if (rect) { c.beginPath(); c.rect(...rect); c.clip(); }
    c.globalAlpha = alpha; c.globalCompositeOperation = op; const p = c.createPattern(tex, 'repeat');
    c.translate(-(ox % (tex.width * scale)) - tex.width * scale, -(oy % (tex.height * scale)) - tex.height * scale); c.scale(scale, scale);
    c.fillStyle = p; c.fillRect(0, 0, W / scale + tex.width * 3, H / scale + tex.height * 3); c.restore();
  }
  const SMALLK = 'ゃゅょっぁぃぅぇぉャュョッァィゥェォ';
  // horizontal text, every glyph pops in at its sung time
  function hText(c, str, x, y, size, font, color, opt = {}) {
    const o = Object.assign({ n: str.length, times: null, t: 0, align: 'left', pop: .2, shadow: null, stroke: null, alpha: 1, track: 0, strokeOnly: false }, opt);
    c.save(); c.font = font.replace('{s}', size); c.textBaseline = 'middle'; c.textAlign = 'left';
    const ws = [...str].map(ch => c.measureText(ch).width); const full = ws.reduce((a, b) => a + b + o.track * size, 0);
    let xx = o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x;
    [...str].forEach((ch, i) => {
      const w = ws[i]; const age = o.times ? o.t - o.times[Math.min(i, o.times.length - 1)] : 9;
      if (i < o.n && age >= 0) {
        const a = clamp(age / .05, 0, 1) * o.alpha, k = 1 + (1 - eo(age / o.pop)) * .4;
        c.save(); c.globalAlpha = a; c.translate(xx + w / 2, y); c.scale(k, k);
        if (o.shadow) { c.shadowColor = o.shadow[0]; c.shadowBlur = o.shadow[1]; c.shadowOffsetX = o.shadow[2] || 0; c.shadowOffsetY = o.shadow[3] || 0; }
        if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.stroke[1]; c.strokeStyle = o.stroke[0]; c.strokeText(ch, -w / 2, 0); c.shadowColor = 'transparent'; }
        if (!o.strokeOnly) { c.fillStyle = typeof color === 'function' ? color(ch, i) : color; c.fillText(ch, -w / 2, 0); }
        c.restore();
      }
      xx += w + o.track * size;
    });
    c.restore(); return full;
  }
  function vText(c, str, x, y, size, font, color, opt = {}) {
    const o = Object.assign({ n: str.length, times: null, t: 0, step: 1.06, pop: .2, shadow: null, stroke: null, alpha: 1, mirror: false, scramble: 0, drip: null, strokeOnly: false }, opt);
    c.save(); c.font = font.replace('{s}', size); c.textBaseline = 'middle'; c.textAlign = 'center';
    let yy = y;
    [...str].forEach((ch0, i) => {
      let ch = ch0;
      if (ch === ' ' || ch === '　') { yy += size * .55; return; }
      const age = o.times ? o.t - o.times[Math.min(i, o.times.length - 1)] : 9;
      if (i >= o.n || age < 0) { yy += size * o.step; return; }
      if (o.scramble && age < o.scramble) { const P = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロワン'; ch = P[Math.floor(hash(i * 7 + Math.floor(o.t * 24)) * P.length)]; }
      let dx = 0, dy = 0, rot = 0;
      if (ch === '、' || ch === '。') { dx = size * .32; dy = -size * .32; } else if (SMALLK.includes(ch)) { dx = size * .1; dy = -size * .08; } else if (ch === 'ー') rot = Math.PI / 2;
      let a = clamp(age / .05, 0, 1) * o.alpha;
      if (o.drip && o.drip(i) && age > .35) { const k = age - .35; dy += k * k * size * 2.6; a *= clamp(1 - k / 1.3, 0, 1); }
      const k = 1 + (1 - eo(age / o.pop)) * .4;
      c.save(); c.globalAlpha = a; c.translate(x + dx, yy + dy); if (rot) c.rotate(rot); c.scale((o.mirror ? -1 : 1) * k, k);
      if (o.shadow) { c.shadowColor = o.shadow[0]; c.shadowBlur = o.shadow[1]; c.shadowOffsetX = o.shadow[2] || 0; c.shadowOffsetY = o.shadow[3] || 0; }
      if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.stroke[1]; c.strokeStyle = o.stroke[0]; c.strokeText(ch, 0, 0); c.shadowColor = 'transparent'; }
      if (!o.strokeOnly) { c.fillStyle = color; c.fillText(ch, 0, 0); }
      c.restore(); yy += size * o.step;
    });
    c.restore();
  }
  const F = {
    kata: '400 {s}px "Dela Gothic One", sans-serif',
    min8: '800 {s}px "Shippori Mincho B1", serif', min6: '600 {s}px "Shippori Mincho B1", serif',
    cn9: '900 {s}px "Noto Serif SC", serif', cn7: '700 {s}px "Noto Serif SC", serif',
    sans: '300 {s}px "Noto Sans JP", sans-serif'
  };
  const PINK = '#ff5fa2', COBALT = '#1e3fd0';
  const softShadow = ['rgba(0,0,0,.75)', 18, 0, 3];

  // ---------- post effects ----------
  function snapshot() { t1.globalCompositeOperation = 'source-over'; t1.globalAlpha = 1; t1.filter = 'none'; t1.clearRect(0, 0, W, H); t1.drawImage(cv, 0, 0); }
  function invertRect(x, y, w, h) { snapshot(); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.filter = 'invert(1)'; ctx.drawImage(T1, 0, 0); ctx.restore(); }
  function glitch(amount, seed) {
    if (amount <= 0) return; snapshot();
    const n = 6 + Math.floor(amount * 10);
    for (let k = 0; k < n; k++) { const y = hash(seed * 13 + k) * H, h = 6 + hash(seed * 7 + k * 3) * 70 * amount, dx = (hash(seed * 3 + k * 11) - .5) * 160 * amount; ctx.drawImage(T1, 0, y, W, h, dx, y, W, h); }
  }
  function chroma(d) {
    d = Math.round(d); if (d < 1) return;
    const img = ctx.getImageData(0, 0, W, H), a = img.data, src = new Uint8ClampedArray(a);
    for (let y = 0; y < H; y++) { const row = y * W * 4; for (let x = 0; x < W; x++) { const i = row + x * 4; a[i] = src[row + Math.min(W - 1, x + d) * 4]; a[i + 2] = src[row + Math.max(0, x - d) * 4 + 2]; } }
    ctx.putImageData(img, 0, 0);
  }
  function flash(alpha, color = '255,255,255') { if (alpha <= 0) return; ctx.fillStyle = `rgba(${color},${clamp(alpha, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  function vignette(k = .45) { const g = ctx.createRadialGradient(W / 2, H / 2, H * .38, W / 2, H / 2, W * .64); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function speedLines(k, seed) {
    ctx.save(); ctx.globalAlpha = .5 * k; ctx.strokeStyle = '#fff';
    for (let i = 0; i < 40; i++) { const y = hash(seed + i) * H, len = 200 + hash(seed + i * 3) * 600, x = (hash(seed + i * 5) * 1.4 - .2) * W; ctx.lineWidth = 1 + hash(i) * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- cracks & shards ----------
  const crackSegs = []; // {x1,y1,x2,y2,s,w}
  (() => {
    const cx = W * .5, cy = H * .47; let seed = 3;
    const r = () => hash(seed++ * 1.37);
    function branch(x, y, ang, s0, depth, len) {
      let s = s0;
      for (let k = 0; k < len; k++) {
        const l = 26 + r() * 46; const nx = x + Math.cos(ang) * l, ny = y + Math.sin(ang) * l;
        crackSegs.push({ x1: x, y1: y, x2: nx, y2: ny, s, w: Math.max(1.2, 3.4 - depth * 1.1 - k * .05) });
        s += l; x = nx; y = ny; ang += (r() - .5) * .5;
        if (depth < 2 && r() < .16) branch(x, y, ang + (r() < .5 ? -1 : 1) * (.5 + r() * .7), s, depth + 1, 6 + Math.floor(r() * 10));
        if (x < -50 || x > W + 50 || y < -50 || y > H + 50) break;
      }
    }
    for (let i = 0; i < 15; i++) branch(cx, cy, i / 15 * Math.PI * 2 + r() * .3, 0, 0, 40);
    // a couple of concentric rings joining the spokes
    for (const R of [70, 170, 330]) for (let i = 0; i < 15; i++) {
      const a1 = i / 15 * Math.PI * 2 + hash(i * 9 + R) * .2, a2 = (i + 1) / 15 * Math.PI * 2 + hash(i * 5 + R) * .2; const rr = R * (.85 + hash(i + R) * .3);
      if (hash(i * 3 + R) < .7) crackSegs.push({ x1: cx + Math.cos(a1) * rr, y1: cy + Math.sin(a1) * rr, x2: cx + Math.cos(a2) * rr * 1.05, y2: cy + Math.sin(a2) * rr * 1.05, s: rr * 1.15, w: 1.6 });
    }
  })();
  const SMAX = 1300;
  function drawCracks(p, color = '#111') {
    ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
    for (const g of crackSegs) {
      const lim = p * SMAX; if (g.s > lim) continue; const f = clamp((lim - g.s) / 50, 0, 1);
      ctx.lineWidth = g.w; ctx.beginPath(); ctx.moveTo(g.x1, g.y1); ctx.lineTo(mix(g.x1, g.x2, f), mix(g.y1, g.y2, f)); ctx.stroke();
    }
    ctx.restore();
  }
  // shatter mesh: jittered grid split into triangles
  const tris = [];
  (() => {
    const nx = 16, ny = 9, pts = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const edge = i === 0 || j === 0 || i === nx || j === ny;
      pts.push([i / nx * W + (edge ? 0 : (hash(i * 31 + j * 7) - .5) * W / nx * .8), j / ny * H + (edge ? 0 : (hash(i * 17 + j * 13) - .5) * H / ny * .8)]);
    }
    const P = (i, j) => pts[j * (nx + 1) + i];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      const quads = (i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const q of quads) { const cx = (q[0][0] + q[1][0] + q[2][0]) / 3, cy = (q[0][1] + q[1][1] + q[2][1]) / 3; tris.push({ q, cx, cy, h: hash(cx * .13 + cy * .71) }); }
    }
  })();
  function shatter(e, fill) {
    const ox = W * .5, oy = H * .47;
    for (const tr of tris) {
      const dx = tr.cx - ox, dy = tr.cy - oy, dist = Math.hypot(dx, dy) + 1;
      const delay = dist / 2600; const k = Math.max(0, e - delay); if (k <= 0) { drawTri(tr, 0, 0, 0, 1, fill, 1); continue; }
      const sp = 900 + tr.h * 1500; const mx = dx / dist * sp * k * (1 + k), my = dy / dist * sp * k * (1 + k) + 600 * k * k;
      const a = clamp(1 - k / .7, 0, 1); if (a <= 0) continue;
      drawTri(tr, mx, my, (tr.h - .5) * 9 * k, 1 - k * .5, fill, a);
    }
  }
  function drawTri(tr, mx, my, rot, s, fill, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(tr.cx + mx, tr.cy + my); ctx.rotate(rot); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(tr.q[0][0] - tr.cx, tr.q[0][1] - tr.cy); ctx.lineTo(tr.q[1][0] - tr.cx, tr.q[1][1] - tr.cy); ctx.lineTo(tr.q[2][0] - tr.cx, tr.q[2][1] - tr.cy); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = 'rgba(160,170,190,.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
  function glassShards(e) {
    // small glass splinters flying over the colour frame right after the break
    if (e < 0 || e > 1.6) return; const ox = W * .5, oy = H * .5;
    ctx.save();
    for (let i = 0; i < 70; i++) {
      const a = hash(i * 3.1) * Math.PI * 2, sp = 500 + hash(i * 7.7) * 1700, d = sp * e * (1 + e * .5);
      const x = ox + Math.cos(a) * d, y = oy + Math.sin(a) * d * .7 + 300 * e * e, sz = 14 + hash(i * 5.3) * 46, r = hash(i) * 6 + e * (hash(i * 2) - .5) * 14;
      ctx.globalAlpha = clamp(1.4 - e, 0, 1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(r);
      ctx.beginPath(); ctx.moveTo(-sz, -sz * .3); ctx.lineTo(sz * .8, -sz * .5); ctx.lineTo(sz * .1, sz * .7); ctx.closePath();
      ctx.fillStyle = 'rgba(220,235,255,.35)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }

  // ---------- subtitles ----------
  function cnSub(t, dark = true) {
    const l = lineAt(t); if (!l || !l.cn) return;
    const a = clamp((t - l.ct[0] + .1) / .25, 0, 1) * (1 - sm(l.t1 - .25, l.t1, t)); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.font = '700 38px "Noto Serif SC", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = dark ? 'rgba(0,0,0,.9)' : 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14; ctx.fillStyle = '#fff'; ctx.fillText(l.cn, W / 2, H - 70); ctx.restore();
  }
  function credit(dark) {
    ctx.save(); ctx.font = '300 24px "Noto Sans JP", sans-serif'; ctx.textBaseline = 'middle'; ctx.fillStyle = dark ? 'rgba(255,255,255,.7)' : 'rgba(20,20,20,.65)';
    ctx.textAlign = 'left'; ctx.fillText('ヒトリエ「MIRROR」', 56, 52); ctx.restore();
  }
  const kataStyle = (t, line, i0, len) => ({ times: line.ct.slice(i0, i0 + len), t, stroke: ['#0a0a0a', 22], shadow: [PINK, 0, 10, 10], pop: .16 });

  // ---------- story shots (monochrome + pink) ----------
  function storyImage(name, t, a, b, z0, z1, px0, px1, py0, py1, extra = {}) {
    const u = (t - a) / (b - a); const z = mix(z0, z1, eio(u)) * (1 + .012 * kickP(t));
    const shake = extra.shake ? (hash(Math.floor(t * 30)) - .5) * extra.shake : 0;
    cover(ctx, IM[name], z, mix(px0, px1, eio(u)), mix(py0, py1, eio(u)), extra.rot || 0, shake, shake * .6);
  }
  function shotUtsuranai(t) {
    storyImage('m1', t, 210, 213.98, 1.04, 1.14, .5, .46, .5, .5);
    const parts = K1.jp.split('　'); const n0 = parts[0].length;
    vText(ctx, parts[0], W * .86, 150, 150, F.kata, '#fff', Object.assign(kataStyle(t, K1, 0, n0), {}));
    // the second ウツラナイ tries to appear in the mirror and fails: a mirrored ghost that flickers out
    const t2 = K1.ct[n0 + 1]; if (t >= t2 - .05) {
      const fl = t < t2 + .9 ? (hash(Math.floor(t * 20)) > .45 ? .55 : .12) : clamp(1 - (t - t2 - .9) / .3, 0, 1) * .12;
      vText(ctx, parts[1], W * .71, 150, 150, F.kata, '#fff', { times: K1.ct.slice(n0 + 1), t, mirror: true, alpha: fl, strokeOnly: true, stroke: ['rgba(255,255,255,.9)', 3] });
    }
    vText(ctx, N1.jp, W * .085, 120, 50, F.min8, '#fff', { times: N1.ct, t, shadow: softShadow });
  }
  function shotKikoenai(t) {
    storyImage('m2', t, 213.98, 218.17, 1.06, 1.16, .55, .5, .5, .46);
    vText(ctx, K2.jp.split('　')[0], W * .92, 140, 150, F.kata, '#fff', { times: K2.ct.slice(0, 5), t, strokeOnly: true, stroke: ['#fff', 5], pop: .16 });
    vText(ctx, K2.jp.split('　')[1], W * .82, 200, 150, F.kata, '#fff', { times: K2.ct.slice(6), t, strokeOnly: true, stroke: ['rgba(255,255,255,.55)', 4], pop: .16 });
    // a pink trace across the frame that goes flat: the sound no longer reaches
    const k = clamp((t - K2.ct[0]) / 1.4, 0, 1); ctx.save(); ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.beginPath();
    for (let x = 0; x <= W; x += 6) { const amp = (1 - k) * 70 * Math.sin(x * .045 + t * 28) * Math.sin(x * .009 + 1); x ? ctx.lineTo(x, H * .5 + amp) : ctx.moveTo(x, H * .5 + amp); }
    ctx.stroke(); ctx.restore();
    const drip = N2.jp.indexOf('こぼれ');
    vText(ctx, N2.jp, W * .06, 110, 50, F.min8, '#fff', { times: N2.ct, t, shadow: softShadow, drip: i => i >= drip });
  }
  function shotWakaranai(t) {
    storyImage('m3', t, 218.17, 222.14, 1.02, 1.12, .5, .5, .45, .5);
    const parts = K3.jp.split('　');
    vText(ctx, parts[0], W * .055, 140, 140, F.kata, '#fff', Object.assign(kataStyle(t, K3, 0, 5), { scramble: .5 }));
    vText(ctx, parts[1], W * .14, 200, 140, F.kata, '#fff', Object.assign(kataStyle(t, K3, 6, 5), { scramble: .5 }));
    // "show me the me in the mirror": written mirrored, on the reflected half
    vText(ctx, N3.jp, W * .9, 120, 52, F.min8, '#fff', { times: N3.ct, t, shadow: softShadow, mirror: true });
  }
  function shotTomaranai(t) {
    const u = (t - 222.14) / (223.58 - 222.14);
    // whip pan with motion smear
    for (let k = 0; k < 4; k++) { ctx.globalAlpha = k ? .22 : 1; cover(ctx, IM.m4, 1.18, mix(.15, .85, eo(u)) - k * .012, .5); }
    ctx.globalAlpha = 1; speedLines(.8, Math.floor(t * 12));
    // ticker of トマラナイ racing across, faster and faster
    const v = 900 + 2600 * u; ctx.save(); ctx.font = F.kata.replace('{s}', 170); ctx.textBaseline = 'middle';
    const word = 'トマラナイ　'; const ww = ctx.measureText(word).width;
    for (const [row, dir] of [[H * .3, 1], [H * .72, -1]]) {
      let x = ((dir > 0 ? -1 : 1) * ((t - 222.14) * v) % ww) - ww;
      for (; x < W + ww; x += ww) { ctx.lineWidth = 18; ctx.strokeStyle = '#0a0a0a'; ctx.strokeText(word, x, row); ctx.fillStyle = dir > 0 ? '#fff' : PINK; ctx.fillText(word, x, row); }
    }
    ctx.restore();
  }
  function shotSayonara(t) {
    storyImage('m5', t, 223.58, SIL, 1.02, 1.12, .5, .52, .5, .45);
    const iS = N4.jp.indexOf('さよなら');
    vText(ctx, N4.jp.slice(0, iS).trim(), W * .9, 140, 52, F.min8, '#fff', { times: N4.ct, t, shadow: softShadow });
    hText(ctx, 'さよなら', W * .5, H * .78, 120, F.min8, '#fff', { times: N4.ct.slice(iS), t, align: 'center', shadow: ['rgba(0,0,0,.85)', 30, 0, 4], pop: .3, track: .35 });
  }
  function shotSilence(t) {
    ctx.fillStyle = '#f4f3f1'; ctx.fillRect(0, 0, W, H);
    if (IM.c5g) { ctx.globalAlpha = .1 * sm(SIL, SIL + 1.2, t); cover(ctx, IM.c5g, 1.02); ctx.globalAlpha = 1; }
    tile(ctx, G, 0, 0, .06, 'multiply');
    const p = ei(sm(228.1, 229.94, t)) * 1.0 + (t > 228.1 ? .02 : 0);
    if (t > 228.1) drawCracks(p);
    const a = sm(SIL + .4, SIL + 1.2, t) * (1 - sm(228.6, 229.2, t));
    ctx.save(); ctx.globalAlpha = a * .6; ctx.font = '300 30px "Noto Sans JP", sans-serif'; ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('（　　　　）', W / 2, H * .5); ctx.restore();
  }

  // ---------- chorus shots (flat colour) ----------
  const chorusWord = (line, k) => { const i0 = k * 6; return { times: line.ct.slice(i0, i0 + 6), started: line.ct[i0] }; };
  function giant(line, k, t, x, y, size, alpha = 1, color = '#fff') {
    const w = chorusWord(line, k); if (t < w.started - .05) return;
    hText(ctx, '泣いてるのに', x, y, size, F.kata, (ch) => ch === '泣' ? PINK : color, { times: w.times, t, stroke: [COBALT, size * .1], shadow: ['rgba(0,0,0,.35)', 0, 0, size * .06], alpha, pop: .14 });
  }
  function camChorus(t, base = 1) { return base * (1 + .028 * kickP(t, 10)); }
  function shotLeap(t) {
    const e = t - SHATTER; const z = mix(1.35, 1.0, eo(e / .7)) * camChorus(t);
    ctx.fillStyle = COBALT; ctx.fillRect(0, 0, W, H);
    cover(ctx, IM.c1, z, .5, .5, (1 - eo(e / .7)) * -.04);
    glassShards(e);
    giant(CA, 0, t, 70, 140, 170);
  }
  function shotSplit(t, empty = false) {
    const z = camChorus(t, 1.02);
    cover(ctx, IM[empty ? 'c2e' : 'c2'], z, .5, .5);
    if (!empty) {
      giant(CA, 1, t, W / 2, 130, 150, 1);
      // the mirror side flickers into negative on the backbeat
      if (snareP(t, 14) > .35 && Math.floor(beatF(t)) % 2 === 1) invertRect(W / 2, 0, W / 2, H);
    } else {
      const i0 = CA.jp.indexOf('君'); vText(ctx, CA.jp.slice(i0), W * .75, 150, 108, F.min8, '#0b0b14', { times: CA.ct.slice(i0), t, pop: .25 });
    }
  }
  function shotCryClose(t) {
    const z = camChorus(t, mix(1.0, 1.06, (t - 233.95) / 2));
    cover(ctx, IM.c3, z, .5, .5);
    // stacked chorus words, the newest on top
    giant(CA, 0, Math.max(t, 999), 70, 120, 150, .25);
    giant(CA, 1, Math.max(t, 999), 70, 290, 150, .5);
    giant(CA, 2, t, 70, 460, 150, 1);
  }
  function shotCryNeg(t) {
    cover(ctx, IM.c3, camChorus(t, 1.08), .55, .45);
    giant(CB, 0, t, 60, H * .79, 180);
    const b = Math.floor(beatF(t)); if (b % 2 === 0 && fract(beatF(t)) < .22) invertRect(0, 0, W, H);
  }
  function shotFloor(t) {
    const u = (t - 240) / 2; cover(ctx, IM.c4, camChorus(t, mix(1.12, 1.02, eo(u))), .5, .5, mix(.05, 0, eo(u)));
    giant(CB, 1, t, W * .5, H * .15, 132, 1);
    // hide it behind text if the word sits on the centre: centred alignment
  }
  function shotSplitSwap(t) {
    cover(ctx, IM.c2, camChorus(t, 1.02), .5, .5);
    giant(CB, 2, t, W / 2, 130, 150);
    const b = Math.floor(beatF(t)); invertRect(b % 2 ? W / 2 : 0, 0, W / 2, H);
  }
  function shotEmptyFrame(t) {
    const u = (t - 244) / 2; cover(ctx, IM.c5, mix(1.0, 1.08, u) * (1 + .015 * kickP(t)), .5, .5);
    const i0 = CB.jp.indexOf('此処');
    hText(ctx, CB.jp.slice(i0), W / 2, H * .5, 132, F.min8, '#fff', { times: CB.ct.slice(i0), t, align: 'center', shadow: ['rgba(0,0,30,.55)', 30, 0, 6], pop: .25, track: .08 });
  }

  // ---------- timeline ----------
  function render(t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    let dark = true, colour = false;
    if (t < 213.98) shotUtsuranai(t);
    else if (t < 218.17) shotKikoenai(t);
    else if (t < 222.14) shotWakaranai(t);
    else if (t < 223.58) shotTomaranai(t);
    else if (t < SIL) shotSayonara(t);
    else if (t < SHATTER) { shotSilence(t); dark = false; }
    else {
      colour = true;
      if (t < 231.95) shotLeap(t);
      else if (t < 233.95) shotSplit(t);
      else if (t < 235.95) shotCryClose(t);
      else if (t < 237.9) shotSplit(t, true);
      else if (t < 240.0) shotCryNeg(t);
      else if (t < 242.0) shotFloor(t);
      else if (t < 244.0) shotSplitSwap(t);
      else shotEmptyFrame(t);
    }
    // texture: halftone band + grain + vignette
    if (colour) tile(ctx, HT, 0, 0, .18, 'multiply', 1, [0, H - 220, W, 220]);
    tile(ctx, G, hash(Math.floor(t * 24)) * 256, hash(Math.floor(t * 24) + 7) * 256, colour ? .08 : .14, 'overlay');
    if (dark) vignette(colour ? .3 : .5);
    // break of the mirror: the silent white frame shatters into triangles over the colour shot
    if (t >= SHATTER && t < SHATTER + 1.2) shatter(t - SHATTER, '#f4f3f1');
    flash(t >= SHATTER ? Math.exp(-(t - SHATTER) * 16) * .95 : 0);
    // hit effects
    if (colour) {
      const barHit = Math.exp(-(fract((t - 10) / 2) * 2) * 9);
      if (t - SHATTER < .4) chroma(14 * Math.exp(-(t - SHATTER) * 6)); else chroma(9 * barHit * (snareP(t) > .5 ? 1 : .5));
      if (t > 231.9 && Math.abs(t - Math.round((t - 10) / 2) * 2 - 10) < .05) glitch(.8, Math.floor(t * 30));
    } else if (t < SIL) {
      // story mode: a short glitch tear on every line change
      for (const l of [K1, N1, K2, N2, K3, N3, K4, N4]) { const d = t - l.ct[0]; if (d >= 0 && d < .1) glitch(.6, Math.floor(t * 30)); }
    }
    if (t < SIL || colour) cnSub(t);
    credit(dark);
    if (t > 245.0) flash((t - 245.0) / 1.0, '0,0,0');
    if (t < 210.35) flash(1 - (t - 210.0) / .35, '0,0,0');
    ctx.restore();
  }

  window.render = render;
  window.ready = Promise.all([loadArt(), loadFonts()]).then(() => true);
})();
