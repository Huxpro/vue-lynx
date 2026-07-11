// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Element-template lowering (compile-time "snapshot" transform).
 *
 * Lowers eligible template subtrees — plain elements with compile-time-known
 * structure — into element templates: a hoisted registration carrying a
 * straight-line-PAPI `create()` function plus hole metadata, and a single
 * vnode per subtree instead of one per node:
 *
 *   <view class="card">                 const _hoisted_1 = _registerElementTemplate(
 *     <image src="a.png"/>                "1a2b3c", ["#text"],
 *     <text>{{ title }}</text>   ==>      function(P){ ...__CreateView/__AppendElement...
 *   </view>                                return [e0, e2] })
 *                                       …
 *                                       createElementBlock("__vlx-tpl:1a2b3c",
 *                                         { class: "card", __h0: _toDisplayString(_ctx.title) })
 *
 * Runtime contract: see runtime/src/element-template.ts (vnode side) and
 * main-thread/src/element-templates.ts + the INSTANTIATE_TEMPLATE op
 * (executor side). Interior dynamic parts ("holes") receive ids right after
 * the root id, and all updates flow through ordinary SET_* ops.
 *
 * Eligibility (per node):
 *  - plain element (no component / slot / <template> / structural directive
 *    on interiors); `list`/`list-item`/`page` excluded (main-thread special
 *    handling)
 *  - interior nodes: only v-bind/v-on props; no `ref`/`key`/`id`/`onVnode*`;
 *    no runtime directives (v-show, v-model, custom)
 *  - the subtree ROOT keeps all of its own props/directives on the vnode
 *    (they behave exactly like a normal element: Transition classes, v-show,
 *    ref, key, … all still work), so roots are only constrained structurally
 *  - children: elements (recursively eligible), fully-static text, or a
 *    single dynamic-text child (becomes a '#text' hole); anything else
 *    (comments, mixed dynamic text, v-if/v-for/components) breaks the
 *    subtree — descendants are then considered independently
 *
 * Anything ineligible simply stays on the normal vdom/ops path; correctness
 * never depends on lowering.
 */

import type {
  ElementNode,
  NodeTransform,
  ObjectExpression,
  RootNode,
  TemplateChildNode,
  TransformContext,
  VNodeCall,
} from '@vue/compiler-core';
import {
  ConstantTypes,
  ElementTypes,
  NodeTypes,
  createObjectExpression,
  createObjectProperty,
  createSimpleExpression,
} from '@vue/compiler-core';

/**
 * Registration entry point referenced by the generated code.
 *
 * A GLOBAL is used instead of the compiler runtime-helper mechanism on
 * purpose: helper symbols are looked up in the `helperNameMap` of whichever
 * compiler-core copy performs codegen, and @vue/compiler-sfc bundles its own
 * copy — symbols registered against the standalone @vue/compiler-core would
 * resolve to `undefined` for script-setup (inline) templates. The global is
 * installed at module-evaluation time by vue-lynx's runtime (BG and IFR-MT
 * bundles); interpreter-only MT bundles rebind the extracted registrations
 * to the executor registry (see worklet-utils extractTemplateRegistrations).
 */
const REGISTER_GLOBAL = 'globalThis.__vueLynxRegisterElementTemplate';

const TPL_TYPE_PREFIX = '__vlx-tpl:';
const TPL_HOLE_PREFIX = '__h';

/** Minimum element count for lowering to pay off (root + ≥1 interior). */
const MIN_ELEMENTS = 2;

// PatchFlags (numeric values are part of Vue's public compiled-output
// contract; imported values live in @vue/shared which the plugin doesn't
// depend on).
const PF_TEXT = 1;
const PF_PROPS = 8;

/** Tags with special main-thread creation paths — never lowered. */
const EXCLUDED_TAGS = new Set(['list', 'list-item', 'page', 'div']);

const TYPED_CREATE: Record<string, string> = {
  view: '__CreateView',
  text: '__CreateText',
  image: '__CreateImage',
  'scroll-view': '__CreateScrollView',
};

// ---------------------------------------------------------------------------
// Small stable content hash (fnv1a ×2) for template ids
// ---------------------------------------------------------------------------

function fnv1a(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function templateId(content: string): string {
  return (
    fnv1a(content, 0x811c9dc5).toString(36)
    + fnv1a(content, 0x9747b28c).toString(36)
  );
}

/** Same algorithm as runtime/src/scope-bridge.ts scopeIdToCssId. */
function scopeIdToCssId(scopeId: string): number {
  const hex = scopeId.replace(/^data-v-/, '');
  return Number.parseInt(hex, 16) & 0x7fffffff;
}

// ---------------------------------------------------------------------------
// Subtree analysis + create() source generation
// ---------------------------------------------------------------------------

interface Hole {
  /** original prop key, or '#text' for a text-content binding */
  key: string;
  /** compiled value expression (moved onto the lowered vnode as __hN) */
  value: unknown;
}

interface TemplatePlan {
  src: string;
  holes: Hole[];
  elementCount: number;
}

/** Thrown internally when a subtree turns out to be ineligible. */
const INELIGIBLE = Symbol('ineligible');

function isBakeableValue(
  value: { type: number; isStatic?: boolean; constType?: number },
): boolean {
  return (
    value.type === NodeTypes.SIMPLE_EXPRESSION
    && (value.isStatic === true
      || value.constType === ConstantTypes.CAN_STRINGIFY)
  );
}

/**
 * Style values may only be baked when they are provably normalization-free.
 *
 * The runtime routes `style` through `normalizeStyle` (numeric auto-px
 * conversion, the numeric-`flex` stringify workaround); a baked skeleton
 * bypasses it. Static `style="…"` attributes compile (via transformStyle)
 * to strict-JSON objects whose values are all strings — normalization is a
 * no-op for those, so they bake safely. Anything else (`:style` object
 * literals are constant-foldable but may carry numerics) becomes a hole and
 * keeps the exact runtime semantics.
 */
function isBakeableStyle(content: string | undefined): boolean {
  if (!content) return false;
  try {
    const parsed: unknown = JSON.parse(content);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false;
    }
    return Object.values(parsed).every((v) => typeof v === 'string');
  } catch {
    return false;
  }
}

function printBakedValue(
  value: { isStatic?: boolean; content?: string },
): string {
  // Static attribute values are raw strings; constant-folded expressions
  // (e.g. transformStyle's parsed style objects) are JS source text.
  return value.isStatic === true
    ? JSON.stringify(value.content ?? '')
    : (value.content ?? 'undefined');
}

function analyzeSubtree(
  rootEl: ElementNode,
  context: TransformContext,
): TemplatePlan | null {
  const lines: string[] = [];
  const holes: Hole[] = [];
  const holeVars: string[] = [];
  let elementCount = 0;
  let nextVar = 0;

  const cssId = context.scopeId != null
    ? scopeIdToCssId(context.scopeId)
    : 0;

  const emitElement = (el: ElementNode, isRoot: boolean): string => {
    if (el.type !== NodeTypes.ELEMENT) throw INELIGIBLE;
    if (el.tagType !== ElementTypes.ELEMENT) throw INELIGIBLE;
    if (EXCLUDED_TAGS.has(el.tag)) throw INELIGIBLE;
    const cg = el.codegenNode;
    if (!cg || cg.type !== NodeTypes.VNODE_CALL) throw INELIGIBLE; // v-once, v-memo, …
    const vnodeCall = cg as VNodeCall;

    elementCount++;
    const v = `e${nextVar++}`;
    const createFn = TYPED_CREATE[el.tag];
    lines.push(
      createFn !== undefined
        ? `const ${v} = ${createFn}(P);`
        : `const ${v} = __CreateElement(${JSON.stringify(el.tag)}, P);`,
    );
    lines.push(`__SetCSSId([${v}], ${cssId});`);

    if (!isRoot) {
      // Interior nodes must be fully expressible as skeleton + holes.
      if (vnodeCall.directives) throw INELIGIBLE;
      if (vnodeCall.props != null) {
        if (vnodeCall.props.type !== NodeTypes.JS_OBJECT_EXPRESSION) {
          throw INELIGIBLE; // v-bind spread / mergeProps / dynamic keys
        }
        for (const prop of (vnodeCall.props as ObjectExpression).properties) {
          const keyNode = prop.key as {
            type: number;
            isStatic?: boolean;
            content?: string;
          };
          if (
            keyNode.type !== NodeTypes.SIMPLE_EXPRESSION
            || keyNode.isStatic !== true
            || keyNode.content == null
          ) {
            throw INELIGIBLE;
          }
          const key = keyNode.content;
          // `key`/`ref` need a vnode; `id` feeds the BG-side Teleport target
          // registry; vnode hooks need a vnode.
          if (
            key === 'key' || key === 'ref' || key === 'id'
            || key.startsWith('onVnode')
          ) {
            throw INELIGIBLE;
          }
          const value = prop.value as {
            type: number;
            isStatic?: boolean;
            constType?: number;
            content?: string;
          };
          const bakeable = !key.startsWith('on') && isBakeableValue(value)
            && (key !== 'style' || isBakeableStyle(value.content));
          if (bakeable) {
            const printed = printBakedValue(value);
            if (key === 'class') {
              lines.push(`__SetClasses(${v}, ${printed});`);
            } else if (key === 'style') {
              lines.push(`__SetInlineStyles(${v}, ${printed});`);
            } else {
              lines.push(
                `__SetAttribute(${v}, ${JSON.stringify(key)}, ${printed});`,
              );
            }
          } else {
            holes.push({ key, value: prop.value });
            holeVars.push(v);
          }
        }
      }
    }

    // Children.
    const kids = el.children;
    const isSingleText = kids.length === 1
      && (kids[0]!.type === NodeTypes.TEXT
        || kids[0]!.type === NodeTypes.INTERPOLATION
        || kids[0]!.type === NodeTypes.COMPOUND_EXPRESSION);

    if (isSingleText) {
      const child = kids[0]!;
      if (child.type === NodeTypes.TEXT) {
        lines.push(
          `__SetAttribute(${v}, 'text', ${JSON.stringify(child.content)});`,
        );
      } else {
        // Dynamic text content → '#text' hole on this element. The
        // INTERPOLATION/COMPOUND node is used as the prop value verbatim —
        // codegen stringifies it with ITS OWN toDisplayString helper, and
        // the runtime hole delegate applies toDisplayString again
        // defensively (idempotent for strings).
        holes.push({ key: '#text', value: child });
        holeVars.push(v);
      }
    } else {
      for (const child of kids) {
        if (child.type === NodeTypes.ELEMENT) {
          const cv = emitElement(child as ElementNode, false);
          lines.push(`__AppendElement(${v}, ${cv});`);
        } else if (child.type === NodeTypes.TEXT) {
          const tv = `e${nextVar++}`;
          lines.push(`const ${tv} = __CreateText(P);`);
          lines.push(`__SetCSSId([${tv}], ${cssId});`);
          lines.push(
            `__SetAttribute(${tv}, 'text', ${JSON.stringify(child.content)});`,
          );
          lines.push(`__AppendElement(${v}, ${tv});`);
        } else if (child.type === NodeTypes.TEXT_CALL) {
          // Mixed-children text: bake only when fully static.
          const content = child.content;
          if (content.type !== NodeTypes.TEXT) throw INELIGIBLE;
          const tv = `e${nextVar++}`;
          lines.push(`const ${tv} = __CreateText(P);`);
          lines.push(`__SetCSSId([${tv}], ${cssId});`);
          lines.push(
            `__SetAttribute(${tv}, 'text', ${
              JSON.stringify(content.content)
            });`,
          );
          lines.push(`__AppendElement(${v}, ${tv});`);
        } else {
          // comments, v-if/v-for, components, dynamic mixed text …
          throw INELIGIBLE;
        }
      }
    }

    return v;
  };

  try {
    const rootVar = emitElement(rootEl, true);
    const returns = [rootVar, ...holeVars].join(', ');
    const src = `function(P){\n${lines.join('\n')}\nreturn [${returns}];\n}`;
    return { src, holes, elementCount };
  } catch (e) {
    if (e === INELIGIBLE) return null;
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Lowering (codegenNode mutation + hoisted registration)
// ---------------------------------------------------------------------------

const SEEN_IDS: unique symbol = Symbol('vlxTplSeen');

function lowerElement(
  el: ElementNode,
  plan: TemplatePlan,
  context: TransformContext,
): boolean {
  const cg = el.codegenNode as VNodeCall;

  // Root props must be a plain object expression (or absent) so hole props
  // can be merged statically.
  if (
    cg.props != null && cg.props.type !== NodeTypes.JS_OBJECT_EXPRESSION
  ) {
    return false;
  }

  const holeKeys = plan.holes.map((h) => h.key);
  const id = templateId(`${plan.src} ${holeKeys.join(',')}`);

  // Hoist the registration once per (module, template id).
  const ctxAny = context as unknown as Record<PropertyKey, unknown>;
  let seen = ctxAny[SEEN_IDS] as Set<string> | undefined;
  if (!seen) {
    seen = new Set();
    ctxAny[SEEN_IDS] = seen;
  }
  if (!seen.has(id)) {
    seen.add(id);
    const registration = createSimpleExpression(
      `(${REGISTER_GLOBAL} || function () {})(${JSON.stringify(id)}, ${
        JSON.stringify(holeKeys)
      }, ${plan.src})`,
      false,
    );
    context.hoist(registration);
  }

  // Rewrite the vnode: template type, hole props appended, no children.
  cg.tag = JSON.stringify(TPL_TYPE_PREFIX + id);
  const holeProps = plan.holes.map((h, i) =>
    createObjectProperty(
      createSimpleExpression(`${TPL_HOLE_PREFIX}${i}`, true),
      // biome-ignore lint/suspicious/noExplicitAny: compiled expression node
      h.value as any,
    )
  );
  if (holeProps.length > 0) {
    if (cg.props == null) {
      cg.props = createObjectExpression(holeProps, el.loc);
    } else {
      (cg.props as ObjectExpression).properties.push(...holeProps);
    }
  }
  cg.children = undefined as never;

  let patchFlag = typeof cg.patchFlag === 'number' ? cg.patchFlag : 0;
  patchFlag &= ~PF_TEXT; // text children became holes / skeleton content
  if (holeProps.length > 0) patchFlag |= PF_PROPS;
  // biome-ignore lint/suspicious/noExplicitAny: VNodeCall.patchFlag typing lags runtime shape (number)
  cg.patchFlag = (patchFlag === 0 ? undefined : patchFlag) as any;

  if (holeProps.length > 0) {
    const existing = typeof cg.dynamicProps === 'string'
      ? (JSON.parse(cg.dynamicProps) as string[])
      : [];
    const dyn = [
      ...existing,
      ...plan.holes.map((_, i) => `${TPL_HOLE_PREFIX}${i}`),
    ];
    // biome-ignore lint/suspicious/noExplicitAny: dynamicProps is a stringified array in the AST
    cg.dynamicProps = JSON.stringify(dyn) as any;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Tree walk
// ---------------------------------------------------------------------------

function walk(
  children: TemplateChildNode[],
  context: TransformContext,
): void {
  for (const child of children) {
    switch (child.type) {
      case NodeTypes.ELEMENT: {
        const el = child as ElementNode;
        if (el.tagType === ElementTypes.ELEMENT) {
          const plan = analyzeSubtree(el, context);
          if (
            plan && plan.elementCount >= MIN_ELEMENTS
            && lowerElement(el, plan, context)
          ) {
            continue; // fully lowered — nothing left inside
          }
        }
        walk(el.children, context);
        break;
      }
      case NodeTypes.IF: {
        for (const branch of child.branches) walk(branch.children, context);
        break;
      }
      case NodeTypes.IF_BRANCH:
      case NodeTypes.FOR: {
        walk(child.children, context);
        break;
      }
      default:
        break;
    }
  }
}

/**
 * The lowering transform. Runs at ROOT exit — after all built-in transforms
 * have produced codegen nodes, before codegen itself.
 *
 * @public
 */
export const elementTemplateTransform: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ROOT) return;
  return () => {
    walk((node as RootNode).children, context);
  };
};
