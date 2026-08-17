// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Convert a Vue scope ID (data-v-xxxxx) to a Lynx cssId (numeric).
 *
 * Lives in vue-lynx/internal — the compile-time element-template lowering
 * and the scoped-CSS build plugin must derive identical ids.
 */
export { scopeIdToCssId } from 'vue-lynx/internal/ops';

/** Scope class shared by Vue-compiled deep/slotted CSS and runtime elements. */
export function scopeIdToClass(scopeId: string): string | null {
  return scopeId.startsWith('data-v-') ? scopeId.slice('data-'.length) : null;
}

/** Slotted scope ids participate in common CSS only, never native cssId. */
export function isSlottedScopeId(scopeId: string): boolean {
  return scopeIdToClass(scopeId)?.endsWith('-s') === true;
}
