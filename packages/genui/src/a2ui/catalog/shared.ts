// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Runtime prop names shared by every catalog component (see
 * `GenericComponentProps` in `../store/types.ts`). Catalog components are
 * declared with array-syntax props so values pass through untyped and
 * uncoerced — mirroring how the ReactLynx originals receive protocol props.
 *
 * @internal
 */
export const GENERIC_COMPONENT_PROPS: string[] = [
  'id',
  'surface',
  'setValue',
  'sendAction',
  'dataContextPath',
  // Protocol bookkeeping fields spread through by the renderer. Declared so
  // they are absorbed as props instead of leaking into attrs (fragment-rooted
  // components would warn about non-inheritable attributes otherwise).
  'component',
  'weight',
  '__template',
];

/**
 * Build a catalog component's prop-name list: the generic runtime props
 * plus the component-specific ones.
 *
 * @internal
 */
export function catalogProps(...names: string[]): string[] {
  return [...GENERIC_COMPONENT_PROPS, ...names];
}
