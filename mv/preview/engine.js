// Shared engine: song clock, lyrics helpers, assets, player controls.
(function () {
  const SONG = {
    dur: 313.96, bar1: 10.0, beat: 0.5, partOffset: 156.98,
    sections: [
      [0, 10, 'intro', '前奏'], [10, 26, 'intro', '前奏'], [26, 58, 'verse', '主歌1'], [58, 76.8, 'chorus', '副歌1'],
      [76.8, 90, 'intro', '间奏'], [90, 126, 'verse', '主歌2'], [126, 138.6, 'verse', '过渡'], [138.6, 146, 'intro', '断奏'],
      [146, 161.6, 'intro', 'solo'], [161.6, 179.8, 'quote', '『』1'], [179.8, 193.7, 'intro', '间奏'], [193.7, 210, 'quote', '『』2'],
      [210, 226.3, 'quote', '片假名'], [226.3, 230, 'silence', '静音'], [230, 266.3, 'chorus', '最终副歌'], [266.3, 310.1, 'intro', '尾奏'],
      [310.1, 313.96, 'silence', '']
    ],
    marks: [[10, '0:10', ''], [138.6, '2:18', ''], [177.6, '2:57', 'minor'], [205.8, '3:25', 'minor'], [226.3, '3:46', 'left'], [230, '3:50', 'right minor']],
    demos: [['⑤', 224, 246], ['①', 222, 246], ['②', 210, 232], ['③', 237.9, 260], ['④', 161.4, 179.8]]
  };
  const COLORS = { intro: '#2a3550', verse: '#3d5a99', chorus: '#8a4b6e', quote: '#6b6a3c', silence: '#c8d2e6' };

  const U = {
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
    mix: (a, b, t) => a + (b - a) * t,
    smooth: (a, b, x) => { const t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); },
    easeOut: t => 1 - Math.pow(1 - U.clamp(t, 0, 1), 3),
    easeIn: t => Math.pow(U.clamp(t, 0, 1), 3),
    fract: x => x - Math.floor(x),
    hash: n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); },
    rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; },
    fmt(t) { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); },
    beatF: t => (t - SONG.bar1) / SONG.beat,
    barF: t => (t - SONG.bar1) / (SONG.beat * 4),
    // decaying pulse on every beat (or subdivision): 1 at the hit, falling off
    pulse(t, sub = 1, k = 6) { const b = U.beatF(t) * sub; return Math.exp(-U.fract(b) * k); },
  };

  // ---- lyrics ----
  const L = {
    all: (typeof LYRICS !== 'undefined') ? LYRICS : [],
    at(t, lead = 0.08) {
      let cur = null;
      for (const l of this.all) { const s = Math.min(l.t0, l.ct[0]) - lead; if (t >= s && t < l.t1 - 0.02) cur = l; }
      return cur;
    },
    // index of the last visible character (-1 if none)
    shown(line, t, lead = 0.03) { let n = 0; for (let i = 0; i < line.ct.length; i++) if (line.ct[i] - lead <= t) n = i + 1; return n; },
    find(prefix, near) { let best = null; for (const l of this.all) if (l.jp.startsWith(prefix) && (best === null || Math.abs(l.t0 - near) < Math.abs(best.t0 - near))) best = l; return best; }
  };

  // ---- assets ----
  const IMGS = {};
  const imgList = ['film_window', 'film_elevator', 'film_empty', 'film_puddle', 'riso_hands', 'riso_rorschach', 'riso_xerox',
    'genga_a12', 'genga_a13', 'genga_a14', 'genga_c3', 'genga_color', 'lighttable'];
  function loadImages() {
    return Promise.all(imgList.map(n => new Promise(res => {
      const im = new Image(); im.onload = () => { IMGS[n] = im; res(); }; im.onerror = () => res(); im.src = 'img/' + n + '.jpg';
    })));
  }
  function loadFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const jp = L.all.map(l => l.jp).join('') + 'ウツラナイキコエナイワカラナイトマラナイ　無音秒No.MIRRORTIME';
    const cn = L.all.map(l => l.cn).join('') + '映不出听不到我不懂停不下来无音秒';
    const jobs = [
      ['500 40px "Shippori Mincho B1"', jp], ['800 40px "Shippori Mincho B1"', jp],
      ['500 40px "Noto Serif SC"', cn], ['900 40px "Noto Serif SC"', cn],
      ['400 40px "Klee One"', jp + '0123456789'], ['600 40px "Klee One"', jp],
      ['400 40px "Long Cang"', cn], ['400 40px "Dela Gothic One"', jp], ['400 40px "DotGothic16"', jp],
      ['400 40px "Reggae One"', jp], ['400 40px "Zen Kurenaido"', jp]
    ];
    const all = Promise.all(jobs.map(([f, s]) => document.fonts.load(f, s).catch(() => null)));
    return Promise.race([all, new Promise(r => setTimeout(r, 6000))]);
  }

  // procedural textures shared by demos
  const TEX = {};
  function makeTextures() {
    // grain: 256px tile of gaussian-ish noise around mid grey
    const g = document.createElement('canvas'); g.width = g.height = 256;
    const gc = g.getContext('2d'); const id = gc.createImageData(256, 256); const r = U.rng(7);
    for (let i = 0; i < id.data.length; i += 4) { const v = 128 + ((r() + r() + r() - 1.5) * 120); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gc.putImageData(id, 0, 0); TEX.grain = g;
    // paper: warm fibres and blotches
    const p = document.createElement('canvas'); p.width = p.height = 512; const pc = p.getContext('2d');
    pc.fillStyle = '#ece8df'; pc.fillRect(0, 0, 512, 512); const r2 = U.rng(11);
    for (let i = 0; i < 2600; i++) {
      pc.strokeStyle = `rgba(${90 + r2() * 60},${80 + r2() * 50},${60 + r2() * 40},${0.03 + r2() * 0.05})`;
      pc.lineWidth = 0.4 + r2() * 0.8; pc.beginPath(); const x = r2() * 512, y = r2() * 512, a = r2() * 6.28, l = 4 + r2() * 18;
      pc.moveTo(x, y); pc.quadraticCurveTo(x + Math.cos(a) * l * .5 + r2() * 4, y + Math.sin(a) * l * .5 + r2() * 4, x + Math.cos(a) * l, y + Math.sin(a) * l); pc.stroke();
    }
    for (let i = 0; i < 40; i++) { const x = r2() * 512, y = r2() * 512, rr = 20 + r2() * 90; const gr = pc.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, `rgba(120,100,70,${0.025 + r2() * 0.03})`); gr.addColorStop(1, 'rgba(120,100,70,0)'); pc.fillStyle = gr; pc.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    TEX.paper = p;
  }
  function tile(ctx, tex, w, h, ox = 0, oy = 0, scale = 1) {
    const pat = ctx.createPattern(tex, 'repeat');
    ctx.save(); ctx.translate(-((ox % (tex.width * scale)) + tex.width * scale), -((oy % (tex.height * scale)) + tex.height * scale)); ctx.scale(scale, scale);
    ctx.fillStyle = pat; ctx.fillRect(0, 0, (w / scale) + tex.width * 3, (h / scale) + tex.height * 3); ctx.restore();
  }
  // draw image to cover a rect (object-fit: cover), with zoom & pan (fractions)
  function cover(ctx, im, x, y, w, h, zoom = 1, px = 0.5, py = 0.5) {
    if (!im) return;
    const s = Math.max(w / im.width, h / im.height) * zoom; const dw = im.width * s, dh = im.height * s;
    ctx.drawImage(im, x + (w - dw) * px, y + (h - dh) * py, dw, dh);
  }

  // ---- player ----
  const demos = {}; const factories = {};
  let active = null, last = 0, raf = 0;
  const audio = new Audio(); let audioReady = false, audioOffset = SONG.partOffset;

  function register(name, factory) { factories[name] = factory; }

  function sizeCanvases(d) {
    const rect = d.stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, Math.min(d.maxW || 1280, Math.round(rect.width * dpr)));
    const h = Math.round(w * 9 / 16);
    d.stage.querySelectorAll('canvas').forEach(c => { if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } });
    d.W = w; d.H = h; if (d.resize) d.resize(w, h);
  }
  function render(d) {
    try { d.draw(d.t); } catch (e) { console.error(e); }
    const bar = Math.floor(U.barF(d.t)) + 1;
    d.hud.textContent = U.fmt(d.t) + '  ·  第 ' + bar + ' 小节';
    const bi = ((Math.floor(U.beatF(d.t)) % 4) + 4) % 4;
    d.dots.forEach((el, i) => el.classList.toggle('on', i === bi));
  }
  function audioSeek(t) { if (audioReady) { try { audio.currentTime = Math.max(0, t - audioOffset); } catch (e) { } } }
  function play(d) {
    if (active && active !== d) pause(active);
    active = d; d.playing = true; d.stage.classList.add('playing'); d.playBtn.textContent = '暂停';
    if (d.t >= d.seg[1] - 0.05) d.t = d.seg[0];
    if (audioReady) { audioSeek(d.t); audio.play().catch(() => { }); }
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function pause(d) {
    d.playing = false; d.stage.classList.remove('playing'); d.playBtn.textContent = '播放';
    if (active === d) { audio.pause(); active = null; cancelAnimationFrame(raf); }
  }
  function seek(d, t) {
    d.t = U.clamp(t, d.seg[0], d.seg[1] - 0.01);
    if (d.playing) audioSeek(d.t); else render(d);
  }
  function loop(now) {
    if (!active) return;
    const d = active; const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (audioReady && !audio.paused) d.t = audio.currentTime + audioOffset; else d.t += dt;
    if (d.t >= d.seg[1]) { d.t = d.seg[0]; audioSeek(d.t); if (d.reset) d.reset(); }
    render(d); raf = requestAnimationFrame(loop);
  }

  function initDemos() {
    document.querySelectorAll('.stage[data-demo]').forEach(stage => {
      const name = stage.dataset.demo; const f = factories[name]; if (!f) return;
      const section = stage.closest('section');
      const d = f(stage); d.stage = stage; d.name = name; d.t = d.poster; d.playing = false;
      d.hud = section.querySelector('.tc'); d.dots = [...section.querySelectorAll('.beats i')];
      d.playBtn = section.querySelector('.act-play');
      demos[name] = d; sizeCanvases(d); render(d);
      const toggle = () => d.playing ? pause(d) : play(d);
      d.playBtn.addEventListener('click', toggle);
      stage.querySelector('.big-play').addEventListener('click', toggle);
      stage.addEventListener('click', e => { if (e.target.tagName === 'CANVAS' && d.playing) pause(d); });
      section.querySelector('.act-restart').addEventListener('click', () => { if (d.reset) d.reset(); seek(d, d.seg[0]); if (!d.playing) play(d); });
      section.querySelectorAll('.chip[data-seek]').forEach(c => c.addEventListener('click', () => { seek(d, parseFloat(c.dataset.seek)); if (!d.playing) render(d); }));
    });
    let to = 0;
    window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(() => Object.values(demos).forEach(d => { sizeCanvases(d); render(d); }), 120); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && active) pause(active); });
  }

  function initAudio() {
    const input = document.getElementById('audioIn'); const st = document.getElementById('audioState');
    input.addEventListener('change', () => {
      const f = input.files && input.files[0]; if (!f) return;
      audio.src = URL.createObjectURL(f); audio.preload = 'auto';
      audio.onloadedmetadata = () => {
        audioReady = true; audioOffset = audio.duration > 300 ? 0 : SONG.partOffset;
        st.innerHTML = '已载入 <b>' + f.name.replace(/[<>&]/g, '') + '</b>（' + U.fmt(audio.duration) + '）。' +
          (audioOffset ? '按后半段对齐：文件 0:00 = 歌曲 2:36.98。' : '按完整歌曲对齐。') + '点任意演示的"播放"即可同步。';
        if (active) { audioSeek(active.t); audio.play().catch(() => { }); }
      };
      audio.onerror = () => { audioReady = false; st.textContent = '这个文件浏览器读不了，换成 wav 或 mp3 再试。'; };
    });
  }

  function initTimeline() {
    const bar = document.getElementById('tlBar'), scale = document.getElementById('tlScale'); const D = SONG.dur;
    SONG.sections.forEach(([a, b, k, n]) => { const el = document.createElement('div'); el.className = 'tl-seg'; el.style.left = (a / D * 100) + '%'; el.style.width = ((b - a) / D * 100) + '%'; el.style.background = COLORS[k]; el.title = n + ' ' + U.fmt(a).slice(0, -3) + '–' + U.fmt(b).slice(0, -3); bar.appendChild(el); });
    SONG.marks.forEach(([t, lab, cls]) => { const m = document.createElement('div'); m.className = 'tl-mark ' + cls; m.style.left = (t / D * 100) + '%'; m.innerHTML = '<span>' + lab + '</span>'; bar.appendChild(m); });
    // demo brackets, staggered into rows so overlapping segments stay readable
    const rows = [1, 2, 0, 0, 0];
    SONG.demos.forEach(([lab, a, b], i) => { const el = document.createElement('div'); el.className = 'tl-demo'; el.style.left = (a / D * 100) + '%'; el.style.width = ((b - a) / D * 100) + '%'; el.style.top = (6 + rows[i] * 15) + 'px'; el.textContent = lab; el.title = '演示 ' + lab + '：' + U.fmt(a).slice(0, -3) + '–' + U.fmt(b).slice(0, -3); scale.appendChild(el); });
    for (let m = 0; m <= 5; m++) { const s = document.createElement('span'); s.style.left = (m * 60 / D * 100) + '%'; s.textContent = m + ':00'; scale.appendChild(s); }
  }

  function initLightbox() {
    const lb = document.getElementById('lightbox'), img = lb.querySelector('img');
    document.querySelectorAll('.thumbs button').forEach(b => b.addEventListener('click', () => { img.src = b.dataset.full; img.alt = b.querySelector('img').alt; lb.classList.add('open'); }));
    lb.addEventListener('click', () => lb.classList.remove('open'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('open'); });
  }

  function boot() {
    makeTextures(); initTimeline(); initLightbox(); initAudio(); initDemos();
    Promise.all([loadImages(), loadFonts()]).then(() => { Engine.ready = true; Object.values(demos).forEach(d => { if (d.onReady) d.onReady(); render(d); }); });
  }

  window.Engine = { SONG, U, L, IMGS, TEX, tile, cover, register, boot, demos, ready: false };
})();
