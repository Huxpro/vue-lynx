# Plan: Vapor IFR × Element Templates

**Date:** 2026-07-20  
**Design:** `docs/superpowers/specs/2026-07-20-vapor-ifr-element-templates-design.md`  
**Status:** Milestones 1–2 done; Milestone 3 in progress

## Milestone 1

- [x] Design spec: sparse (IFR-discard) vs dense (Vapor keeper) naming
- [x] `bake-tree-create.ts`: flatten `TemplateNode` → straight-line program
- [x] Dense bake wired into `CLONE_TREE` (hydration-compatible)
- [x] Sparse bake + tests demonstrating hole-only naming
- [x] Guard: VDOM `elementTemplateTransform` stays off under `vapor: true`
- [x] Guide notes pointing at the follow-up
- [x] Build + tests green

## Milestone 2

- [x] `htmlToTemplateNode` + `inferHoleSlots` (HTML → REGISTER_TREE IR)
- [x] Build-time `rewriteVaporTemplateCalls` + post-loader (skip runtime HTML parse)
- [x] `template()` accepts structured TemplateNode
- [x] IFR MT `renderEffect` one-shot (no reactive wiring on disposable tree)
- [ ] Compiler-emitted authoritative hole lists (replace `inferHoleSlots`)

## Milestone 3 (this iteration)

- [x] IFR MT ShadowElement lite / static root-only clone
- [x] IFR `CLONE_TREE` uses sparse bake (root + holes); retain full stack
- [x] Structural remapping: densify paint registry on selector commit / BG CLONE adopt
- [ ] Skip ShadowElement entirely for hole templates (facade / compiler-direct)
- [ ] `vapor {off, ifr, ifr-et}` sfc-probe FCP cell
