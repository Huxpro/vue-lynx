---
"vue-lynx": patch
---

Split the Vapor entry: `pluginVueLynx({ vapor: true })` now aliases 'vue'
to `vue-lynx/vapor-app`, a pure Vapor entry with no vdom renderer
(`vue-lynx/with-vapor` remains as a deprecated alias). The vdom renderer is
created lazily and the package declares `sideEffects`, mirroring upstream
Vue's tree-shaking model. Vapor app bundles shrink from +48% to +26% gzip
vs vdom, and first-screen time is now within ~3% of vdom (was +29%).
