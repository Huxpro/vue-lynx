// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { onScopeDispose, shallowRef, watch } from '@vue/runtime-core';
import type { Ref, ShallowRef } from '@vue/runtime-core';

/**
 * Vue analogue of React's `useSyncExternalStore` for subscribe/getSnapshot
 * stores (`MessageStore`, `Resource`). Returns a shallow ref that tracks the
 * store's snapshot; the subscription is torn down with the current effect
 * scope (component unmount).
 */
export function useExternalStore<T>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => T,
): Readonly<ShallowRef<T>> {
  const state = shallowRef(getSnapshot());
  const dispose = subscribe(() => {
    state.value = getSnapshot();
  });
  onScopeDispose(dispose, true);
  return state;
}

/**
 * Like {@link useExternalStore} but for a store that is itself reactive
 * (passed as a ref/getter). Re-subscribes when the source store changes.
 */
export function useExternalStoreFrom<S, T>(
  source: () => S,
  subscribe: (store: S, cb: () => void) => () => void,
  getSnapshot: (store: S) => T,
): Readonly<Ref<T>> {
  const state = shallowRef(getSnapshot(source())) as Ref<T>;
  watch(
    source,
    (store, _prev, onCleanup) => {
      state.value = getSnapshot(store);
      const dispose = subscribe(store, () => {
        state.value = getSnapshot(store);
      });
      onCleanup(dispose);
    },
    { immediate: true },
  );
  return state;
}
