// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { scopeIdToCssId } from 'vue-lynx/internal/ops';

/**
 * Scope-emission adapter for the element-template transform.
 *
 * This is the ONLY seam through which the transform knows how scoped CSS
 * reaches a baked (lowered) element. On this lineage every element is
 * associated with a numeric cssId at creation time (`__SetCSSId`), mirroring
 * what the runtime does through the SET_SCOPE_ID op, `scope-bridge.ts`, and
 * `vue-scoped-cssid-plugin.ts`. The vapor lineage retires that machinery
 * entirely and rides scope tokens on class names instead — per the merge
 * coordination plan (issue #230), unification swaps this adapter and leaves
 * the transform body untouched.
 */
export interface TemplateScopeAdapter {
  /**
   * Source statements baked into a template's `create()` right after the
   * element bound to `varName` is created, associating it with the
   * component's CSS scope.
   *
   * @param varName - generated local holding the element handle (e.g. `e0`)
   * @param scopeId - the component's Vue scope id (`data-v-xxxxxxxx`), or
   *   `null` for unscoped components. Adapters must emit the unscoped
   *   association too when their scope model needs one (cssId 0 here).
   */
  elementScopeStatements(varName: string, scopeId: string | null): string[];
}

/** Default adapter: numeric cssId association via `__SetCSSId`. */
export const cssIdScopeAdapter: TemplateScopeAdapter = {
  elementScopeStatements(varName, scopeId) {
    const cssId = scopeId != null ? scopeIdToCssId(scopeId) : 0;
    return [`__SetCSSId([${varName}], ${cssId});`];
  },
};
