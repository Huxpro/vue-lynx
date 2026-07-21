# PR #209 review: scoped-CSS redesign, merge decision, protocol cleanup

Date: 2026-07-15. Follow-up to `0709-1-vapor-mode-support.md` and
`0418-vue-scoped-css-cssid.md`. Companion docs from the same arc:
`0715-2-website-renderer-switch-ux.md`, `0715-3-vapor-entry-rename.md`,
`0715-4-verification-hardening-assetprefix.md`.

## Goal

Review PR #209 (`codex/pr195-native-scoped-css`, stacked on the Vapor
branch): is the scoped-CSS redesign correct and consistent with our Vapor
architecture, and is its website/verification work sound?

## Verdict

**Core scoped CSS: accepted, judged an improvement over our design.**
Our original approach pushed Vue's `data-v-*` scope ids through a
dedicated `SET_SCOPE_ID` op onto native `__SetCSSId`. That was wrong:
`__SetCSSId` is single-valued, so scope ids couldn't compose with each
other or with class-based styling. The PR's redesign — scope tokens as
ordinary classes (`_scopeClasses` merged in `resolveClass`) with a
build-time rewrite of `[data-v-*]` attribute selectors to class
selectors — flows through the merge point ShadowElement already owns,
stays entirely on the BG side, and leaves the ops stream untouched.

**Example-verification tooling: works, kept, with reservations** (see
`0715-4` for the defects the reruns surfaced later). Noted at review
time: coupled pnpm patches (the go-web `key={src}` remount provokes the
crash the web-core patch silences), `vapor-overlay.mjs` duplicating the
benchmark's vapor generator, regex whole-file config rewriting, a
hard-coded 45-entry count in `verify-status`, grep-over-source tests.

**Website switch: rejected in place, rebuilt by us.** The advertised
localStorage persistence didn't exist (URL param only, dropped on the
first client-side navigation); the control rendered on every page
including API references; `__example-harness` leaked into routes and
search; `prepare-examples` hard-crashed without `vapor-support.json`;
and fresh checkouts (including Vercel) never built `dist-vapor/`, so
the switch was a silent no-op under production conditions. See `0715-2`.

**Merge decision:** merge #209 into the (still-draft) Vapor branch and
fix forward — both the protocol cleanup and the switch rebuild were
cheaper to do ourselves than to round-trip with the contributor, and
nothing broken could reach `main`.

## Protocol cleanup — opcode 14 retired, never reused

The PR left the old cssId pathway declared in `internal/ops.ts`
(`SET_SCOPE_ID` in the OP enum, `sc` in `TemplateNodeProps`) with dead
handlers on the MT and an orphaned `runtime/scope-bridge.ts`. That
violates the single-source protocol invariant (ops.ts is the one spec
both threads share — drift there desyncs uids silently).

Removed: the opcode, the `sc` template prop, both dead MT handlers,
`scope-bridge.ts`, and a stale hand-written `internal/src/ops.d.ts` that
shadowed `ops.ts`. **Opcode 14 is reserved, not renumbered** — old
bundles must stay unambiguous. Test decoders and the benchmark arity
table were updated to match; the whole cleanup was covered by the
existing scoped-CSS tests plus the four suites staying green.

## Open questions raised at review (tracked, not blockers)

- The PR's MT text anchors are heavier (`__CreateView` + per-`SET_TEXT`
  `display` toggling) — the vdom-vs-vapor benchmark numbers predate this
  and may shift; consider a rerun.
- `main-thread:*` props on `_inert` template prototypes fall through to
  plain attributes — probably unreachable, untested.
- Class-based scoping presumably requires `enableCSSSelector: true`;
  the `false` combination is neither guarded nor documented.
