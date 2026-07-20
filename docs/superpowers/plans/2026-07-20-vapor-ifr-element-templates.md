# Plan: Vapor IFR × Element Templates

**Date:** 2026-07-20  
**Design:** `docs/superpowers/specs/2026-07-20-vapor-ifr-element-templates-design.md`  
**Status:** Milestones 1–2 in progress

## Milestone 1

- [x] Design spec: sparse (IFR-discard) vs dense (Vapor keeper) naming
- [x] `bake-tree-create.ts`: flatten `TemplateNode` → straight-line program
- [x] Dense bake wired into `CLONE_TREE` (hydration-compatible)
- [x] Sparse bake + tests demonstrating hole-only naming
- [x] Guard: VDOM `elementTemplateTransform` stays off under `vapor: true`
- [x] Guide notes pointing at the follow-up
- [x] Build + tests green

## Milestone 2 (this iteration)

- [x] `htmlToTemplateNode` + `inferHoleSlots` (HTML → REGISTER_TREE IR)
- [x] Build-time `rewriteVaporTemplateCalls` + post-loader (skip runtime HTML parse)
- [x] `template()` accepts structured TemplateNode
- [x] IFR MT `renderEffect` one-shot (no reactive wiring on disposable tree)
- [ ] Structural remapping hydration (sparse paint → dense BG ownership)
- [ ] Compiler-emitted authoritative hole lists (replace `inferHoleSlots`)

## Milestone 3+

- Compiler-direct IFR MT: skip ShadowElement allocation; one-shot hole apply via sparse bake
- Structural remapping hydration
- `vapor {off, ifr, ifr-et}` sfc-probe cell
