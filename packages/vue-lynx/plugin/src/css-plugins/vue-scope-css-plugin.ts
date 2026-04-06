// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * CSS serializer plugin to transform Vue scoped CSS selectors.
 *
 * This plugin is used by @lynx-js/css-extract-webpack-plugin to transform
 * Vue's [data-v-xxx] attribute selectors to .v-xxx class selectors.
 *
 * Note: This uses css-tree AST (not PostCSS).
 */

import { csstree } from '@lynx-js/css-serializer';
import type { Plugin } from '@lynx-js/css-serializer';
import type * as csstreeTypes from 'css-tree';

/**
 * Transform a CSS selector by replacing [data-v-xxxxx] with .v-xxxxx
 */
function transformSelector(selector: string): string {
  return selector.replace(/\[data-v-([a-f0-9]+)\]/g, '.v-$1');
}

/**
 * Collect all selector nodes that need transformation.
 * We collect first, then transform, to avoid issues with modifying while iterating.
 */
function collectSelectors(node: any, selectors: any[]): void {
  if (node.type === 'SelectorList' || node.type === 'Selector') {
    const selectorStr = csstree.generate(node);
    if (selectorStr.includes('[data-v-')) {
      selectors.push(node);
    }
  }

  if (node.children && typeof node.children.forEach === 'function') {
    node.children.forEach((child: any) => collectSelectors(child, selectors));
  }
}

/**
 * Transform a single selector node.
 */
function transformSelectorNode(node: any): void {
  const originalSelector = csstree.generate(node);
  const transformedSelector = transformSelector(originalSelector);

  if (originalSelector !== transformedSelector) {
    // Parse the transformed selector to get a new AST
    const parsed: any = csstree.parse(transformedSelector, {
      context: node.type === 'SelectorList' ? 'selectorList' : 'selector',
    });

    // Copy the parsed children to the original node
    if (parsed && parsed.children && node.children) {
      // Clear the original children
      node.children.clear();
      // Append the new children
      for (const child of parsed.children) {
        node.children.append(child);
      }
    }
  }
}

/**
 * Walk the CSS AST and transform attribute selectors to class selectors.
 */
function transformStyleSheet(root: csstreeTypes.StyleSheet): void {
  const selectors: any[] = [];
  collectSelectors(root, selectors);

  // Transform collected selectors
  for (const selector of selectors) {
    transformSelectorNode(selector);
  }
}

export function createVueScopeCSSPlugin(): Plugin {
  return {
    name: 'vue-scope-selector',
    phaseStandard(root: csstreeTypes.StyleSheet) {
      // Check if this CSS has Vue scoped selectors
      const cssText = csstree.generate(root);
      if (!cssText.includes('[data-v-')) {
        return;
      }

      transformStyleSheet(root);
    },
  };
}
