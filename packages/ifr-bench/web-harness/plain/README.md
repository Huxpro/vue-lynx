# Plain-web (single-threaded) baselines

Vanilla DOM-rendering counterparts of the benchmarked Lynx screens, used by
`run-browser.mjs` to separate the dual-thread cost from the platform-layer
cost (VERIFICATION.md, Experiment C).

| file | contents |
|---|---|
| `vue-app.js` | hello-world screen (14 nodes) with vanilla `@vue/runtime-dom` |
| `vue-framework.js` | `@vue/runtime-dom@3.5.30` `dist/runtime-dom.global.prod.js` (global `VueRuntimeDOM`), vendored from the repo's pnpm store |
| `preact-app.js` | rl-probe screen (85 nodes); sets `preact.options.document = document` because the fork resolves the document through `options` |
| `preact-framework.js` | `@hongzhiyuan/preact@10.28.0-fc4af453` `dist/preact.min.js` (global `self.preact`) — the exact preact fork ReactLynx runs on, vendored from `rl-probe/node_modules` |
| `*-cold.js` | generated at run time: framework+app concatenated, fetched after t0 (models the framework living inside the `.web.bundle`) |

Query format (index.html): `?plain=<app.js>&pre=<framework.js>` — `pre` is
evaluated before t0 (warm); omit it and use a concatenated file for cold.
