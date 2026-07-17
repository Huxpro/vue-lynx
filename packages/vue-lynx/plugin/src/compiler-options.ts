// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Structural mirrors of @vue/compiler-core's AST types. The plugin does not
// depend on @vue/compiler-core directly (it arrives transitively through
// @rsbuild/plugin-vue), and pnpm's strict node_modules would make even a
// type-only import unresolvable — so we mirror the handful of numeric enum
// values we need. Values are stable public API:
//   NodeTypes.ROOT = 0, NodeTypes.ELEMENT = 1
//   ElementTypes.ELEMENT = 0 (native), ElementTypes.COMPONENT = 1
interface CompilerElementNode {
  type: number;
  tag: string;
  tagType: number;
  loc?: unknown;
}

interface CompilerTransformContext {
  parent: { type: number; tagType?: number } | null;
  onError(error: Error): void;
}

const ELEMENT_NODE = 1;
const NATIVE_ELEMENT_TAG = 0;
const COMPONENT_TAG = 1;

/**
 * Rewrite the reserved Lynx page tag to Vue Lynx's transparent root component.
 *
 * Also enforces at compile time that `<page>` is not nested inside a native
 * element — a page inside a `<view>` can never be the native root, so failing
 * the build beats a runtime error toast on device. Nesting under a component
 * (`<Transition>`, custom wrappers) cannot be decided statically and is left
 * to the runtime ownership check.
 */
export function transformPageElement(
  node: unknown,
  context?: CompilerTransformContext,
): void {
  if (
    node != null
    && typeof node === 'object'
    && (node as CompilerElementNode).type === ELEMENT_NODE
    && (node as CompilerElementNode).tag === 'page'
  ) {
    const element = node as CompilerElementNode;

    // Only a native-element parent is a definite violation. ROOT is the legal
    // position; IF_BRANCH/FOR parents wrap root-level v-if/v-for pages; and a
    // component parent can't be decided statically.
    const parent = context?.parent;
    if (
      parent
      && parent.type === ELEMENT_NODE
      && parent.tagType === NATIVE_ELEMENT_TAG
    ) {
      context?.onError(
        Object.assign(
          new SyntaxError(
            '[vue-lynx] <page> must be the outermost element of the screen; '
              + 'it cannot be nested inside another element.',
          ),
          { code: 100, loc: element.loc },
        ),
      );
      return;
    }

    element.tag = 'VueLynxPage';
    element.tagType = COMPONENT_TAG;
  }
}

/** Shared Vue SFC compiler options for the Lynx custom renderer. */
export const vueLynxCompilerOptions = {
  // Lynx native tags (view, text, image, etc.) should not be resolved
  // via resolveComponent — treat everything as native.
  isNativeTag: () => true,
  nodeTransforms: [transformPageElement],
  whitespace: 'condense' as const,
  // Disable static hoisting: @vue/compiler-dom's stringifyStatic
  // transform converts runs of 5+ constant-prop siblings into a single
  // HTML string VNode requiring insertStaticContent() in the renderer.
  // Our ShadowElement custom renderer can't parse HTML strings, so we
  // disable hoisting entirely — the standard approach for non-DOM renderers.
  hoistStatic: false,
  // Vapor only: compile events as per-element `on()` listeners instead of
  // Solid-style document-level delegation — Lynx has no document to delegate
  // to. Ignored by the vdom compiler.
  eventDelegation: false,
};
