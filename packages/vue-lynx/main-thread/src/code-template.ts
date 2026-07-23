// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Code-Template executor for the ephemeral IFR paint (#340) — axis-D paint
 * value `code-paint` (legacy `disposable-et`).
 *
 * Four-axis coordinate: Data staging on the DURABLE tree, but the throwaway
 * IFR first-frame copy is painted through a compiled Code-Template `create()`
 * executor instead of inheriting the durable Data-Template interpretation.
 * This is the paint sibling of `native-paint`/`engine-et` (#324): where the
 * engine rung is a host-resident prototype that is a *stub* on Lynx for Web,
 * the code rung compiles the SAME REGISTER_TREE residual into a straight-line
 * builder that actually runs on this host — so `code-paint` is web-MEASURABLE.
 *
 * How it differs from the Data-Template interpreter (`instantiateTemplate*`
 * in ops-apply): the interpreter recursively re-walks the lazy `TemplateNode`
 * AST on every clone, re-deriving per node the tag dispatch, materializability
 * test, and sparse slot→uid mapping. The Code-Template compiles that residual
 * ONCE (at REGISTER_TREE) into a flat preorder step list — the interpreter is
 * specialized away (first Futamura projection) — and each clone just replays
 * the compiled steps. The persistent tree's `templates` map is untouched, so
 * anything outside the ephemeral first-frame window (fallback replay, non-IFR
 * builds) still interprets the Data-Template exactly as before.
 *
 * Materialization is driven back through the caller's `host` so the element
 * registry, selector-attribute deferral, and insert tracking stay
 * single-sourced in ops-apply and every later op targets the same handles the
 * interpreter would have produced.
 */

import type { TemplateNode } from 'vue-lynx/internal/ops';

import { elements, trackInsert } from './element-registry.js';

/** Diagnostics + benchmark honesty: was any ephemeral copy code-painted? */
export type CodeTemplateStatus = 'unused' | 'painted';

export const CODE_PAINT_STATUS_GLOBAL = '__VUE_LYNX_CODE_PAINT_STATUS__';

/**
 * One compiled node in preorder. `uidOffset`/`trackParentOffset` are relative
 * to the clone's `baseUid` so a single compiled plan serves every clone.
 */
interface CodeStep {
  isText: boolean;
  tag: string;
  props: TemplateNode[1];
  /** Registry id = baseUid + uidOffset, or null for an anonymous skeleton node. */
  uidOffset: number | null;
  /** Index into the built-handle array of the parent to append to, or -1. */
  appendParent: number;
  /** Nearest named ancestor's uidOffset for insert tracking, or null. */
  trackParentOffset: number | null;
}

interface CompiledCodeTemplate {
  steps: CodeStep[];
}

/** PAPI/registry sink kept in ops-apply so selector deferral stays there. */
export interface CodeTemplateHost {
  /** Create the native element (typed create + __SetCSSId), root/hole alike. */
  createElement: (isText: boolean, tag: string) => LynxElement;
  applyStaticProps: (el: LynxElement, props: TemplateNode[1]) => void;
  installSelectorAttribute: (uid: number, el: LynxElement) => void;
  appendChild: (parent: LynxElement, child: LynxElement) => void;
}

const templates = new Map<number, CompiledCodeTemplate>();
let status: CodeTemplateStatus = 'unused';

function publishStatus(next: CodeTemplateStatus): void {
  status = next;
  (globalThis as Record<string, unknown>)[CODE_PAINT_STATUS_GLOBAL] = next;
}

function isMaterializable(tag: string, props: TemplateNode[1]): boolean {
  if (tag === '#comment') return false;
  if (tag === '#text') return !!props && props.t !== undefined && props.t !== '';
  return true;
}

/**
 * Compile a REGISTER_TREE residual into a flat preorder plan. Mirrors the two
 * Data-Template interpreters exactly so the painted tree and its registry are
 * byte-for-byte what a later `applyOps` batch expects:
 *  - dense (no `addressed`): uid = baseUid + preorderIndex, every node named;
 *  - sparse (`addressed`): uid = baseUid + indexInAddressed, only addressed
 *    preorder slots named, anonymous skeleton nodes are write-only handles.
 * Comment / empty-#text nodes are BG-only anchors: they consume a preorder
 * slot (advancing the counter) but produce no native node and are not walked
 * into — identical to the interpreters' pre-children `return null`.
 */
function compile(
  structure: TemplateNode,
  addressed: number[] | undefined,
): CompiledCodeTemplate {
  const steps: CodeStep[] = [];
  const slotToSparse = addressed
    ? new Map(addressed.map((slot, index) => [slot, index] as const))
    : null;
  const counter = { value: 0 };

  // Returns the pushed step index + this node's uidOffset, or null for a
  // BG-only anchor. The parent wires appendParent after the child returns.
  const walk = (
    node: TemplateNode,
    parentUidOffset: number | null,
  ): { stepIndex: number; uidOffset: number | null } | null => {
    const slot = counter.value++;
    const [tag, props, children] = node;
    if (!isMaterializable(tag, props)) return null;

    const uidOffset = slotToSparse
      ? (slotToSparse.get(slot) ?? null)
      : slot;
    const stepIndex = steps.length;
    steps.push({
      isText: tag === '#text',
      tag,
      props,
      uidOffset,
      appendParent: -1,
      trackParentOffset: parentUidOffset,
    });

    for (const child of children) {
      const built = walk(child, uidOffset);
      if (built) steps[built.stepIndex]!.appendParent = stepIndex;
    }
    return { stepIndex, uidOffset };
  };

  walk(structure, null);
  return { steps };
}

/**
 * Compile + cache a Code-Template for a registered tree (build the executor
 * once, mirroring the engine path's register-time prototype build). Idempotent
 * per treeId.
 */
export function registerCodeTemplate(
  id: number,
  structure: TemplateNode,
  addressed: number[] | undefined,
): void {
  if (templates.has(id)) return;
  const useSparse = addressed !== undefined && addressed.length > 0;
  templates.set(id, compile(structure, useSparse ? addressed : undefined));
}

/**
 * Replay a compiled Code-Template into the live tree at `baseUid`. Returns
 * false when the tree was never compiled (caller falls back to the
 * Data-Template interpreter — the same fail-safe shape as the engine path).
 */
export function instantiateCodeTemplate(
  id: number,
  baseUid: number,
  host: CodeTemplateHost,
): boolean {
  const tpl = templates.get(id);
  if (!tpl) return false;

  const handles: LynxElement[] = new Array(tpl.steps.length);
  for (let i = 0; i < tpl.steps.length; i++) {
    const step = tpl.steps[i]!;
    const el = host.createElement(step.isText, step.tag);
    handles[i] = el;
    host.applyStaticProps(el, step.props);
    if (step.uidOffset !== null) {
      const uid = baseUid + step.uidOffset;
      elements.set(uid, el);
      host.installSelectorAttribute(uid, el);
      if (step.trackParentOffset !== null) {
        trackInsert(baseUid + step.trackParentOffset, uid);
      }
    }
    if (step.appendParent >= 0) {
      const parentEl = handles[step.appendParent];
      if (parentEl) host.appendChild(parentEl, el);
    }
  }
  publishStatus('painted');
  return true;
}

export function getCodeTemplateStatus(): CodeTemplateStatus {
  return status;
}

/** Reset module state — for testing only. */
export function resetCodeTemplatesForTesting(): void {
  templates.clear();
  status = 'unused';
  delete (globalThis as Record<string, unknown>)[CODE_PAINT_STATUS_GLOBAL];
}
