// =========================================================
// Layers & seams diagram — a cross-platform stack split into
// five layers with four "seams" between them. Each framework
// is a vertical spine; every seam is open (extension point),
// half-open (needs adaptation), or welded shut (a wall).
// Rendered from data so the magic-move slides can each show a
// growing subset without duplicating the markup.
//
// Concept + data adapted from Huxpro's "跨端架构 · 分层与开缝".
// =========================================================

const LAYERS = [
  { idx: '01', name: 'Frontend',      refs: 'React · Vue · Svelte · CSS' },
  { idx: '02', name: 'Runtime',       refs: '' },
  { idx: '03', name: 'Render backend', refs: 'DOM · UIKit · Skia' },
  { idx: '04', name: 'Native capability', refs: 'camera · sensors · AI' },
  { idx: '05', name: 'Platform',      refs: 'iOS · Android · TV · XR' },
];

// One seam sits between each pair of layers (EP1..EP4).
const SEAMS = [
  { k: 'EP1', q: 'Plug in any frontend?' },
  { k: 'EP2', q: 'Swap the render model?' },
  { k: 'EP3', q: 'Add native capabilities?' },
  { k: 'EP4', q: 'Reach a brand-new platform?' },
];

// gates: one verdict per seam, in EP1..EP4 order.
//   open = extension point · part = half-open · seal = welded wall
const FW = [
  {
    id: 'web', name: 'Web', color: '#4FB8F0',
    gates: ['open', 'seal', 'seal', 'part'],
    thesis: 'Open on top, sealed below — takes any frontend, but the sandbox welds rendering and capabilities shut.',
  },
  {
    id: 'rn', name: 'React Native', color: '#9E86F0',
    gates: ['part', 'part', 'open', 'part'],
    thesis: 'Capabilities wide open — but the frontend is bound to React, and each new platform is ported by hand.',
  },
  {
    id: 'flutter', name: 'Flutter', color: '#F27A9E',
    gates: ['seal', 'part', 'open', 'open'],
    thesis: 'The bottom half is open — at the cost of a single Dart-only door on top.',
  },
  {
    id: 'ns', name: 'NativeScript', color: '#E8B44A',
    gates: ['part', 'seal', 'open', 'seal'],
    thesis: 'The most direct native access — but rendering and new platforms are both welded shut.',
  },
  {
    id: 'lynx', name: 'Lynx', color: '#5dd5a8', hero: true,
    gates: ['open', 'open', 'open', 'open'],
    thesis: 'The only column with all four seams open — every layer leaves an extension point.',
  },
];

// Chinese overrides for layer names + seam questions (framework
// names and reference chips stay as-is).
const ZH = {
  layers: ['前端', '运行时', '渲染后端', '原生能力', '平台'],
  seams: ['能接入任意前端?', '能替换渲染模型?', '能新增原生能力?', '能上一个全新平台?'],
};

const SCORE = { open: 2, part: 1, seal: 0 };
function scoreOf(gates) {
  const t = gates.reduce((a, g) => a + SCORE[g], 0);
  const whole = Math.floor(t / 2);
  const half = t % 2 ? '½' : '';
  return `${whole || (half ? '' : '0')}${half}`;
}

// Geometry — nine evenly spaced slots: layers on even slots,
// seams on odd slots. Percentages are relative to the .arch box.
const slot = (j) => ((j + 0.5) / 9) * 100;
const layerY = (i) => slot(2 * i);
const seamY = (s) => slot(2 * s + 1);
const colX = (c) => 34 + c * 14.5;

function el(tag, cls, css) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) e.style.cssText = css;
  return e;
}

export function renderArch(mount, lang = 'en') {
  const shown = Math.max(0, Math.min(FW.length, parseInt(mount.dataset.archShown || '0', 10)));
  const zh = lang === 'zh';
  const arch = el('div', 'arch');
  arch.setAttribute('data-flip', 'arch');

  // layer bands
  LAYERS.forEach((L, i) => {
    const name = zh ? ZH.layers[i] : L.name;
    const band = el('div', 'arch__layer', `top:${layerY(i)}%`);
    band.innerHTML =
      `<span class="arch__lname"><b>${L.idx}</b>${name}</span>` +
      (L.refs ? `<span class="arch__refs">${L.refs}</span>` : '');
    arch.append(band);
  });

  // seam lines + questions
  SEAMS.forEach((s, i) => {
    const q = zh ? ZH.seams[i] : s.q;
    const seam = el('div', 'arch__seam', `top:${seamY(i)}%`);
    seam.innerHTML =
      `<span class="arch__seamlab"><span class="arch__ep">${s.k}</span>` +
      `<span class="arch__q">${q}</span></span>`;
    arch.append(seam);
  });

  // framework columns (spine + node + four gates), left→right
  FW.slice(0, shown).forEach((f, c) => {
    const isNew = c === shown - 1;
    const heroCls = f.hero ? ' is-hero' : '';
    const fade = isNew ? 'data-mm-fade' : '';

    const spine = el('div', `arch__spine${heroCls}`, `left:${colX(c)}%;--fwc:${f.color}`);
    if (isNew) spine.setAttribute('data-mm-fade', '');
    arch.append(spine);

    const node = el('div', `arch__node${heroCls}`,
      `left:${colX(c)}%;top:${layerY(1)}%;--fwc:${f.color}`);
    node.innerHTML =
      `<span class="arch__nname">${f.name}</span>` +
      `<span class="arch__nscore">${scoreOf(f.gates)}/4</span>`;
    if (isNew) node.setAttribute('data-mm-fade', '');
    arch.append(node);

    f.gates.forEach((g, si) => {
      const gate = el('div', `gate gate--${g}${heroCls}`,
        `left:${colX(c)}%;top:${seamY(si)}%;--fwc:${f.color}`);
      if (isNew) gate.setAttribute('data-mm-fade', '');
      arch.append(gate);
    });
  });

  mount.replaceChildren(arch);
}

export function initArch(lang = 'en', root = document) {
  root.querySelectorAll('.arch-mount').forEach((m) => renderArch(m, lang));
}
