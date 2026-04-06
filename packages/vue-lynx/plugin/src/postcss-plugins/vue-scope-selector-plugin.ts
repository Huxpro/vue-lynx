// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * PostCSS plugin to transform Vue scoped CSS selectors.
 *
 * Vue's scoped CSS uses attribute selectors like `[data-v-xxxxx]` to scope styles.
 * Lynx's CSS engine doesn't support attribute selectors, so we transform them
 * to class selectors `.v-xxxxx` which are fully supported.
 *
 * This plugin:
 * 1. Transforms `[data-v-xxxxx]` to `.v-xxxxx` in CSS selectors
 * 2. Only processes files from .vue SFCs
 * 3. Skips @keyframes rules (they don't need scoping)
 */

import type { AcceptedPlugin, Root } from 'postcss';

/**
 * Transform a CSS selector by replacing [data-v-xxxxx] with .v-xxxxx
 * Handles complex selectors with combinators and multiple attributes.
 */
function transformSelector(selector: string): string {
  // Replace [data-v-xxxxx] with .v-xxxxx
  // This regex matches the attribute selector and extracts the hash
  return selector.replace(/\[data-v-([a-f0-9]+)\]/g, '.v-$1');
}

export function vueScopeSelectorPlugin(): AcceptedPlugin {
  return {
    postcssPlugin: 'vue-scope-selector',
    Once(root: Root, { result }) {
      const from = root.source?.input.file;
      // Process files from .vue SFCs or any CSS that contains Vue scoped selectors
      // The source file might be the .vue file itself or an extracted style block
      const cssText = root.toString();
      const hasVueScopedSelectors = cssText.includes('[data-v-');

      if (!from?.includes('.vue') && !hasVueScopedSelectors) return;

      root.walkRules((rule) => {
        // Skip keyframes rules - they don't need selector transformation
        if (rule.parent?.type === 'atrule' && rule.parent.name === 'keyframes') {
          return;
        }

        // Transform the selector
        rule.selector = transformSelector(rule.selector);
      });
    },
  };
}
