// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Compile-time Vapor addressing analysis (#297 / #298).
 *
 * Produces per-`template()` metadata consumed by sparse A2 naming:
 *  - **holes** — dynamic bind / event / ref / text targets + insert hosts
 *  - **addressed** — holes ∪ root ∪ ancestors ∪ prefix siblings
 *  - **tags** — fingerprint of `structure[addressed[i]].tag` for fail-safe
 *    validation against runtime `buildStructure`
 *
 * Slot geometry is derived from the compiler HTML string with the **same**
 * fold rules as runtime `buildStructure` (only-child `#text` folded;
 * `#comment` always consumes a slot). IR is used only to discover which
 * elements are holes — never as the preorder authority — so IR↔runtime
 * fold skew cannot silently mis-name nodes.
 */

import type { BindingMetadata } from '@vue/compiler-dom';
import type {
  BlockIRNode,
  IRDynamicInfo,
  OperationNode,
  RootIRNode,
} from '@vue/compiler-vapor';
import {
  DynamicFlag,
  IRNodeTypes,
  isBlockOperation,
  parse,
  transform,
  transformChildren,
  transformComment,
  transformElement,
  transformKey,
  transformSlotOutlet,
  transformTemplateRef,
  transformText,
  transformVBind,
  transformVFor,
  transformVHtml,
  transformVIf,
  transformVModel,
  transformVOn,
  transformVOnce,
  transformVShow,
  transformVSlot,
  transformVText,
} from '@vue/compiler-vapor';
import {
  VAPOR_ADDRESSING_KEY,
  type VaporTreeAddressing,
} from 'vue-lynx/internal/ops';

import { structureSlotsFromHtml } from './vapor-structure-from-html.js';
import { templateNodeFromHtml } from './vapor-template-node.js';

export { VAPOR_ADDRESSING_KEY };

/** Per-template hole + addressed-node metadata (REGISTER_TREE preorder slots). */
export interface VaporTemplateAddressing extends VaporTreeAddressing {
  /** Index of this template in the vapor IR (`t0`, `t1`, …). */
  templateIndex: number;
  /** Compiler-emitted HTML string passed to `template()`. */
  content: string;
}

export interface VaporAddressingResult {
  templates: VaporTemplateAddressing[];
}

export interface AnalyzeVaporAddressingOptions {
  bindingMetadata?: BindingMetadata;
  isNativeTag?: (tag: string) => boolean;
  /**
   * Mirrors the plugin's `autoPixelUnit` option for the build-time structure
   * hash (#337/#338) — inline-style normalization must match the runtime
   * define or the fingerprint fail-safe (correctly) rejects the bake.
   */
  autoPixelUnit?: boolean;
}

function getBaseTransformPreset(): [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any>,
] {
  return [[
    transformVOnce,
    transformVIf,
    transformVFor,
    transformKey,
    transformSlotOutlet,
    transformTemplateRef,
    transformElement,
    transformText,
    transformVSlot,
    transformComment,
    transformChildren,
  ], {
    bind: transformVBind,
    on: transformVOn,
    html: transformVHtml,
    text: transformVText,
    show: transformVShow,
    model: transformVModel,
  }];
}

function isInsertPlaceholder(d: IRDynamicInfo): boolean {
  return (
    (d.flags & DynamicFlag.NON_TEMPLATE) !== 0
    && (d.flags & DynamicFlag.INSERT) !== 0
  );
}

/** Non-element leaf in the IR dynamic tree (text / comment / interpolation). */
function isTextLike(d: IRDynamicInfo): boolean {
  if (d.template != null || d.operation != null) return false;
  if ((d.flags & DynamicFlag.INSERT) !== 0) return false;
  if ((d.flags & DynamicFlag.NON_TEMPLATE) !== 0) return true;
  return (
    d.id === undefined
    && !d.hasDynamicChild
    && (d.children?.length ?? 0) === 0
  );
}

function collectHoleElementIds(block: BlockIRNode, into: Set<number>): void {
  const consider = (op: OperationNode): void => {
    switch (op.type) {
      case IRNodeTypes.SET_PROP:
      case IRNodeTypes.SET_DYNAMIC_PROPS:
      case IRNodeTypes.SET_EVENT:
      case IRNodeTypes.SET_DYNAMIC_EVENTS:
      case IRNodeTypes.SET_HTML:
      case IRNodeTypes.SET_TEMPLATE_REF:
      case IRNodeTypes.SET_TEXT:
      case IRNodeTypes.DIRECTIVE:
        if (op.element != null) into.add(op.element);
        break;
      case IRNodeTypes.GET_TEXT_CHILD:
        into.add(op.parent);
        break;
      default:
        break;
    }
  };
  for (const op of block.operation) consider(op);
  for (const effect of block.effect) {
    for (const op of effect.operations) consider(op);
  }
}

/**
 * Map IR element ids → HTML structure slots by walking IR elements in
 * preorder alongside HTML element slots (skipping `#text` / `#comment`).
 * Insert-placeholder children mark the current HTML element slot as a hole.
 */
function mapIrHolesOntoHtmlSlots(
  tplRoot: IRDynamicInfo,
  holeIds: Set<number>,
  htmlTags: readonly string[],
): number[] {
  const elementSlots: number[] = [];
  for (let i = 0; i < htmlTags.length; i++) {
    const tag = htmlTags[i]!;
    if (tag !== '#text' && tag !== '#comment') elementSlots.push(i);
  }

  const holeSlots = new Set<number>();
  let elIdx = 0;

  const walkEl = (d: IRDynamicInfo): void => {
    if (isInsertPlaceholder(d) || isTextLike(d)) return;

    const htmlSlot = elementSlots[elIdx++];
    if (htmlSlot === undefined) return;

    if (d.id !== undefined && holeIds.has(d.id)) {
      holeSlots.add(htmlSlot);
    }

    for (const child of d.children) {
      if (isInsertPlaceholder(child)) {
        holeSlots.add(htmlSlot);
        continue;
      }
      if (isTextLike(child)) continue;
      walkEl(child);
    }
  };

  walkEl(tplRoot);
  return [...holeSlots].sort((a, b) => a - b);
}

function computeAddressed(
  nodes: { parent: number | null; children: number[] }[],
  holes: readonly number[],
): number[] {
  const needed = new Set<number>([0, ...holes]);

  for (const hole of holes) {
    let parent = nodes[hole]?.parent ?? null;
    while (parent != null) {
      needed.add(parent);
      parent = nodes[parent]?.parent ?? null;
    }
  }

  const subtreeHasNeeded = (slot: number): boolean => {
    if (needed.has(slot)) return true;
    const info = nodes[slot];
    if (!info) return false;
    for (const child of info.children) {
      if (subtreeHasNeeded(child)) return true;
    }
    return false;
  };

  for (const info of nodes) {
    if (!info || info.children.length === 0) continue;
    let last = -1;
    for (let i = 0; i < info.children.length; i++) {
      if (subtreeHasNeeded(info.children[i]!)) last = i;
    }
    if (last >= 0) {
      for (let i = 0; i <= last; i++) needed.add(info.children[i]!);
    }
  }

  return [...needed].sort((a, b) => a - b);
}

function visitNestedBlock(op: OperationNode, visit: (b: BlockIRNode) => void): void {
  if (!isBlockOperation(op)) return;
  switch (op.type) {
    case IRNodeTypes.IF: {
      visit(op.positive);
      if (op.negative) {
        if (op.negative.type === IRNodeTypes.BLOCK) {
          visit(op.negative);
        } else {
          visitNestedBlock(op.negative, visit);
        }
      }
      break;
    }
    case IRNodeTypes.FOR:
      visit(op.render);
      break;
    case IRNodeTypes.KEY:
      visit(op.block);
      break;
    default:
      break;
  }
}

function transformToIR(
  source: string,
  options: AnalyzeVaporAddressingOptions,
): RootIRNode {
  const isNativeTag = options.isNativeTag ?? (() => true);
  const ast = parse(source, { isNativeTag, whitespace: 'condense' });
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
  return transform(ast, {
    bindingMetadata: options.bindingMetadata,
    nodeTransforms,
    directiveTransforms,
  });
}

/**
 * Analyze a Vapor template source string and return per-`template()` metadata.
 */
export function analyzeVaporAddressing(
  source: string,
  options: AnalyzeVaporAddressingOptions = {},
): VaporAddressingResult {
  const ir = transformToIR(source, options);
  const templates: VaporTemplateAddressing[] = [];

  const visitBlock = (block: BlockIRNode): void => {
    const walk = (d: IRDynamicInfo): void => {
      if (d.template != null) {
        const entry = ir.template.entries[d.template];
        const content = entry?.content ?? '';
        const { tags, nodes, slotCount } = structureSlotsFromHtml(content);

        const holeIds = new Set<number>();
        collectHoleElementIds(block, holeIds);
        const holes = mapIrHolesOntoHtmlSlots(d, holeIds, tags);
        const addressed = slotCount > 0
          ? computeAddressed(nodes, holes)
          : [];
        const addressedTags = addressed.map((s) => tags[s] ?? '');

        // Structure fingerprint for the bundle-delivery / code-staging cells
        // (#337/#338). Best-effort: a failed build parse just omits the hash
        // and those cells fall back to the wire data path for this template.
        let hash: string | undefined;
        try {
          const built = templateNodeFromHtml(content, {
            autoPixelUnit: options.autoPixelUnit,
          });
          if (built && built.slotCount === slotCount) hash = built.hash;
        } catch {
          // hash stays undefined — runtime keeps today's delivery.
        }

        templates.push({
          templateIndex: d.template,
          content,
          slotCount,
          holes,
          addressed,
          tags: addressedTags,
          ...(hash !== undefined ? { hash } : {}),
        });
      }

      if (d.operation) visitNestedBlock(d.operation, visitBlock);
      for (const child of d.children) walk(child);
    };

    walk(block.dynamic);
    for (const op of block.operation) visitNestedBlock(op, visitBlock);
  };

  visitBlock(ir.block);

  templates.sort((a, b) => a.templateIndex - b.templateIndex);
  return { templates };
}

/**
 * Stamp `__vlxAddressing` onto each `const tN = template(...)` factory.
 */
export function annotateVaporAddressing(
  code: string,
  result: VaporAddressingResult,
): string {
  if (result.templates.length === 0) return code;

  const byIndex = new Map(
    result.templates.map((t) => [t.templateIndex, t]),
  );

  const re =
    /\bconst\s+(t(\d+))\s*=\s*(_template|template)\s*\(/g;

  let out = '';
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(code)) !== null) {
    const name = match[1]!;
    const index = Number(match[2]);
    const meta = byIndex.get(index);
    const callStart = match.index + match[0].length - 1;
    const callEnd = findMatchingParen(code, callStart);
    if (callEnd < 0 || !meta) continue;

    let stmtEnd = callEnd + 1;
    while (stmtEnd < code.length && /[ \t]/.test(code[stmtEnd]!)) stmtEnd++;
    if (code[stmtEnd] === ';') stmtEnd++;

    out += code.slice(last, stmtEnd);
    out += `\n${name}.${VAPOR_ADDRESSING_KEY} = ${
      stringifyAddressing(meta)
    }`;
    last = stmtEnd;
    re.lastIndex = stmtEnd;
  }
  out += code.slice(last);
  return out;
}

function stringifyAddressing(meta: VaporTemplateAddressing): string {
  return JSON.stringify({
    holes: meta.holes,
    addressed: meta.addressed,
    slotCount: meta.slotCount,
    tags: meta.tags,
    ...(meta.hash !== undefined ? { hash: meta.hash } : {}),
  });
}

function findMatchingParen(code: string, openIndex: number): number {
  let depth = 0;
  let inStr: '"' | "'" | '`' | null = null;
  let escaped = false;
  for (let i = openIndex; i < code.length; i++) {
    const ch = code[i]!;
    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function analyzeAndAnnotateVaporCode(
  source: string,
  code: string,
  options: AnalyzeVaporAddressingOptions = {},
): { code: string; result: VaporAddressingResult } {
  const result = analyzeVaporAddressing(source, options);
  return { code: annotateVaporAddressing(code, result), result };
}
