---
"vue-lynx": minor
---

feat: support `<style scoped>` in Vue SFCs (#78)

Bridges Vue's scoped CSS to Lynx's native `cssId` system:

- Build-time: `VueScopedCSSIdPlugin` injects `?cssId=<N>` into vue scoped style module queries so `@lynx-js/css-extract-webpack-plugin` wraps CSS in `@cssId`
- Build-time: `vueScopeStripCSSPlugin` removes `[data-v-xxx]` attribute selectors (unsupported by Lynx CSS engine)
- Runtime: `scope-bridge.ts` converts `__scopeId` to numeric cssId and calls `__SetCSSId` on elements
