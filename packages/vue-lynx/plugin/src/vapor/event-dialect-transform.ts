// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Compile-time Lynx event-dialect normalization (issue #234, Part B).
 *
 * `@vue/compiler-vapor` has no notion of Lynx event props: ReactLynx-style
 * `:bindtap="fn"` compiles to `setAttr(el, "bindtap", fn)`, which today is
 * rescued at runtime by the `ShadowElement.setAttribute` event chokepoint
 * (the #219 class of bug: every new pipeline has to remember to route through
 * it). This `nodeTransform` moves that from runtime discipline to a
 * compile-time guarantee: it rewrites the statically-written dialect props
 *
 *   :bindtap="fn"    →  v-on:tap="fn"            → on(el, 'tap', fn)
 *   :catchtap="fn"   →  v-on:tap.stop="fn"       → on(el, 'tap', withModifiers(fn, ['stop']))
 *   :bind<evt>       →  v-on:<evt>
 *   :catch<evt>      →  v-on:<evt>.stop
 *
 * i.e. it makes a dialect prop compile to the *exact same code* the native
 * `@tap` / `@tap.stop` sugar already produces — which the vue-lynx Vapor
 * runtime handles (bindEvent / `_lynxCatch` → catchEvent). The runtime
 * chokepoint stays as the safety net for dynamic keys, v-bind spreads, and
 * precompiled code.
 *
 * Deliberately NOT handled here (left to the runtime chokepoint):
 *  - `global-bind*` / `global-catch*` — no `v-on` equivalent (global event
 *    registration); they stay dialect props and route through setAttribute.
 *  - `main-thread-*` — a worklet reference, not a v-on handler; stays a prop.
 *  - dynamic args (`:[key]="fn"`) and v-bind spreads — not statically known.
 */

// @vue/compiler-core NodeTypes / ConstantTypes numeric values (kept inline to
// avoid a value import of the compiler into the plugin bundle).
const ELEMENT = 1;
const SIMPLE_EXPRESSION = 4;
const DIRECTIVE = 7;
const CAN_STRINGIFY = 3;

/** `bindtap`, `catchtouchstart`, … (NOT `global-*`). */
const DIALECT_RE = /^(bind|catch)(.+)$/;

interface SimpleExpr {
  type: number;
  content: string;
  isStatic?: boolean;
  constType?: number;
  loc?: unknown;
}

interface DirectiveLike {
  type: number;
  name: string;
  arg?: SimpleExpr;
  modifiers?: unknown[];
}

interface ElementLike {
  type: number;
  props: DirectiveLike[];
}

/**
 * A `@vue/compiler-core` nodeTransform. Injected via `compilerOptions
 * .nodeTransforms`; runs for both the inline (prod) and separate-module (dev)
 * template compilation paths.
 */
export function transformLynxEventDialect(node: unknown): void {
  const el = node as ElementLike;
  if (!el || el.type !== ELEMENT || !Array.isArray(el.props)) return;

  for (const prop of el.props) {
    // Only static `v-bind:<dialect>` directives (`:bindtap="fn"`).
    if (prop.type !== DIRECTIVE || prop.name !== 'bind') continue;
    const arg = prop.arg;
    if (!arg || arg.type !== SIMPLE_EXPRESSION || !arg.isStatic) continue;

    const match = DIALECT_RE.exec(arg.content);
    if (!match) continue;
    const kind = match[1]!; // 'bind' | 'catch'
    const eventName = match[2]!; // e.g. 'tap', 'touchstart'

    // Retarget to v-on so the compiler emits `on(el, <evt>, …)` outside any
    // renderEffect — identical to the native `@<evt>` / `@<evt>.stop` sugar.
    prop.name = 'on';
    prop.arg = { ...arg, content: eventName };
    prop.modifiers = kind === 'catch'
      ? [{
        type: SIMPLE_EXPRESSION,
        content: 'stop',
        isStatic: true,
        constType: CAN_STRINGIFY,
        loc: arg.loc,
      }]
      : [];
  }
}
