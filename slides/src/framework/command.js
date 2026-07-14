// =============================================================================
// Command Palette — ⌘K / Ctrl-K to open, `/` for slash-command mode (single
// key runs an action), Esc to close. Vanilla port of hux.pro's cmdk palette
// in the deck's design language. Drives navigation + presenter + settings.
// =============================================================================

import './framework.css';
import { icon } from './icons.js';

export function initCommand(api, { devtool } = {}) {
  if (api.embed()) return null;

  // Action = { section, key, label, icon, run }. `label` may be a function.
  const ACTIONS = [
    { section: 'Navigate', key: 'n', label: 'Next slide', icon: 'arrowRight', run: api.next },
    { section: 'Navigate', key: 'p', label: 'Previous slide', icon: 'arrowLeft', run: api.prev },
    { section: 'Navigate', key: '[', label: 'First slide', icon: 'first', run: api.first },
    { section: 'Navigate', key: ']', label: 'Last slide', icon: 'last', run: api.last },

    { section: 'Presenter', key: 's', label: 'Open Speaker View', icon: 'present', run: api.openSpeaker },
    { section: 'Presenter', key: 'o', label: () => `Overview: ${api.overview() ? 'on' : 'off'}`, icon: 'grid', run: api.toggleOverview },
    { section: 'Presenter', key: 'b', label: () => `Blackout: ${api.isBlackout() ? 'on' : 'off'}`, icon: 'eye', run: api.blackout },
    { section: 'Presenter', key: 'f', label: 'Toggle fullscreen', icon: 'maximize', run: api.fullscreen },

    { section: 'Settings', key: 't', label: () => `Theme: ${api.theme()}`, icon: 'moon', run: api.toggleTheme },
    { section: 'Settings', key: 'l', label: () => `Language: ${api.lang() === 'zh' ? '中文' : 'English'}`, icon: 'languages', run: api.toggleLang },
    { section: 'Settings', key: 'g', label: () => `Background: ${api.flags().bg}`, icon: 'layers', run: () => api.setFlag('bg', api.flags().bg === 'beam' ? 'clean' : 'beam') },
    { section: 'Settings', key: 'd', label: 'Toggle DevTool', icon: 'bug', run: () => devtool?.toggle() },
  ];

  const resolveLabel = (a) => (typeof a.label === 'function' ? a.label() : a.label);

  function slideActions() {
    return api.meta().map((m, i) => ({
      section: 'Slides',
      icon: 'hash',
      label: `${String(i + 1).padStart(2, '0')} · ${m.title || 'Untitled'}`,
      run: () => api.goto(i),
    }));
  }

  let overlay = null;
  let slash = false;
  let query = '';
  let items = [];
  let selected = 0;

  function visibleActions() {
    const all = [...ACTIONS, ...slideActions()];
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter((a) => resolveLabel(a).toLowerCase().includes(q));
  }

  function render() {
    if (!overlay) return;
    items = visibleActions();
    if (selected >= items.length) selected = Math.max(0, items.length - 1);

    const list = overlay.querySelector('.cmdk__list');
    if (!items.length) {
      list.innerHTML = `<div class="cmdk__empty">No commands</div>`;
      return;
    }
    let html = '';
    let section = null;
    items.forEach((a, idx) => {
      if (a.section !== section) {
        section = a.section;
        html += `<div class="cmdk__section">${section}</div>`;
      }
      html += `<div class="cmdk__item" role="option" data-idx="${idx}" ` +
        `aria-selected="${idx === selected}">${icon(a.icon)}` +
        `<span class="cmdk__label">${resolveLabel(a)}</span>` +
        (a.key ? `<span class="cmdk__hint">${a.key}</span>` : '') + `</div>`;
    });
    list.innerHTML = html;
    const sel = list.querySelector('[aria-selected="true"]');
    sel?.scrollIntoView({ block: 'nearest' });
  }

  function run(action) {
    close();
    action?.run?.();
  }

  function open(slashMode = false) {
    if (overlay) { if (slashMode) setSlash(true); return; }
    slash = slashMode;
    query = '';
    selected = 0;
    overlay = document.createElement('div');
    overlay.className = 'cmdk';
    overlay.innerHTML =
      `<div class="cmdk__scrim" data-scrim></div>` +
      `<div class="cmdk__box sys-surface">` +
        `<div class="cmdk__inputrow">${icon('search')}` +
          `<input class="cmdk__input" type="text" placeholder="Type a command…" ` +
          `autocomplete="off" spellcheck="false" />` +
          `<span class="cmdk__slashbadge" data-slash hidden>slash</span></div>` +
        `<div class="cmdk__list" role="listbox"></div>` +
      `</div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('[data-scrim]').addEventListener('pointerdown', close);
    const input = overlay.querySelector('.cmdk__input');
    input.addEventListener('input', () => {
      if (input.value === '/' && query === '') { input.value = ''; setSlash(true); return; }
      query = input.value;
      selected = 0;
      render();
    });
    overlay.querySelector('.cmdk__list').addEventListener('pointerdown', (e) => {
      const it = e.target.closest('[data-idx]');
      if (it) run(items[Number(it.dataset.idx)]);
    });

    setSlash(slash);
    render();
    if (!slash) setTimeout(() => input.focus(), 30);
  }

  function setSlash(on) {
    slash = on;
    if (!overlay) return;
    const badge = overlay.querySelector('[data-slash]');
    const input = overlay.querySelector('.cmdk__input');
    badge.hidden = !on;
    input.placeholder = on ? 'Press a key…  (⌫ to search)' : 'Type a command…';
    if (on) input.blur();
    else setTimeout(() => input.focus(), 10);
  }

  function close() {
    overlay?.remove();
    overlay = null;
    slash = false;
    query = '';
  }
  function toggle() { overlay ? close() : open(false); }

  // Global keys
  document.addEventListener('keydown', (e) => {
    const el = e.target;
    const typing = el.matches?.('input, textarea, [contenteditable]') && !overlay;

    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault(); toggle(); return;
    }
    if (!overlay) {
      if (e.key === '/' && !typing) { e.preventDefault(); open(true); }
      return;
    }

    // Palette is open — it owns the keyboard.
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }

    // Arrow navigation works in both search and slash modes. The list is a
    // single column, so ←/↑ move to the previous item and →/↓ to the next.
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault(); selected = Math.min(items.length - 1, selected + 1); render(); return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault(); selected = Math.max(0, selected - 1); render(); return;
    }
    if (e.key === 'Enter') { e.preventDefault(); run(items[selected]); return; }

    if (slash) {
      if (e.key === 'Backspace') { e.preventDefault(); setSlash(false); return; }
      if (e.key.length === 1) {
        const a = ACTIONS.find((x) => x.key === e.key.toLowerCase());
        if (a) { e.preventDefault(); run(a); }
      }
      return;
    }
  }, true);

  return { open, close, toggle };
}
