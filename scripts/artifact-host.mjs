/**
 * Shared helpers for self-contained HTML artifacts embedded in the docs site.
 *
 * Artifacts listen for parent theme/lang via query params + postMessage, and
 * render bilingual copy with `.i18n-en` / `.i18n-zh` dual nodes.
 */

export const ARTIFACT_HOST_MESSAGE = 'vue-lynx:artifact-host';

/** Escape text for HTML text nodes / attributes. */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Dual-language HTML span pair (plain text). */
export function t(en, zh) {
  return `<span class="i18n-en">${esc(en)}</span><span class="i18n-zh">${esc(zh)}</span>`;
}

/** Dual-language HTML span pair (trusted HTML fragments). */
export function tHtml(en, zh) {
  return `<span class="i18n-en">${en}</span><span class="i18n-zh">${zh}</span>`;
}

/**
 * Dual-language SVG <text> pair. `attrs` is the shared attribute string
 * (x/y/text-anchor/transform/…).
 */
export function tSvg(attrs, en, zh) {
  const a = attrs ? ` ${attrs}` : '';
  return `<text${a} class="i18n-en">${esc(en)}</text><text${a} class="i18n-zh">${esc(zh)}</text>`;
}

/** CSS that toggles bilingual nodes from <html lang>. */
export const ARTIFACT_I18N_CSS = `
  .i18n-zh { display: none; }
  html[lang="zh"] .i18n-en { display: none; }
  html[lang="zh"] .i18n-zh { display: inline; }
  html[lang="zh"] p .i18n-zh,
  html[lang="zh"] h1 .i18n-zh,
  html[lang="zh"] h2 .i18n-zh,
  html[lang="zh"] h3 .i18n-zh,
  html[lang="zh"] li .i18n-zh,
  html[lang="zh"] td .i18n-zh,
  html[lang="zh"] th .i18n-zh,
  html[lang="zh"] .sub .i18n-zh,
  html[lang="zh"] .lede .i18n-zh { display: inline; }
  html[lang="zh"] .i18n-zh.i18n-block { display: block; }
  /* SVG text: toggle whole nodes */
  text.i18n-zh { display: none; }
  html[lang="zh"] text.i18n-en { display: none; }
  html[lang="zh"] text.i18n-zh { display: inherit; }
`;

/**
 * Inline bootstrap: apply theme/lang from URL, then listen for parent messages.
 * Safe to embed in <script> without further escaping (no user input).
 */
export function artifactHostScript() {
  return `(() => {
  const MSG = ${JSON.stringify(ARTIFACT_HOST_MESSAGE)};
  const root = document.documentElement;
  function applyTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  }
  function applyLang(lang) {
    if (lang !== 'zh' && lang !== 'en') return;
    root.lang = lang;
  }
  function fromQuery() {
    try {
      const q = new URLSearchParams(location.search);
      const theme = q.get('theme');
      const lang = q.get('lang');
      if (theme) applyTheme(theme);
      if (lang) applyLang(lang);
    } catch (_) {}
  }
  // Standalone open: prefer explicit query, else follow OS preference for theme.
  if (!root.hasAttribute('data-theme')) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
  fromQuery();
  window.addEventListener('message', (event) => {
    const data = event && event.data;
    if (!data || data.type !== MSG) return;
    if (data.theme) applyTheme(data.theme);
    if (data.lang) applyLang(data.lang);
  });
  // Tell parent we are ready so it can re-send the current prefs.
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: MSG, ready: true }, '*');
    }
  } catch (_) {}
})();`;
}
