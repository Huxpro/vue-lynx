// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { NodeTransform } from '@vue/compiler-core';
import { ElementTypes, NodeTypes } from '@vue/compiler-core';

import {
  elementTemplateTransform,
  listItemTemplateTransform,
} from './compiler/element-template-transform.js';

// Structural views of @vue/compiler-core's AST nodes — the transform accepts
// `unknown` (it must tolerate whichever compiler copy vue-loader bundles),
// so these interfaces describe just the fields it touches.
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

const ELEMENT_NODE = NodeTypes.ELEMENT;
const NATIVE_ELEMENT_TAG = ElementTypes.ELEMENT;
const COMPONENT_TAG = ElementTypes.COMPONENT;

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
  // Widened to NodeTransform[]: transformPageElement takes `unknown` (it
  // must tolerate whichever compiler copy vue-loader bundles) and is
  // assignable to the stricter NodeTransform signature.
  nodeTransforms: [
    transformPageElement,
    listItemTemplateTransform,
  ] as NodeTransform[],
  whitespace: 'condense' as const,
  // Disable static hoisting: @vue/compiler-dom's stringifyStatic
  // transform converts runs of 5+ constant-prop siblings into a single
  // HTML string VNode requiring insertStaticContent() in the renderer.
  // Our ShadowElement custom renderer can't parse HTML strings, so we
  // disable hoisting entirely — the standard approach for non-DOM renderers.
  hoistStatic: false,
};

/**
 * Resolve the effective `enableElementTemplates` flag: element templates
 * default to following `enableIFR` (they attack the one cost IFR adds — the
 * synchronous main-thread render), with an explicit value winning either way.
 *
 * This is THE defaulting rule; every layer below receives the resolved
 * boolean rather than re-deriving it.
 */
export function resolveElementTemplatesFlag(options: {
  enableIFR?: boolean;
  enableElementTemplates?: boolean;
}): boolean {
  return options.enableElementTemplates ?? options.enableIFR ?? false;
}

/**
 * The Vue SFC compiler options for a resolved `enableElementTemplates` flag:
 * the shared Lynx options, plus the element-template lowering transform when
 * templates are enabled.
 */
export function resolveVueLynxCompilerOptions(
  enableElementTemplates: boolean,
): typeof vueLynxCompilerOptions {
  return enableElementTemplates
    ? {
      ...vueLynxCompilerOptions,
      nodeTransforms: [
        transformPageElement as NodeTransform,
        elementTemplateTransform,
        // Exit hooks run in reverse registration order. List-item lowering
        // must see the original subtree before the general template pass can
        // lower eligible descendants independently.
        listItemTemplateTransform,
      ],
    }
    : vueLynxCompilerOptions;
}
