// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Convert a Vue scope ID (data-v-xxxxx) to a Lynx cssId (numeric).
 * Vue uses 8-char hex hash strings.  Lynx engine uses int32 for cssId,
 * so we mask to 0x7fffffff to stay within the positive int32 range.
 */
export function scopeIdToCssId(scopeId: string): number {
  const hex = scopeId.replace(/^data-v-/, '');
  return Number.parseInt(hex, 16) & 0x7fffffff;
}
