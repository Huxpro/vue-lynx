// Copyright 2026 The Vue Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * `.main-thread` template sugar for main thread script bindings.
 *
 *   <view @tap.main-thread="onTap" />        -> :main-thread-bindtap="onTap"
 *   <view @tap.main-thread.catch="onTap" />  -> :main-thread-catchtap="onTap"
 *   <view :ref.main-thread="boxRef" />       -> :main-thread-ref="boxRef"
 *
 * The runtime already understands the `main-thread-*` props (see
 * nodeOps.patchProp); this transform only lets templates spell them the way
 * every other Vue binding is spelled. The handler itself still carries the
 * `'main thread'` directive so the worklet transform can extract it.
 */

import type {
  DirectiveNode,
  ElementNode,
  ExpressionNode,
  NodeTransform,
  TransformContext,
} from '@vue/compiler-core';
import {
  NodeTypes,
  createSimpleExpression,
  processExpression,
} from '@vue/compiler-core';

const MAIN_THREAD = 'main-thread';
const CATCH = 'catch';

/** Error code reported through the compiler's onError for misuse. */
export const MAIN_THREAD_MODIFIER_ERROR = 101;

function modifierNames(dir: DirectiveNode): string[] {
  return dir.modifiers.map((m) => (typeof m === 'string' ? m : m.content));
}

function staticArg(dir: DirectiveNode): string | null {
  const arg = dir.arg;
  return arg && arg.type === NodeTypes.SIMPLE_EXPRESSION && arg.isStatic
    ? arg.content
    : null;
}

function toBind(
  name: string,
  dir: DirectiveNode,
  exp: ExpressionNode | undefined,
): DirectiveNode {
  return {
    type: NodeTypes.DIRECTIVE,
    name: 'bind',
    rawName: `:${name}`,
    exp,
    arg: createSimpleExpression(name, true, dir.loc),
    modifiers: [],
    loc: dir.loc,
  };
}

/**
 * Vue's transformExpression leaves v-on handlers alone because transformOn
 * prefixes them itself; a handler turned into a bind prop has to be prefixed
 * here, or module-mode output references a bare identifier.
 */
function prefixHandler(
  exp: ExpressionNode,
  context: TransformContext,
): ExpressionNode {
  if (!context.prefixIdentifiers || exp.type !== NodeTypes.SIMPLE_EXPRESSION) {
    return exp;
  }
  return processExpression(exp, context);
}

export const mainThreadModifierTransform: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT) return;
  const el = node as ElementNode;

  const fail = (message: string, dir: DirectiveNode): void => {
    context.onError(
      Object.assign(new SyntaxError(`[vue-lynx] ${message}`), {
        code: MAIN_THREAD_MODIFIER_ERROR,
        loc: dir.loc,
      }),
    );
  };

  for (let i = 0; i < el.props.length; i++) {
    const prop = el.props[i]!;
    if (prop.type !== NodeTypes.DIRECTIVE) continue;
    const mods = modifierNames(prop);
    if (!mods.includes(MAIN_THREAD)) continue;

    const arg = staticArg(prop);

    if (prop.name === 'on' && arg !== null) {
      const extra = mods.find((m) => m !== MAIN_THREAD && m !== CATCH);
      if (extra !== undefined) {
        fail(
          `.main-thread cannot be combined with .${extra}; a main thread handler takes the event as is.`,
          prop,
        );
        continue;
      }
      if (!prop.exp) {
        fail(`@${arg}.main-thread needs a handler expression.`, prop);
        continue;
      }
      const kind = mods.includes(CATCH) ? 'catch' : 'bind';
      el.props[i] = toBind(
        `main-thread-${kind}${arg}`,
        prop,
        prefixHandler(prop.exp, context),
      );
      continue;
    }

    if (prop.name === 'bind' && arg === 'ref') {
      if (!prop.exp) {
        fail(':ref.main-thread needs a MainThreadRef expression.', prop);
        continue;
      }
      // v-bind expressions were already prefixed by transformExpression.
      el.props[i] = toBind('main-thread-ref', prop, prop.exp);
      continue;
    }

    fail(
      '.main-thread applies to v-on with a static event name (@tap.main-thread) and to :ref.main-thread.',
      prop,
    );
  }
};
