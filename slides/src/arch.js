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
  { idx: '01', name: 'Frontend',          icons: ['react', 'vue', 'svelte', 'css'] },
  { idx: '02', name: 'Runtime',           icons: [] },
  { idx: '03', name: 'Render backend',    icons: ['dom', 'apple', 'skia'] },
  { idx: '04', name: 'Native capability', icons: ['camera', 'sensor', 'ai'] },
  { idx: '05', name: 'Platform',          icons: ['apple', 'android', 'tv', 'xr'] },
];

// Logo mark for each framework node (rendered in the column's accent colour).
const FW_LOGO = { web: 'globe', rn: 'react', flutter: 'flutter', ns: 'ns', lynx: 'lynx' };

// Brand colours for the layer reference icons (others fall back to muted).
const BRAND = {
  react: '#61DAFB', vue: '#42B883', svelte: '#FF3E00', css: '#3C9CD7',
  android: '#3DDC84',
};

// Inline SVG marks — brand logos where recognizable, clean glyphs otherwise.
const ICON = {
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.7 2.6 2.7 15.4 0 18M12 3c-2.7 2.6-2.7 15.4 0 18"/></svg>`,
  react: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.8" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="1"><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></g></svg>`,
  vue: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 3.5h4.1L12 13.3 17.9 3.5H22L12 20.6z"/><path d="M6.6 3.5h3L12 7.7l2.4-4.2h3L12 12.7z" opacity=".5"/></svg>`,
  svelte: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.9c-.5 3-3 4.1-4.6 6.3-1.7 2.4-1 5 1.3 6 .9.4 1.9.7 1.5 1.7-.2.6-1 .8-1.6.4 1 2.1 3.7 2.8 5.7 1.5 2.4-1.5 2.9-4.7 1.1-6.6-.8-.9-2-1.2-1.6-2.3.2-.6 1-.8 1.6-.4C16.5 6.6 14.7 3.4 12 1.9z"/></svg>`,
  css: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H7.5A2.5 2.5 0 0 0 5 5.5V8a2 2 0 0 1-2 2 2 2 0 0 1 2 2v2.5A2.5 2.5 0 0 0 7.5 19H9M15 3h1.5A2.5 2.5 0 0 1 19 5.5V8a2 2 0 0 0 2 2 2 2 0 0 0-2 2v2.5a2.5 2.5 0 0 1-2.5 2.5H15"/></svg>`,
  dom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4M13.2 5l-2.4 14"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.5c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.98.9-3.77 2.29-1.61 2.8-.41 6.95 1.15 9.22.76 1.11 1.67 2.36 2.87 2.31 1.15-.05 1.58-.74 2.97-.74 1.39 0 1.78.74 3 .72 1.24-.02 2.02-1.13 2.78-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.44-3.7zM14.77 5.9c.64-.77 1.07-1.85.95-2.9-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.71-1.31z"/></svg>`,
  skia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3c3.4 4 6 7 6 9.8A6 6 0 0 1 6 12.8C6 10 8.6 7 12 3z"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 8a1 1 0 0 1 1-1h2.5l1.3-1.8h6.4L15.5 7H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="12" cy="12.5" r="3.2"/></svg>`,
  sensor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="14.5" r="1.8"/><path d="M8.6 11.1a4.8 4.8 0 0 1 6.8 0M6 8.5a8.5 8.5 0 0 1 12 0"/></svg>`,
  ai: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 4.6L18 8l-4.3 1.4L12 14l-1.7-4.6L6 8l4.3-1.4zM18.5 14l.9 2.4 2.6.9-2.6.9-.9 2.4-.9-2.4-2.6-.9 2.6-.9z"/></svg>`,
  android: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 9.5v6.9c0 .5.4.9.9.9H8v2.6a1 1 0 0 0 2 0V17.3h4v2.6a1 1 0 0 0 2 0V17.3h1.1c.5 0 .9-.4.9-.9V9.5zM4.3 9.4a1 1 0 0 0-1 1v4.4a1 1 0 0 0 2 0v-4.4a1 1 0 0 0-1-1zm15.4 0a1 1 0 0 0-1 1v4.4a1 1 0 0 0 2 0v-4.4a1 1 0 0 0-1-1zM15.4 4.9l1-1.6a.4.4 0 1 0-.7-.4l-1 1.7a6 6 0 0 0-4.4 0l-1-1.7a.4.4 0 1 0-.7.4l1 1.6A5.3 5.3 0 0 0 6.4 8.5h11.2a5.3 5.3 0 0 0-2.2-3.6zM9.6 7a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4zm4.8 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z"/></svg>`,
  tv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 3.5l4 3.5 4-3.5"/></svg>`,
  xr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 9h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-3.5l-1.8-2h-3.4L9.5 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z"/></svg>`,
  flutter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.3 0 2.3 12l3.7 3.7L21.7 0zM14.3 11.1l-6.4 6.4L14.3 24h7.4l-6.4-6.5 6.4-6.4z"/></svg>`,
  ns: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="5" stroke-width="1.7"/><path d="M8.5 16V8l7 8V8" stroke-width="1.9" stroke-linejoin="round"/></svg>`,
  // Official Lynx mark from lynxjs.org (lynx-*-logo.svg), recoloured to inherit.
  lynx: `<svg viewBox="0 0 27 28" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.56542 6.19594L3.90642 8.7164C3.50877 8.99031 3.23346 9.40191 3.13675 9.86708L2.77902 11.5878C2.76005 11.679 2.71799 11.7642 2.65665 11.8355L0.996306 14.0121C0.772761 14.2722 0.778152 14.9632 1.39044 15.4057C1.62523 15.6103 1.93915 16.0691 2.29622 16.591C3.05224 17.6959 4.00169 19.0836 4.80312 18.9394C5.9372 18.541 7.32544 18.4135 8.39128 18.9394C10.4632 20.7282 9.95449 22.3775 9.22514 24.7421C8.93165 25.6936 8.60243 26.7609 8.39128 27.9997C9.38643 24.3777 11.6242 20.1711 15.6592 18.7437C14.9322 18.1498 13.4486 17.5981 12.1357 17.4653C12.1357 17.4653 16.1691 14.0121 21.1439 12.4254C17.671 4.16205 11.9386 0.213095 11.9386 0.213095C11.6465 -0.148197 11.0566 -0.0296711 10.9349 0.414774C10.8371 1.72112 10.675 2.60942 10.4074 3.44676L8.39128 1.12029C8.18068 0.866399 7.75965 1.013 7.76176 1.33949C8.10312 3.23719 8.05521 4.30239 7.56542 6.19594ZM8.9846 6.02248L8.99663 6.02171C9.02298 6.02002 9.0489 6.01659 9.07424 6.01153L8.9846 6.02248ZM11.7123 1.7617C13.094 4.1491 13.7199 5.5054 13.9322 8.03659C12.4625 7.2017 11.8221 6.98923 10.7413 6.99451C11.3718 5.0773 11.5644 3.92284 11.7123 1.7617Z"/><path d="M20.5916 19.4929C14.9639 20.7806 11.7672 22.7198 9.32227 28.0001C13.7111 20.6367 26.9966 21.9536 26.9966 21.9536C26.7484 20.7508 24.1069 18.4571 22.3696 17.0503C22.3696 17.0503 23.7712 15.3272 26.8697 14.455C26.8697 14.455 20.9125 14.8002 17.4445 16.6727C18.568 17.2656 20.0071 18.2663 20.5916 19.4929Z"/></svg>`,
};

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
const colX = (c) => 32 + c * 12; // columns 32–80%, leaving a right gutter for icon rows

function iconRow(keys) {
  if (!keys || keys.length === 0) return '';
  const items = keys
    .map((k) => {
      const svg = ICON[k] || '';
      const color = BRAND[k] ? ` style="color:${BRAND[k]}"` : '';
      return `<i${color} aria-label="${k}">${svg}</i>`;
    })
    .join('');
  return `<span class="arch__refs">${items}</span>`;
}

function el(tag, cls, css) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) e.style.cssText = css;
  return e;
}

export function renderArch(mount, lang = 'en') {
  const shown = Math.max(
    0,
    Math.min(FW.length, Number.parseInt(mount.dataset.archShown || '0', 10)),
  );
  const zh = lang === 'zh';
  const arch = el('div', 'arch');
  arch.setAttribute('data-flip', 'arch');

  // layer bands
  LAYERS.forEach((L, i) => {
    const name = zh ? ZH.layers[i] : L.name;
    const band = el('div', 'arch__layer', `top:${layerY(i)}%`);
    band.innerHTML =
      `<span class="arch__lname"><b>${L.idx}</b>${name}</span>` + iconRow(L.icons);
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
    const spine = el('div', `arch__spine${heroCls}`, `left:${colX(c)}%;--fwc:${f.color}`);
    if (isNew) spine.setAttribute('data-mm-fade', '');
    arch.append(spine);

    const node = el('div', `arch__node${heroCls}`,
      `left:${colX(c)}%;top:${layerY(1)}%;--fwc:${f.color}`);
    node.innerHTML =
      `<span class="arch__nlogo">${ICON[FW_LOGO[f.id]] || ''}</span>` +
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
