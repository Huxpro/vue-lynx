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
