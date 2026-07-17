/**
 * Shared theme/lang bridge for embedded benchmark HTML artifacts.
 * Parent docs postMessage { source: 'vue-lynx-docs', type: 'theme'|'lang', ... }.
 * Also honors ?theme=dark|light and ?lang=en|zh on first load.
 */
export const THEME_BRIDGE_CSS = `
  :root[data-theme="dark"] { color-scheme: dark; }
  :root[data-theme="light"] { color-scheme: light; }
`;

export const THEME_BRIDGE_SCRIPT = `
(function () {
  function applyTheme(t) {
    if (t !== 'dark' && t !== 'light') return;
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
  }
  function applyLang(l) {
    if (l !== 'en' && l !== 'zh') return;
    document.documentElement.setAttribute('lang', l === 'zh' ? 'zh-CN' : 'en');
    if (typeof window.__benchApplyLang === 'function') {
      try { window.__benchApplyLang(l); } catch (_) {}
    }
  }
  var q = new URLSearchParams(location.search);
  applyTheme(q.get('theme'));
  applyLang(q.get('lang'));
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || d.source !== 'vue-lynx-docs') return;
    if (d.type === 'theme') applyTheme(d.theme);
    if (d.type === 'lang') applyLang(d.lang);
  });
  try {
    parent.postMessage({ source: 'vue-lynx-bench', type: 'ready' }, '*');
  } catch (_) {}
})();
`;
