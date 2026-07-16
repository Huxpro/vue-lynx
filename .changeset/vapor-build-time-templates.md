---
"vue-lynx": patch
---

Vapor build-time structured templates (issue #234, Part A), behind the new
`vaporBuildTimeTemplates` plugin flag (opt-in, requires `vapor: true`).

`@vue/compiler-vapor` serializes static template structure as minified HTML
strings that the Background Thread parses at startup. With the flag on, a
build-time transform parses each `template("<html>", …)` call during the build
and rewrites it to the structured form `template([<VaporTemplateIR>], …)`. The
runtime rebuilds the inert template prototype directly from that data —
producing a byte-identical REGISTER_TEMPLATE payload and the same deterministic
pre-order uid contract as the string path — so the per-template HTML parse is
skipped at startup and the HTML-dialect risk surface (void elements,
auto-closing, entity escapes) no longer needs to be replicated at runtime.

The runtime `template()` still accepts the HTML-string form, so precompiled
third-party Vapor code (and builds with the flag off) are unaffected; the
node_modules boundary is preserved by the transform. A new upstream-tests spec
compiles real SFCs and asserts the structured path emits an op stream identical
(up to a uid offset) to the string path.

Also adds `vaporNormalizeEventDialect` (issue #234, Part B): a template-compiler
`nodeTransform` that rewrites statically-written ReactLynx dialect props to
their `v-on` equivalent at compile time — `:bindtap="fn"` → `on(el, 'tap', fn)`,
`:catchtap="fn"` → `on(el, 'tap', withModifiers(fn, ['stop']))` — i.e. the exact
code the native `@tap` / `@tap.stop` sugar already produces. This moves the #219
class of bug ("a new pipeline forgets to intercept event props") from runtime
discipline to a compile-time guarantee. The `ShadowElement.setAttribute`
chokepoint stays as the safety net for dynamic keys, v-bind spreads, and
precompiled code; `global-bind*`/`global-catch*` and `main-thread-*` are left to
it. (Part C — the `setProp` `key in el` probe skip — is not included.)
