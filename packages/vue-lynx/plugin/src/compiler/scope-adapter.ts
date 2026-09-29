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

  /**
   * Class tokens that carry the component's CSS scope on every element of
   * the template. The transform owns all class writes: it bakes these tokens
   * together with an element's static class in ONE `__SetClasses` (a
   * separate write would overwrite the other), and appends them to dynamic
   * `class` hole values (a hole's SET_CLASS replaces the whole class list).
   * Optional — adapters whose scope model does not use classes omit it.
   */
  scopeClassTokens?(scopeId: string): string[];
}

/** Default adapter: common cssId plus Vue scope class token. */
export const classTokenScopeAdapter: TemplateScopeAdapter = {
  elementScopeStatements(varName) {
    return [`__SetCSSId([${varName}], 0);`];
  },
  scopeClassTokens(scopeId) {
    return [scopeId];
  },
};

/** @deprecated Temporary alias for older transform imports during unification. */
export const cssIdScopeAdapter = classTokenScopeAdapter;
