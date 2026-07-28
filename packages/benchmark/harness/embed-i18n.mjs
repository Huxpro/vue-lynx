/**
 * Runtime i18n helper for embedded benchmark HTML.
 * Mark nodes with data-i18n="key"; call __benchApplyLang('zh'|'en').
 */
export function runtimeI18nScript(dictionary) {
  return `
window.__BENCH_I18N = ${JSON.stringify(dictionary)};
window.__benchApplyLang = function (lang) {
  var pack = window.__BENCH_I18N[lang] || window.__BENCH_I18N.en;
  if (!pack) return;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (pack[k] != null) el.innerHTML = pack[k];
  });
  if (pack.title) document.title = pack.title;
};
`;
}
