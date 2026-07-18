// =========================================================
// Weave — the "fabrics" canvas layer for the epilogue.
//
// The chapter's central image: every technology is a fabric,
// and Lynx is the loom that weaves them into the platforms.
// One persistent canvas lives *under* the slides inside the
// fixed 1280×720 frame; a slide opts in with data-weave="…"
// and the engine TWEENS the whole thread field between
// scenes, so adjacent weave slides read as one continuous
// magic move of the threads themselves:
//
//   fabric         Vue alone — glowing green threads
//   fabric-dense   the same fabric, tighter weave
//   loom           Vue pinches through Lynx → iOS/Android/Web
//   loom-dim       the loom, faded to a backdrop
//   compress       the model's wide choice space → the idiom
//   panorama-left  the whole web ecosystem weaves in
//   panorama       …and fans out into every platform
//   finale         the panorama as a quiet backdrop
//
// Geometry is authored in the 1280×720 design space (same as
// the slides); lane fractions are MIRRORED by .wlab positions
// in index.html, so DOM labels sit exactly on their bundles.
// The backing store scales with devicePixelRatio × stage
// scale so threads stay crisp on any screen.
// =========================================================

const W = 1280;
const H = 720;
const XW = 0.5; // the waist — where the Lynx mark sits
const YW = 0.5;
const SAMPLES = 44;
const TWEEN_MS = 1150;
const FADE_MS = 450;
const TAU = Math.PI * 2;

// Deterministic per-thread jitter — no Math.random, so every
// run (and both speaker/audience windows) draws the same weave.
const rnd = (i, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7 + 17.13) * 43758.5453;
  return x - Math.floor(x);
};
const lerp = (a, b, u) => a + (b - a) * u;
const clamp01 = (u) => Math.max(0, Math.min(1, u));
const smooth = (u) => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - ((-2 * u + 2) ** 3) / 2);
const hex = (h) => [1, 3, 5].map((k) => Number.parseInt(h.slice(k, k + 2), 16));

const PAL = {
  vue: '#42b883', teal: '#3deae7',
  react: '#61dafb', svelte: '#ff9a4d', solid: '#ffd166', octane: '#ff5468',
  css: '#8a63d2', tailwind: '#38bdf8', motion: '#f7e14d', pretext: '#ffc24d',
  ios: '#cdd6e4', android: '#3ddc84', web: '#56b8f0', harmony: '#ff6f61',
  macos: '#aab4c8', windows: '#2f7fe0', linux: '#f5c04a', more: '#8b93a3',
};

// Lane fractions — keep in sync with the .wlab tops in index.html.
const ECO = [
  { c: 'vue', y: 0.16, n: 6, a: 1 },
  { c: 'react', y: 0.25, n: 5, a: 0.95 },
  { c: 'svelte', y: 0.33, n: 3, a: 0.55 },
  { c: 'solid', y: 0.40, n: 3, a: 0.5 },
  { c: 'octane', y: 0.47, n: 3, a: 0.85 },
  { c: 'css', y: 0.55, n: 4, a: 0.9 },
  { c: 'tailwind', y: 0.63, n: 3, a: 0.85 },
  { c: 'motion', y: 0.71, n: 3, a: 0.7 },
  { c: 'pretext', y: 0.80, n: 3, a: 0.7 },
];
const PLAT = [
  { c: 'ios', y: 0.16 }, { c: 'android', y: 0.257 }, { c: 'web', y: 0.354 },
  { c: 'harmony', y: 0.451 }, { c: 'macos', y: 0.549 }, { c: 'windows', y: 0.646 },
  { c: 'linux', y: 0.743 }, { c: 'more', y: 0.84 },
];

const inkColor = () =>
  document.documentElement.classList.contains('light') ? [42, 48, 58] : [214, 222, 232];

// A thread's tweenable state is a flat numeric record — colors are
// split into channels so one generic lerp covers everything.
function mk(o) {
  const [sr, sg, sb] = o.src;
  const [dr, dg, db] = o.dst || o.src;
  return {
    alpha: 1, width: 1.5, yL: 0.5, yR: 0.5, ampL: 22, ampR: 22,
    waist: 0, aL: 0.3, aR: 0.3, braid: 0, shim: 0,
    ...o, src: undefined, dst: undefined,
    sr, sg, sb, dr, dg, db,
  };
}

function fabricScene(n, band) {
  const g = hex(PAL.vue);
  const t = hex(PAL.teal);
  const out = [];
  for (let i = 0; i < n; i++) {
    const mix = rnd(i, 9) * 0.45;
    const c = g.map((v, k) => Math.round(lerp(v, t[k], mix)));
    out.push(mk({
      src: c, dst: c,
      yL: lerp(band[0], band[1], rnd(i, 1)),
      yR: lerp(band[0], band[1], rnd(i, 2)),
      ampL: 16 + rnd(i, 3) * 22, ampR: 16 + rnd(i, 4) * 22,
      alpha: 0.55 + rnd(i, 5) * 0.4,
      width: 1.3 + rnd(i, 6) * 0.9,
      aL: 0.1, aR: 0.1,
      shim: rnd(i, 7) < 0.6 ? 1 : 0,
    }));
  }
  return out;
}

function loomScene(dim) {
  const src = hex(PAL.vue);
  const lanes = ['ios', 'android', 'web'];
  const laneY = [0.30, 0.50, 0.70];
  const out = [];
  for (let i = 0; i < 12; i++) {
    const li = i % 3;
    out.push(mk({
      src, dst: hex(PAL[lanes[li]]),
      yL: lerp(0.34, 0.66, (i + 0.5) / 12) + (rnd(i, 1) - 0.5) * 0.02,
      yR: laneY[li] + (rnd(i, 2) - 0.5) * 0.05,
      waist: 1, braid: 7,
      ampL: 8 + rnd(i, 3) * 9, ampR: 5 + rnd(i, 4) * 5,
      alpha: (0.7 + rnd(i, 5) * 0.3) * dim,
      width: 1.5, aL: 0.55, aR: 0.75,
      shim: rnd(i, 7) < 0.7 ? 1 : 0,
    }));
  }
  return out;
}

// The steering image: a wide, gray, chaotic left half — everything
// the model *could* emit — pulled through the waist into a narrow
// bright idiom. Ink is resolved at build time; the theme observer
// re-issues the scene so a mid-slide theme flip re-inks the noise.
function compressScene() {
  const ink = inkColor();
  const dst = hex(PAL.vue);
  const out = [];
  for (let i = 0; i < 30; i++) {
    out.push(mk({
      src: ink, dst,
      yL: 0.5 + (rnd(i, 1) - 0.5) * 0.82,
      yR: 0.5 + ((i % 6) - 2.5) * 0.016 + (rnd(i, 2) - 0.5) * 0.008,
      waist: 0.9, braid: 4,
      ampL: 26 + rnd(i, 3) * 26, ampR: 3,
      alpha: 0.4 + rnd(i, 5) * 0.3,
      width: 1.2, aL: 0.08, aR: 0.9,
      shim: rnd(i, 7) < 0.25 ? 1 : 0,
    }));
  }
  return out;
}

// `only` (a list of ECO keys) reveals just those strands — the rest keep
// their pool index but tween to alpha 0, so the field builds up strand-by-
// strand in place (React → React+Vue → all) without any thread reflow.
function panoramaScene({ rightA = 1, dim = 1, only = null }) {
  const out = [];
  let i = 0;
  for (const g of ECO) {
    const src = hex(PAL[g.c]);
    const shown = !only || only.includes(g.c);
    for (let k = 0; k < g.n; k++, i++) {
      const pl = PLAT[Math.floor(rnd(i, 11) * PLAT.length) % PLAT.length];
      out.push(mk({
        src,
        // Before the right side "blossoms", threads trail off dim and
        // uncommitted near the waist line instead of claiming a platform.
        dst: rightA < 0.5 ? src : hex(PAL[pl.c]),
        yL: g.y + (k - (g.n - 1) / 2) * 0.014 + (rnd(i, 1) - 0.5) * 0.006,
        yR: rightA < 0.5
          ? 0.5 + (rnd(i, 2) - 0.5) * 0.10
          : pl.y + (rnd(i, 2) - 0.5) * 0.05,
        waist: 1, braid: 6,
        ampL: 6 + rnd(i, 3) * 9, ampR: 5 + rnd(i, 4) * 7,
        alpha: shown ? g.a * dim * (0.75 + rnd(i, 5) * 0.25) : 0,
        width: 1.35, aL: 0.5, aR: rightA * 0.7 + 0.04,
        shim: rnd(i, 7) < (dim < 0.5 ? 0.2 : 0.5) ? 1 : 0,
      }));
    }
  }
  return out;
}

// Built lazily per setScene call (cheap, deterministic) so theme-
// dependent colors resolve against the *current* theme.
const SCENES = {
  fabric: () => fabricScene(10, [0.32, 0.68]),
  'fabric-dense': () => fabricScene(22, [0.26, 0.74]),
  loom: () => loomScene(1),
  'loom-dim': () => loomScene(0.22),
  compress: () => compressScene(),
  'panorama-r': () => panoramaScene({ rightA: 0, dim: 1, only: ['react'] }),
  'panorama-rv': () => panoramaScene({ rightA: 0, dim: 1, only: ['react', 'vue'] }),
  'panorama-left': () => panoramaScene({ rightA: 0, dim: 1 }),
  panorama: () => panoramaScene({ rightA: 1, dim: 1 }),
  finale: () => panoramaScene({ rightA: 1, dim: 0.3 }),
};

const POOL_N = Math.max(...Object.keys(SCENES).map((k) => SCENES[k]().length));
const TWEEN_KEYS = [
  'alpha', 'width', 'yL', 'yR', 'ampL', 'ampR', 'waist',
  'aL', 'aR', 'braid', 'shim', 'sr', 'sg', 'sb', 'dr', 'dg', 'db',
];

export function initWeave(frame, { getScale, reducedMotion = false, embed = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'weave-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  frame.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { setScene: () => {}, destroy: () => {} };

  const still = reducedMotion || embed;

  // Per-thread motion constants (never tweened).
  const motion = Array.from({ length: POOL_N }, (_, i) => ({
    phase: rnd(i, 20) * TAU,
    speed: 0.5 + rnd(i, 21) * 0.9,
    freq: TAU * (1.1 + rnd(i, 22) * 1.6),
    braidHz: 1.1 + rnd(i, 23) * 0.7,
    shimSpeed: 0.10 + rnd(i, 24) * 0.10,
    shimOff: rnd(i, 25),
  }));

  const hidden = (base) => ({ ...base, alpha: 0 });
  const seed = SCENES.fabric();
  const pool = Array.from({ length: POOL_N }, (_, i) => ({
    cur: hidden(seed[i % seed.length]),
    from: null,
    to: null,
  }));

  let scene = null;
  let tweenT0 = 0;
  let tweening = false;
  let fade = 0;
  let fadeFrom = 0;
  let fadeTo = 0;
  let fadeT0 = 0;
  let raf = 0;

  function resize() {
    const scale = Math.max(0.4, getScale?.() || 1);
    const q = Math.min(2.4, (window.devicePixelRatio || 1) * scale);
    canvas.width = Math.round(W * q);
    canvas.height = Math.round(H * q);
    ctx.setTransform(q, 0, 0, q, 0, 0);
    if (still) draw(4.2);
  }
  // fitStage also runs on resize — defer one frame so getScale()
  // reads the post-fit value.
  const onResize = () => requestAnimationFrame(resize);
  window.addEventListener('resize', onResize);
  resize();

  // Theme flips re-ink theme-dependent scenes (compress) and, in
  // reduced-motion mode, trigger the one static redraw.
  const themeObs = new MutationObserver(() => {
    if (scene) setScene(scene, true);
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  const pts = new Float64Array((SAMPLES + 1) * 2);

  function samplePts(th, m, t) {
    for (let s = 0; s <= SAMPLES; s++) {
      const xn = -0.02 + (1.04 * s) / SAMPLES;
      const u = clamp01(xn);
      const line = lerp(th.yL, th.yR, smooth(u));
      let y = line;
      if (th.waist > 0.002) {
        const pin = u < XW
          ? lerp(th.yL, YW, smooth(u / XW))
          : lerp(YW, th.yR, smooth((u - XW) / (1 - XW)));
        y = lerp(line, pin, th.waist);
      }
      y *= H;
      const pinchG = Math.exp(-((u - XW) ** 2) / (2 * 0.055 ** 2));
      const env = smooth(u / 0.10) * smooth((1 - u) / 0.10)
        * (1 - th.waist * pinchG * 0.85);
      const amp = lerp(th.ampL, th.ampR, smooth(u));
      y += amp * Math.sin(xn * m.freq + m.phase + t * m.speed) * env;
      // Interlace right at the waist — the threads visibly cross each
      // other as they pass through the loom.
      y += th.braid * Math.sin(t * m.braidHz + m.phase * 7.31) * pinchG;
      pts[s * 2] = xn * W;
      pts[s * 2 + 1] = y;
    }
  }

  function strokePts(a, b) {
    ctx.beginPath();
    ctx.moveTo(pts[a * 2], pts[a * 2 + 1]);
    for (let s = a + 1; s <= b; s++) ctx.lineTo(pts[s * 2], pts[s * 2 + 1]);
    ctx.stroke();
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    if (fade <= 0.004) return;
    const light = document.documentElement.classList.contains('light');
    // Bright neon washes out on paper — pull colors toward ink instead.
    const cf = light ? 0.68 : 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < POOL_N; i++) {
      const th = pool[i].cur;
      const m = motion[i];
      const a = th.alpha * fade;
      if (a <= 0.004) continue;
      samplePts(th, m, t);

      const sc = `${Math.round(th.sr * cf)},${Math.round(th.sg * cf)},${Math.round(th.sb * cf)}`;
      const dc = `${Math.round(th.dr * cf)},${Math.round(th.dg * cf)},${Math.round(th.db * cf)}`;
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, `rgba(${sc},${th.aL})`);
      grad.addColorStop(0.4, `rgba(${sc},1)`);
      grad.addColorStop(0.6, `rgba(${dc},1)`);
      grad.addColorStop(1, `rgba(${dc},${th.aR})`);
      ctx.strokeStyle = grad;

      if (!light) {
        // Additive glow pass, dark theme only.
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * 0.14;
        ctx.lineWidth = th.width * 3.6;
        strokePts(0, SAMPLES);
      }
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      ctx.globalAlpha = light ? a * 0.9 : a;
      ctx.lineWidth = th.width;
      strokePts(0, SAMPLES);

      // Traveling shimmer — a short bright run pulled along the thread,
      // the "being woven" motion.
      if (th.shim > 0.05 && !still) {
        const hs = ((t * m.shimSpeed + m.shimOff) % 1.3) - 0.15;
        const a0 = Math.max(0, Math.ceil(((hs + 0.02) / 1.04) * SAMPLES));
        const b0 = Math.min(SAMPLES, Math.floor(((hs + 0.12) / 1.04) * SAMPLES));
        if (b0 > a0) {
          const edge = smooth((hs + 0.1) / 0.2) * smooth((1.1 - hs) / 0.2);
          const c = hs < 0.5 ? [th.sr, th.sg, th.sb] : [th.dr, th.dg, th.db];
          const bright = c.map((v) => Math.round(lerp(v * cf, light ? 30 : 255, 0.6)));
          ctx.strokeStyle = `rgb(${bright.join(',')})`;
          ctx.globalAlpha = a * th.shim * edge * 0.9;
          ctx.lineWidth = th.width * 1.8;
          strokePts(a0, b0);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(nowMs) {
    raf = 0;
    const now = nowMs / 1000;
    if (tweening) {
      const p = clamp01((nowMs - tweenT0) / TWEEN_MS);
      const e = easeInOut(p);
      for (const th of pool) {
        for (const k of TWEEN_KEYS) th.cur[k] = lerp(th.from[k], th.to[k], e);
      }
      if (p >= 1) tweening = false;
    }
    if (fade !== fadeTo) {
      const p = clamp01((nowMs - fadeT0) / FADE_MS);
      fade = lerp(fadeFrom, fadeTo, smooth(p));
      if (p >= 1) fade = fadeTo;
    }
    draw(now);
    const alive = tweening || fade !== fadeTo || (fade > 0.004 && !still);
    if (alive) raf = requestAnimationFrame(tick);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function setScene(name, force = false) {
    if (name === scene && !force) return;
    scene = SCENES[name] ? name : null;
    const now = performance.now();

    if (scene) {
      const target = SCENES[scene]();
      for (let i = 0; i < POOL_N; i++) {
        pool[i].from = { ...pool[i].cur };
        pool[i].to = target[i] ? { ...target[i] } : hidden(pool[i].cur);
      }
      tweenT0 = now;
      tweening = true;
      fadeFrom = fade;
      fadeTo = 1;
      fadeT0 = now;
    } else {
      fadeFrom = fade;
      fadeTo = 0;
      fadeT0 = now;
    }

    if (still) {
      // Reduced motion / embed previews: snap and paint one frame.
      for (const th of pool) if (th.to) th.cur = { ...th.to };
      tweening = false;
      fade = fadeTo;
      draw(4.2);
      return;
    }
    kick();
  }

  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    themeObs.disconnect();
    canvas.remove();
  }

  return { setScene, destroy };
}
