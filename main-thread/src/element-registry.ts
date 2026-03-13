// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/** Map from BG-thread ShadowElement id to Lynx Main Thread element handle */
export const elements = new Map<number, LynxElement>();

/**
 * Unique ID of the root ComponentElement created in renderPage.
 * Used as `parentComponentUniqueId` for all element creation so that
 * DevTool can resolve CSS selectors via the component's style_sheet_manager.
 */
export let rootComponentUniqueId = 1; // default fallback to page root

export function setRootComponentUniqueId(id: number): void {
  rootComponentUniqueId = id;
}
