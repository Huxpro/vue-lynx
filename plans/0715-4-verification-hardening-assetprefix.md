# Verification hardening + the assetPrefix root cause

Date: 2026-07-15. The full 45-entry verification reruns (forced by the
entry rename, `0715-3`) surfaced four real defects in the pipeline and
one product bug that verification was structurally unable to see. This
doc is the "trust the pipeline" record, in the spirit of `0711-1`'s
correction audit.

## 1. Stale-bundle visual parity

The committed "visual parity passed" results compared a PR-era VDOM
bundle against a freshly built Vapor bundle — **different embedded MT
interpreters** (PR #209 changed text-anchor rendering). hello-world
diffed 2.281%, tailwindcss 0.277%. With both modes rebuilt from the same
runtime: 45/45 entries at 0.000%.

> **Rule:** visual parity is only meaningful when both bundles embed the
> same runtime. Rebuild both sides from current source before comparing;
> a parity number whose two inputs were built at different commits is
> not evidence.

## 2. Worker fetches are invisible to Playwright

The website-toggle step waited for the vapor bundle's network request —
which web-core issues inside its **module worker**, where page-level
network events never fire. The step could never observe the request and
its timeout masked a real crash behind it. Rewritten to assert
observable truth instead of network internals: the badge's effective
mode and the `lynx-view`'s `dist-vapor/` URL.

## 3. Detached-realm crash in web-core 0.20.2 (real user-facing bug)

Remounting an example that is still loading — exactly what the renderer
switch's `key={mode}` does — detaches web-core's hidden iframe realm;
the pending `onMTSScriptsLoaded` callback then calls `loadScript` on a
null `contentDocument` and throws on the live site. This is the same
teardown family the existing pnpm patch only partially covered
(`callDestroyLifetimeFun`). Extended the `@lynx-js/web-core@0.20.2`
patch: `loadScript` parks pending loads when the hosting view is gone
(`!iframe.isConnected || !iframe.contentDocument` → never-settling
promise; the realm is dead, there is nothing left to resolve into).

The verification step counting `pageerror`s as failures is what caught
this — the temptation was to relax the assertion; the right move was to
fix the crash.

## 4. Chromium resolution

`playwright-core`'s guessed browser directory doesn't exist in this
environment; the harness resolvers now accept the stable
`/opt/pw-browsers/chromium` symlink as a candidate.

## The assetPrefix root cause (Vapor images 404 on previews)

Report: "all static images are missing from only the Vapor examples on
the Vercel preview." Chain:

1. Every example hardcoded
   `assetPrefix: https://vue.lynxjs.org/examples/<name>/dist/` — bundles
   always load images from **production**.
2. VDOM assets exist on production (main builds `dist/`); `dist-vapor/`
   does not exist there until the branch merges → every Vapor image
   404s on any non-production deployment. (The overlay's
   `/dist/` → `/dist-vapor/` rewrite worked correctly — the missing half
   was the *host*.)
3. Local verification never caught it: the harness reroutes
   `vue.lynxjs.org/examples/**` back to the local server. **That fixture
   makes verification hermetic and, by the same stroke, structurally
   blind to absolute-URL deployment bugs.** Worth remembering whenever a
   fixture rewrites origins.

Fix: asset URLs stay absolute (Lynx Explorer loads bundles by QR code
and must fetch images from the deployed site) but **follow the
deployment** — previews use `VERCEL_URL`, production and local builds
keep the canonical domain. All 26 example configs updated;
`lynx.config.ts` is in each entry's source graph, so the matrix hashes
were refreshed by a full rerun (45/45 VDOM, 36/9 Vapor, 45/45 parity at
0.000%, website step green).

## Follow-ups

- Harness leftovers from the #209 review: `verify-status`'s hard-coded
  45-entry count; `vapor-overlay.mjs` duplicating the benchmark's vapor
  generator without a GENERATED header; regex whole-file
  `/dist/` → `/dist-vapor/` config rewriting; `verify-web` reusing a
  stale website build; hand-maintained `vapor-adapters` drift hazard.
- Consider a verification mode that does *not* reroute production URLs,
  to catch deployment-shape bugs like the assetPrefix one.
- Consider re-running the vdom-vs-vapor benchmarks: #209's heavier MT
  text anchors may shift creation numbers (also noted in `0715-1`).
