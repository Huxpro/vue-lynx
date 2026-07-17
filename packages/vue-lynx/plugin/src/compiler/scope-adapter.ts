// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Scope-emission adapter for the element-template transform.
 *
 * This is the ONLY seam through which the transform knows how scoped CSS
 * reaches a baked (lowered) element. The unified lineage keeps Lynx's common
 * cssId for selector matching and rides Vue scope tokens on classes.
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

/** Default adapter: common cssId plus Vue scope class token. */
export const classTokenScopeAdapter: TemplateScopeAdapter = {
  elementScopeStatements(varName, scopeId) {
    // Later baked static class writes can overwrite this token; that transform
    // ordering remains an accepted limitation until class merging is revisited.
    const stmts = [`__SetCSSId([${varName}], 0);`];
    if (scopeId != null) {
      stmts.push(`__SetClasses(${varName}, ${JSON.stringify(scopeId)});`);
    }
    return stmts;
  },
};

/** @deprecated Temporary alias for older transform imports during unification. */
export const cssIdScopeAdapter = classTokenScopeAdapter;
