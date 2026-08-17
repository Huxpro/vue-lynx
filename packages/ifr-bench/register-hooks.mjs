// Registers the module-resolution hook so that vue-lynx dist files can be
// imported in plain Node. The shipped dist references bare specifiers
// ('vue-lynx/internal/ops', 'vue-lynx') that are normally aliased by the
// rspeedy plugin / vitest configs; this mirrors those aliases.
//
// Also installs the build-time defines that rsbuild would substitute, and a
// minimal `lynx` global (flush.ts references it as a bare identifier).
import { register } from 'node:module';

globalThis.__DEV__ = false;
globalThis.__VUE_OPTIONS_API__ = true;
globalThis.__VUE_PROD_DEVTOOLS__ = false;
globalThis.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
globalThis.__VUE_LYNX_AUTO_PIXEL_UNIT__ = true;
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

register('./resolve-hooks.mjs', import.meta.url);
