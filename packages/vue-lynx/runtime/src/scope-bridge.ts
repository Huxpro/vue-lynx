// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { getCurrentInstance } from '@vue/runtime-core';

/**
 * Get the current component's scope ID from Vue's internal state.
 * This is set by vue-loader when the component has <style scoped>.
 */
export function getCurrentScopeId(): string | undefined {
  const instance = getCurrentInstance();
  if (!instance) return undefined;
  return (instance.type as any).__scopeId;
}

/**
 * Convert a Vue scope ID (data-v-xxxxx) to a Lynx cssId (numeric).
 * Vue uses hex hash strings, Lynx uses numeric cssId for __SetCSSId.
 */
export function scopeIdToCssId(scopeId: string): number {
  const hex = scopeId.replace(/^data-v-/, '');
  return parseInt(hex, 16);
}
