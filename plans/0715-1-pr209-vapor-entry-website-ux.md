# PR #209 review, the `vue-lynx/vapor` entry, and the site-wide renderer switch

Date: 2026-07-15. Follow-up to `0709-1-vapor-mode-support.md` (Vapor
implementation) and `0711-1-cross-framework-benchmark.md` (benchmarks).
This document is the decision record for everything between the benchmark
work and the current branch tip: the review and merge of PR #209, the
protocol cleanup it required, seven design rounds on the website's
VDOM/Vapor switch, the entry rename to `vue-lynx/vapor`, and the
verification-infrastructure hardening that the process forced.

## Goal

1. Review PR #209 (`codex/pr195-native-scoped-css`, stacked on this
   branch): scoped-CSS redesign correctness, consistency with our Vapor
   architecture, and the quality of its website renderer switch.
2. Replace the PR's website switch with one that is honest, persistent,
   and beautiful — the site itself is the Vapor demo.
3. Give the Vapor entry its proper name and a verified, alias-free
   surface.

## 1. PR #209 review — verdict and merge decision

**Core scoped CSS: accepted, judged an improvement.** Our original design
pushed Vue's `data-v-*` scope ids through a dedicated `SET_SCOPE_ID` op
onto native `__SetCSSId`. That was wrong: `__SetCSSId` is single-valued,
so scope ids couldn't compose with each other or with class styling. The
PR's redesign — scope tokens as ordinary classes merged in `resolveClass`,
with a build-time rewrite of `[data-v-*]` attribute selectors to class
selectors — flows through the merge point our ShadowElement design already
owns, stays on the BG side, and leaves the ops stream untouched.

**Website switch: rejected in place, rebuilt by us** (Section 3). The
review found the advertised localStorage persistence didn't exist (URL
param only, dropped on the first client-side navigation), the control
rendered on every page including API references where it did nothing,
`__example-harness` leaked into routes/search, `prepare-examples` hard-
crashed without `vapor-support.json`, and — most damning — fresh checkouts
(including Vercel) never built `dist-vapor/`, so the entire switch was a
silent no-op in production conditions.

**Decision: merge #209 into this branch (still a draft PR), then fix
forward.** Both the protocol cleanup and the switch rebuild were cheaper
to do ourselves than to round-trip; nothing broken could reach `main`.

## 2. Protocol cleanup — opcode 14 retired, never reused

The PR left the old cssId pathway declared in `internal/ops.ts`
(`SET_SCOPE_ID`, `TemplateNodeProps.sc`) and dead handlers on the MT.
That violates the repo's single-source protocol invariant (ops.ts is the
one spec both threads share). We removed the op, the `sc` template prop,
the dead MT handlers, and the orphaned `scope-bridge.ts` — and **reserved
opcode 14** rather than renumbering, so any old bundle stays unambiguous.

## 3. The renderer switch — design arc and key decisions

The switch went through seven rounds. The stable end state:

- **State**: one `render-mode-store` (localStorage-persisted, SSR-safe,
  `?go-mode=` as a deep-link override that never overwrites the stored
  preference). Every handle — nav switch, per-example badge, ModeTabs —
  drives this one store; a spec test enforces that no component creates
  its own.
- **Form**: a single on/off switch (`role="switch"`), VDOM = off. The
  active mode name lives in the track's free space ("VDOM" right of the
  knob when off; "Vapor" left of it when on). In Vapor state the track
  and the per-example badge fill with the homepage's moving brand
  gradient (same stops and 6s drift as the hero text) — the design
  language is the site's own.
- **Presence**: the control renders on every doc page and dims
  (`data-dormant`, still functional) when the page has nothing to
  switch — popping in and out per page read as broken.
- **Feedback**: everything that actually responds to a flip (example
  cards, ModeTabs) pulses once with a gradient ring; examples that fell
  back stay still. A merged "2/3 ⓘ" chip carries the page's Vapor
  coverage, and its popover explains the number, the switch's scope
  ("prose never changes"), and links to the guide. Fallback badges read
  "VDOM only" with the reason behind an upward-opening ⓘ (title tooltips
  don't exist on touch).
- **Sizing tokens**: track and badge are exactly 22px tall at 10px type;
  the badge's off state uses the same soft-gray material as the off
  track. A `pointer: coarse` rule that inflated only the badge to 26px
  on phones was the root cause of the "they don't look equal" feedback —
  removed.

**Key decision — scope of the switch.** We explicitly rejected forking
prose content on the toggle (the vuejs.org API-preference pattern):
Vapor is experimental, the genuinely divergent content is small by
design ("inside components nothing changes"), and content that silently
varies on hidden state is a documentation anti-pattern at our scale.
The switch's semantic is **renderer preference, not documentation
version**: it changes everything *runnable or compiled* (live examples,
`<ModeTabs>` code groups — two-way synced with the store) and never the
narrative. Quick Start stays vdom-canonical with a pointer. If Vapor
reaches stable and the matrix approaches 45/45, the ModeTabs + store
machinery is already the substrate for a vuejs.org-style upgrade.

**Supporting work in the same arc:** `prepare-examples` now auto-builds
missing `dist-vapor/` exactly like `dist/` (the switch is real on fresh
checkouts); `__example-harness` is excluded from search and llms.txt but
keeps building (verify-web loads it — the entries in
`modifySearchIndexData` must be blanked, not spliced: that array **is**
the runtime page data, and removing entries breaks SSG); the hand-written
45-row support matrix in the guide was replaced by `<VaporSupportMatrix>`
generated from `vapor-support.json` so it can no longer drift; the two
benchmark pages left the sidebar (linked from the guide's Performance
section instead); the Vapor Mode guide gained a live demo up top and
lost its inline API/perf tables in favor of links.

## 4. API reference for the Vapor entry

Added the entry as a fourth typedoc package. Two decisions:

- **`excludeExternals: true`** for this package only: its surface is
  dominated by `@vue/runtime-core`/`@vue/runtime-vapor` re-exports that
  are documented on vuejs.org — and upstream doc comments contain raw
  template markup that breaks MDX compilation (`createKeyedFragment`'s
  example). Curated sidebar shows the ten Lynx-facing APIs; the index
  page explains the re-export policy.
- The zh API mirror must be **cleaned before copying** — stale pages from
  earlier generations survived the en-side clean and kept breaking the
  build.

## 5. `vue-lynx/vapor-app` → `vue-lynx/vapor`

The natural name was occupied by the internal Vapor adapter surface,
which had exactly one consumer (our own tests) — so the app entry took
the good name. Done in two steps: remap `./vapor` to the app entry with
`./vapor-app`/`./with-vapor` as deprecated aliases (commit `d8e470f`),
then remove the aliases entirely and migrate every consumer — overlay
generator, `examples/vapor`, benchmark apps, vitest maps, docs — since
the package has never been published (commit `e0bf798`). The `dist`
filename keeps the historical `vapor-app.js` name; only the subpath is
public API.

`examples/` sources were deliberately migrated in the *second* step
together with a full verification rerun, because `vapor-support.json`
pins each entry's source hash — changing imports without re-running the
45-entry verification would have tripped `verify-status`.

## 6. Verification hardening — what the reruns taught us

Re-running the full pipeline (rebuild both modes from current source →
Chromium-drive all 45 entries → visual parity → `verify-status --update`)
surfaced four real defects:

1. **Stale-bundle parity.** The committed "visual parity passed" numbers
   compared a PR-era VDOM bundle against a freshly built Vapor bundle —
   different embedded MT interpreters (#209 changed text-anchor
   rendering). hello-world diffed 2.28%, tailwindcss 0.28%. With both
   modes rebuilt from the same runtime: 45/45 at 0.000%. **Rule: visual
   parity is only meaningful when both bundles embed the same runtime;
   rebuild both sides before comparing.**
2. **Worker fetches are invisible to Playwright.** The website-toggle
   verification step waited for the vapor bundle's network request —
   which web-core issues inside its module worker, where page-level
   network events never fire. The step could never pass and masked a
   crash behind its timeout. Rewritten to assert observable truth: the
   badge's effective mode and the `lynx-view`'s `dist-vapor/` URL.
3. **Detached-realm crash in web-core 0.20.2.** Remounting an example
   that is still loading (exactly what the switch's `key={mode}` does)
   detaches the hidden iframe realm; the pending `onMTSScriptsLoaded`
   then calls `loadScript` on a null `contentDocument`. Extended the
   existing pnpm patch: park pending loads when the hosting view is
   gone. This was a real user-facing console error on the live site.
4. **Chromium resolution.** `playwright-core`'s guessed build directory
   doesn't exist in this environment; the harness now falls back to the
   stable `/opt/pw-browsers/chromium` symlink.

## 7. Missing Vapor images on Vercel previews — root cause

Every example hardcoded
`assetPrefix: https://vue.lynxjs.org/examples/<name>/dist/`. Bundles
therefore always load images from **production**. VDOM assets exist
there (main builds `dist/`), but `dist-vapor/` doesn't exist on
production until this branch merges — so every Vapor image 404'd on any
non-production deployment. Local verification never caught it because
the harness reroutes `vue.lynxjs.org/examples/**` back to the local
server (a fixture that, by design, masks absolute-URL deployment bugs —
worth remembering).

Fix: asset URLs stay absolute (Lynx Explorer loads bundles by QR code
and must fetch images from the deployed site), but they now **follow the
deployment**: previews use `VERCEL_URL`, production and local builds keep
the canonical domain. All 26 configs updated; `lynx.config.ts` is part of
each entry's source graph, so the matrix hashes were refreshed by a full
verification rerun.

## Current state

- `vue-lynx/vapor` is the only Vapor entry; no aliases anywhere.
- 45/45 VDOM verified, 36 supported / 9 unsupported on Vapor, 45/45
  visual parity at 0.000%, website toggle step green, matrix hashes
  clean.
- Suites: upstream 917, testing-library 107, example-harness 41,
  website go-mode 26.
- The site is the demo: persistent gradient switch, per-example badges,
  ModeTabs, coverage-ⓘ, generated support matrix, Vapor API reference.

## Follow-ups (known, not yet done)

- Harness leftovers from the #209 review: `verify-status`'s hard-coded
  45-entry count; `vapor-overlay.mjs` duplicating the benchmark's
  `generateVaporVariant` without a GENERATED header; regex whole-file
  `/dist/`→`/dist-vapor/` config rewriting.
- `<VaporSupportMatrix>` is client-rendered (fetches the JSON); inject at
  build time if the table should be in static HTML.
- Consider re-running the vdom-vs-vapor benchmark suite: #209's heavier
  MT text anchors (`__CreateView` + per-SET_TEXT display toggling) may
  shift creation numbers.
- If/when the PR #195 branch is renamed, update any docs referencing the
  branch name.
