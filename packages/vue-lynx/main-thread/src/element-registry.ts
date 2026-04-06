// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/** Map from BG-thread ShadowElement id to Lynx Main Thread element handle */
export const elements = new Map<number, LynxElement>();

/**
 * Map from element id to its scope class (for Vue scoped CSS).
 * The scope class is derived from the component's scope ID and is used
 * to match transformed CSS selectors.
 */
export const elementScopeClasses = new Map<number, string>();

/**
 * PAPI unique ID of the root PageElement.
 * Passed as `parentComponentUniqueId` to element creation PAPI calls.
 * `__SetCSSId` sets `css_style_sheet_manager_` directly on each element,
 * so CSS rendering works without a ComponentElement ancestor.
 */
export let pageUniqueId = 1;

export function setPageUniqueId(id: number): void {
  pageUniqueId = id;
}
