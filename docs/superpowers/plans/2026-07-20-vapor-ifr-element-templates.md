# Plan: Vapor IFR × Element Templates

**Date:** 2026-07-20  
**Design:** `docs/superpowers/specs/2026-07-20-vapor-ifr-element-templates-design.md`  
**Status:** Milestone 1 in progress

## Milestone 1 (this PR)

- [x] Design spec: sparse (IFR-discard) vs dense (Vapor keeper) naming
- [x] `bake-tree-create.ts`: flatten `TemplateNode` → straight-line program
- [x] Dense bake wired into `CLONE_TREE` (hydration-compatible)
- [x] Sparse bake + tests demonstrating hole-only naming
- [x] Guard: VDOM `elementTemplateTransform` stays off under `vapor: true`
- [x] Guide notes pointing at the follow-up
- [x] `pnpm --filter vue-lynx run build` + upstream local/vapor + testing-library green

## Milestone 2+

- Build-time structured templates (#234) feed the baker
- Compiler-direct IFR MT one-shot holes (skip ShadowElement / renderEffect)
- Structural remapping hydration (sparse paint → dense BG ownership)
- `vapor {off, ifr, ifr-et}` sfc-probe cell
