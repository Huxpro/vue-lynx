# Vapor IFR × Element Templates

**Date:** 2026-07-20

**Status:** Design + milestone-1 implementation

**Parent:** [#230](https://github.com/huxpro/vue-lynx/issues/230) post-merge follow-up
(“Compiler-direct Vapor MT first frame”)

## Goal

Close the remaining FCP gap between shipped Vapor IFR and the
`ifr-block-tpl` / optimistic `ifr-vapor` bounds by giving the **disposable
IFR main-thread paint** an Element-Template-shaped create path: bake a
straight-line `create()` skeleton, name only the holes that the first frame
writes, and discard that sparse naming once Background Vapor takes ownership
with its dense pointer tree.

## Why two naming models exist

The ops ABI already documents the split
(`packages/vue-lynx/internal/src/ops.ts`):

| | **Element Template** (`INSTANTIATE_TEMPLATE`) | **Vapor tree** (`REGISTER_TREE` / `CLONE_TREE`) |
| --- | --- | --- |
| What is named | root + holes only (sparse) | every materialized node, preorder (dense) |
| Why | VDOM block analysis proves the closed dynamic-point set | Vapor codegen addresses nodes by `firstChild` / `nextSibling` navigation the protocol cannot see |
| Lifetime of names | write-only; updates target holes via ordinary `SET_*` | must be kept for the whole update lifetime |
| Who uses it today | VDOM (+ IFR) | Vapor (+ IFR) |

Route C deliberately did **not** port the VDOM `enableElementTemplates`
transform: Vapor already had a static-structure path via TREE ops. That path
optimizes the *cross-thread protocol*, but the IFR main thread still runs the
full Vapor stack — ShadowElement clone, dependency-tracked `renderEffect`s,
registries, and the hydration recorder. After selector deferral, PAPI call
counts match the block-template prototype; the residual cost is that
framework work ([VAPOR-IFR-REPORT](../../../packages/ifr-bench/VAPOR-IFR-REPORT.md)).

## The IFR-only insight

> Vapor is a densely named tree because it needs to keep pointers.
> ET only names holes — write only — and after IFR that naming is discarded.

The IFR main-thread realm is already disposable:

- lifecycle hooks are inert;
- post-handoff MT ops are dropped;
- Background owns the authoritative ShadowElement tree, effects, events, and
  refs after hydration.

So the MT first frame does **not** need dense pointers. It only needs to
paint. Sparse hole naming is enough for that write-only pass. Dense naming
belongs on Background, where Vapor navigation and ongoing updates live.

```text
IFR MT (disposable):  bake create() → write holes → paint → discard sparse map
Background (keeper):  full Vapor clone → dense uids → effects → hydrate / own
```

This is the same composition VDOM already ships (`enableIFR` defaults
`enableElementTemplates`), expressed for a renderer whose *steady-state*
addressing cannot be sparse.

## Target architecture

### Compile / register time

For each Vapor `template()` structure (today a runtime-parsed HTML string →
inert prototype → `REGISTER_TREE` payload; later the structured form from
[#234](https://github.com/huxpro/vue-lynx/issues/234)):

1. Keep `REGISTER_TREE` / `CLONE_TREE` for the Background / steady-state path
   (dense preorder contract unchanged).
2. Also bake an ET-shaped `create(pageUniqueId) → LynxElement[]` that builds
   the same native skeleton with straight-line PAPI.
3. Record which preorder slots are **holes** (nodes the first-frame effects
   will write: dynamic text, class, style, attrs, events).

Milestone 1 bakes (2) from the already-registered `TemplateNode` on the main
thread (no compiler change yet). Later milestones move baking to build time
and emit hole metadata from the template AST / vapor codegen.

### IFR main-thread paint (compiler-direct, later milestones)

```text
setup() runs (deterministic, thread-neutral)
for each template instance:
  handles = create(P)            // no ShadowElement, no REGISTER/CLONE walk
  for hole in holes:
    apply(handles[hole], oneShotValue(ctx))   // no renderEffect wiring
append roots to page
record a hydration manifesto (see below)
seal MT stream
```

No reactive wiring on the disposable tree. Initial hole values are one-shot
reads of setup state — the optimistic `ifr-vapor` prototype already measured
this shape at the PAPI floor.

### Background path (unchanged ownership)

Background mounts real Vapor: inert prototypes, `REGISTER_TREE`, dense
`CLONE_TREE`, `renderEffect`s, event registry, refs, BG-only anchors. This
tree is the keeper.

### Hydration handshake

Sparse MT names and dense BG names do not strcmp-match. Options, in order of
preference:

1. **Structural remapping (goal).** During MT `create()`, retain a temporary
   preorder handle list (all nodes, not only holes). On BG `CLONE_TREE`, map
   `baseUid + k → handles[k]` instead of creating, then reconcile trailing
   `SET_*` as today. Discard the temporary list. Sparse hole indices were
   only used for the write-only paint.
2. **Dual emission (bridge).** MT paints via `create()` but still records
   dense `REGISTER_TREE`/`CLONE_TREE`/`SET_*` frames so today’s deterministic
   replay works unchanged. Wins create() cost; still pays recorder + some
   shadow work unless paint skips ShadowElement entirely.
3. **Tear down + BG replay (fallback only).** Always correct; loses the
   keep-tree property and can flash. Acceptable as the mismatch path, not
   the happy path.

Milestone 1 does **not** change hydration: it only replaces the recursive
`CLONE_TREE` interpreter walk with a baked `create()` that still assigns the
same dense uids — so existing replay hydration keeps working while we prove
the bake.

## Non-goals (this design)

- Porting the VDOM `elementTemplateTransform` onto `@vue/compiler-vapor`
  AST (different IR; VNodeCall lowering does not apply).
- Enabling `enableElementTemplates` for `vapor: true` as a user-facing flag
  until the vapor-specific path exists (VDOM transform is a no-op / misleading
  there).
- Replacing Background dense naming — Vapor updates still need pointers.
- Engine `__ElementFromBinary` / native `elementTemplates` section (same
  follow-up as VDOM ET).

## Phased delivery

| Phase | What | Hydration | Expected win |
| --- | --- | --- | --- |
| **1 (this PR)** | Bake `create()` from `TemplateNode`; `CLONE_TREE` uses it; dense uids unchanged | unchanged replay | small (interpreter → straight-line); plumbing + tests |
| **2** | Build-time structured templates (#234) feed the baker; hole metadata from AST | dual emission or remapping scaffold | MT bundle can drop HTML parser; bake moves off first frame |
| **3** | Compiler-direct IFR MT: skip ShadowElement + `renderEffect`; one-shot holes | structural remapping | close the gap to `ifr-vapor` / block-tpl on jitless + ×4 FCP |
| **4** | Measure `vapor {off, ifr, ifr-et}` in sfc-probe / unified matrix; docs | — | ship criterion |

## Milestone 1 contract

- `bakeTreeCreate(structure) → (pageUniqueId, baseUid) => void` produces the
  same native tree and `elements` map entries as today’s recursive
  `instantiateTemplate`.
- `CLONE_TREE` prefers a cached baked creator per `treeId`.
- Comments / empty text still consume preorder uid slots without creating
  natives (BG-only anchors).
- No public flag change; behavior is an internal MT optimization.
- Tests lock bake ≡ recursive walk on representative structures.

## Risks

- **Lepus `Function` / `eval`:** baking via `new Function` may be unavailable
  or slower to compile on native. Milestone 1 also keeps a closure-walker
  fallback that is still “direct” (no op reinterpretation) if codegen is
  refused; measure before relying on `new Function` in production Lepus.
- **Hole discovery without compiler help:** runtime cannot see which dense
  uids are dynamic until effects emit `SET_*`. Phase 3 needs compile-time
  hole lists; phase 1 does not need them.
- **Bundle size:** build-time baked `create()` sources (phase 2+) grow the MT
  section the same way VDOM ET does — the render-cost hedge, not a size win.
    Measure on the ×4 large-content row where Vapor IFR still regresses.

## References

- VDOM ET: `plans/0711-2-element-templates.md`,
  `runtime/src/element-template.ts`,
  `plugin/src/compiler/element-template-transform.ts`
- Vapor IFR: `docs/superpowers/specs/2026-07-16-vapor-ifr-route-c-design.md`,
  `packages/ifr-bench/VAPOR-IFR-REPORT.md`
- Strategy ladder: `packages/ifr-bench/REPORT.md`,
  `packages/ifr-bench/UNIFIED-RERUN.md`
- Unification note: issue #230 — “Vapor needs ET, not vice versa”
