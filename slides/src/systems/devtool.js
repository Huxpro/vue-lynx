// =============================================================================
// DevTool — a foldable inspector panel (à la hux.pro / Next.js devtools).
// Observes the deck's global config + the current slide's flags & metadata,
// and lets you live-override the flags. Toggle with `d` or the palette.
// =============================================================================

import './systems.css';
import { FLAG_SPEC } from './flags.js';
import { icon } from './icons.js';

const yn = (b, lang) => (lang === 'zh' ? (b ? '是' : '否') : (b ? 'yes' : 'no'));

export function initDevtool(api) {
  if (api.embed()) return null;

  const root = document.createElement('div');
  root.className = 'dt sys-surface sys-hidden';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'DevTool');
  document.body.appendChild(root);

  let open = false;

  function row(k, v, soft) {
    return `<div class="dt__row"><span class="dt__k">${k}</span>` +
      `<span class="dt__v${soft ? ' dt__v--soft' : ''}">${v}</span></div>`;
  }

  function flagRow(key) {
    const spec = FLAG_SPEC[key];
    const val = api.flags()[key];
    const overridden = api.hasOverride(current(), key);
    return `<div class="dt__row"><span class="dt__k">${spec.label}</span>` +
      `<button class="dt__chip" data-flag="${key}" data-overridden="${overridden}" ` +
      `title="${spec.desc} — click to cycle">${val}</button></div>`;
  }

  const current = () => api.current();

  function render() {
    const lang = api.lang();
    const i = current();
    const meta = api.meta()[i] || {};
    const slide = api.slideEl(i);
    const flips = slide
      ? [...slide.querySelectorAll('[data-flip]')].map((e) => e.getAttribute('data-flip'))
      : [];
    const scale = api.stageScale();

    root.innerHTML =
      `<div class="dt__head">${icon('bug')}<span class="dt__title">DevTool</span>` +
      `<span class="dt__badge">DEV</span><span class="dt__spacer"></span>` +
      `<button class="dt__x" data-close aria-label="Close">${'×'}</button></div>` +

      `<div class="dt__body">` +
        `<section class="dt__sec"><div class="dt__sec-h">Global</div>` +
          row('theme', api.theme()) +
          row('language', lang) +
          row('slide', `${i + 1} / ${api.total()}`) +
          row('title', meta.title || '—', true) +
          row('stage scale', `${scale.toFixed(2)}×`) +
          row('reduced motion', yn(api.reducedMotion(), lang)) +
        `</section>` +
        `<section class="dt__sec"><div class="dt__sec-h">This slide · flags</div>` +
          flagRow('bg') + flagRow('transition') + flagRow('chrome') +
          row('notes', yn(!!(meta.notes && meta.notes.trim()), lang)) +
          row('flips', flips.length ? flips.join(', ') : '—') +
        `</section>` +
      `</div>` +

      `<div class="dt__foot"><span>press ` +
        `<span class="sys-kbd">d</span> to toggle</span>` +
        `<button class="dt__reset" data-reset>reset overrides</button></div>`;
  }

  function refresh() { if (open) render(); }

  function show() {
    open = true;
    render();
    root.classList.remove('sys-hidden');
  }
  function hide() { open = false; root.classList.add('sys-hidden'); }
  function toggle() { open ? hide() : show(); }

  // Delegated clicks inside the panel
  root.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-close]')) { hide(); return; }
    if (t.closest('[data-reset]')) { api.clearFlags(current()); render(); return; }
    const chip = t.closest('[data-flag]');
    if (chip) {
      const key = chip.getAttribute('data-flag');
      const values = FLAG_SPEC[key].values;
      const cur = api.flags()[key];
      const next = values[(values.indexOf(cur) + 1) % values.length];
      api.setFlag(key, next);
      render();
    }
  });

  document.addEventListener('deck:change', refresh);

  // `d` toggles the panel (unless typing or the palette is open)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'd' && e.key !== 'D') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target;
    if (el.matches?.('input, textarea, [contenteditable]')) return;
    if (document.querySelector('.cmdk')) return; // palette open
    e.preventDefault();
    toggle();
  });

  return { toggle, open: show, close: hide, isOpen: () => open };
}
