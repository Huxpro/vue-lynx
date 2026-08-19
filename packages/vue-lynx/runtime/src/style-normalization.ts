// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const DIMENSIONLESS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexOrder',
  'order',
  'opacity',
  'zIndex',
  'aspectRatio',
  'fontWeight',
  'lineClamp',
]);

const NUMERIC_VALUE = /^-?(?:\d+\.?\d*|\.\d+)$/;
const _warnedProps: Set<string> | undefined = __DEV__ ? new Set() : undefined;

export function normalizeStylePropertyName(name: string): string {
  if (name.startsWith('--')) return name;
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function numericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && NUMERIC_VALUE.test(value.trim())) {
    return Number(value);
  }
  return undefined;
}

export function normalizeStyleValue(
  property: string,
  value: unknown,
): unknown {
  if (property.startsWith('--')) return value;
  const numeric = numericValue(value);
  if (numeric === undefined) return value;

  // TODO(huxpro): Remove this workaround once the Lynx engine fixes
  // inline style object handling for `flex: 1`.
  if (property === 'flex') return `${numeric}`;

  if (__VUE_LYNX_AUTO_PIXEL_UNIT__ && !DIMENSIONLESS.has(property)) {
    if (__DEV__ && numeric !== 0 && !_warnedProps!.has(property)) {
      _warnedProps!.add(property);
      console.warn(
        `[vue-lynx] Numeric style value detected (${property}: ${numeric} → "${numeric}px"). `
        + 'This auto-conversion is deprecated and will be removed in the next major version. '
        + 'Use string values with explicit units instead.',
      );
    }
    return numeric === 0 ? 0 : `${numeric}px`;
  }

  return typeof value === 'string' ? value.trim() : numeric;
}

export function normalizeStyleObject(
  style: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const rawProperty of Object.keys(style)) {
    const property = normalizeStylePropertyName(rawProperty);
    normalized[property] = normalizeStyleValue(property, style[rawProperty]);
  }
  return normalized;
}
