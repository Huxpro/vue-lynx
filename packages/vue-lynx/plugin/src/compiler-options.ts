// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

interface CompilerElementNode {
  type: number;
  tag: string;
  tagType: number;
}

const ELEMENT_NODE = 1;
const COMPONENT_TAG = 1;

/** Rewrite the reserved Lynx page tag to Vue Lynx's transparent root component. */
export function transformPageElement(node: unknown): void {
  if (
    node != null
    && typeof node === 'object'
    && (node as CompilerElementNode).type === ELEMENT_NODE
    && (node as CompilerElementNode).tag === 'page'
  ) {
    const element = node as CompilerElementNode;
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
};
