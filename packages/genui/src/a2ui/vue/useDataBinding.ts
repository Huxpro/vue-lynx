// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { computed } from '@vue/runtime-core';
import type { ComputedRef } from '@vue/runtime-core';

import type { CatalogFunctionEntry } from '../catalog/defineCatalog.js';
import type { MessageProcessor } from '../store/MessageProcessor.js';
import {
  resolveBindingPath,
  resolveDeepValue,
  resolveDynamicValue,
} from '../store/resolveDynamic.js';
import { executeFunctionCall } from '../store/resolveFunctionCall.js';
import type { Surface } from '../store/types.js';
import {
  isCallExpression,
  isFunctionCall,
  isPlainDataBinding,
} from '../store/utils.js';

const UNSUPPORTED_PROP = Symbol('a2ui.unsupported');

function resolveBoundPath(
  dynamicValue: unknown,
  dataContextPath: string | undefined,
): { path: string | undefined; initialValue: unknown } {
  let path: string | undefined;
  let initialValue: unknown;

  if (
    typeof dynamicValue === 'string'
    || typeof dynamicValue === 'number'
    || typeof dynamicValue === 'boolean'
  ) {
    // Preserve primitive type. A static `false` must stay falsy and
    // numeric props must stay numeric — stringifying breaks consumers that
    // expect `boolean | number` (e.g., `if (props.disabled)`).
    initialValue = dynamicValue;
  } else if (
    dynamicValue
    && typeof dynamicValue === 'object'
    && 'path' in dynamicValue
  ) {
    path = (dynamicValue as Record<string, unknown>)['path'] as
      | string
      | undefined;
  }

  if (path && !path.startsWith('/')) {
    path = dataContextPath ? `${dataContextPath}/${path}` : `/${path}`;
  }
  return { path, initialValue };
}

/**
 * Subscribe to a data-model binding and return the current value at that
 * path. The Vue analogue of upstream `useDataBinding` — inputs arrive as
 * getters so the returned computeds stay live across prop updates.
 *
 * Returns `[value, setValue, path]` where `value` and `path` are computeds.
 */
export function useDataBinding<T = unknown>(
  dynamicValue: () => unknown,
  surface: () => Surface | undefined,
  dataContextPath?: () => string | undefined,
  fallbackValue?: T,
): readonly [
  ComputedRef<T | undefined>,
  (newValue: T) => void,
  ComputedRef<string | undefined>,
] {
  const bound = computed(() =>
    resolveBoundPath(dynamicValue(), dataContextPath?.())
  );
  const path = computed(() => bound.value.path);

  const currentValue = computed(() => {
    const { path: p, initialValue } = bound.value;
    const store = surface()?.store;
    if (p && store) {
      const signal = store.getSignal(
        p,
        typeof initialValue === 'string' ? initialValue : undefined,
      );
      return (signal.value as T | undefined)
        ?? (initialValue as T | undefined)
        ?? fallbackValue;
    }
    if (p) return fallbackValue;
    return (initialValue as T | undefined) ?? fallbackValue;
  });

  const setValue = (newValue: T) => {
    const p = bound.value.path;
    const s = surface();
    if (p && s?.store) {
      s.store.update(p, newValue);
    }
  };

  return [currentValue, setValue, path] as const;
}

/**
 * Split component props into values the renderer can resolve and values that
 * still contain unsupported dynamic syntax.
 *
 * @internal
 */
export function splitUnsupportedProps(
  properties: Record<string, unknown> | undefined,
): {
  unsupportedFields: string[];
  displayProps: Record<string, unknown> | undefined;
} {
  const unsupportedFields: string[] = [];
  if (!properties) {
    return { unsupportedFields, displayProps: properties };
  }

  const nextProps: Record<string, unknown> = {};
  let changed = false;
  for (const [key, value] of Object.entries(properties)) {
    if (value === UNSUPPORTED_PROP) {
      unsupportedFields.push(key);
      changed = true;
      continue;
    }
    nextProps[key] = value;
  }

  return {
    unsupportedFields,
    displayProps: changed ? nextProps : properties,
  };
}

/**
 * Resolve data bindings and function calls inside a component prop object.
 *
 * @internal
 */
export function resolveProperties(
  properties: Record<string, unknown>,
  surface: Surface | undefined,
  dataContextPath?: string,
  processor?: MessageProcessor,
  functions?: readonly CatalogFunctionEntry[],
  previousResolved?: Record<string, unknown>,
): Record<string, unknown> {
  if (!properties) return properties;
  return resolveDeepValue(
    properties,
    previousResolved,
    (leaf) => {
      if (isFunctionCall(leaf) && surface && processor) {
        return resolveDynamicValue(
          processor,
          leaf,
          surface.surfaceId,
          dataContextPath,
          {
            functions,
            resolveFunctionCall: executeFunctionCall,
          },
        );
      }

      if (isPlainDataBinding(leaf)) {
        const rawPath = (leaf as Record<string, unknown>)['path'] as
          | string
          | undefined;
        const path = resolveBindingPath(rawPath ?? '', dataContextPath);
        if (path && surface?.store) {
          const signal = surface.store.getSignal(path);
          return signal.value;
        }
        return undefined;
      }

      if (isCallExpression(leaf)) {
        return UNSUPPORTED_PROP;
      }

      return leaf;
    },
  ) as Record<string, unknown>;
}

function shallowEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  if (a === b) return true;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

/**
 * Resolve a component's dynamic props and keep the result in sync with
 * signal-backed data model changes. Store signals are read inside the
 * computed, so Vue tracks them natively — no external subscription needed.
 */
export function useResolvedProps(
  properties: () => Record<string, unknown>,
  surface: () => Surface | undefined,
  dataContextPath?: () => string | undefined,
  processor?: MessageProcessor,
  functions?: () => readonly CatalogFunctionEntry[] | undefined,
): readonly [
  ComputedRef<Record<string, unknown>>,
  (key: string, value: unknown) => void,
] {
  let cache: Record<string, unknown> | null = null;

  const resolved = computed(() => {
    const next = resolveProperties(
      properties(),
      surface(),
      dataContextPath?.(),
      processor,
      functions?.(),
      cache ?? undefined,
    );
    if (cache && shallowEqual(cache, next)) {
      return cache;
    }
    cache = next;
    return next;
  });

  const setValue = (key: string, value: unknown) => {
    const prop = properties()?.[key];
    if (isPlainDataBinding(prop)) {
      const rawPath = (prop as Record<string, unknown>)['path'] as
        | string
        | undefined;
      const path = resolveBindingPath(rawPath ?? '', dataContextPath?.());
      const s = surface();
      if (path && s?.store) {
        s.store.update(path, value);
      }
    }
  };

  return [resolved, setValue] as const;
}
