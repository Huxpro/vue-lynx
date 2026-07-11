// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Preact-signals-shaped adapter over `@vue/reactivity`.
//
// The upstream `@lynx-js/genui` store layer is written against
// `@preact/signals` (`signal` / `computed` / `effect` / `batch`). The Vue
// port keeps the exact same call shape so the store code stays diffable
// against upstream, but backs it with Vue's reactivity so values read inside
// Vue render functions / computeds are tracked natively — no external-store
// subscriptions needed for data-model updates.
import {
  computed as vueComputed,
  effect as vueEffect,
  shallowRef,
} from '@vue/reactivity';

/**
 * Minimal mutable signal surface used by the ported store code. Backed by a
 * Vue `shallowRef`, so reads inside render/computed contexts are tracked.
 */
export interface Signal<T = unknown> {
  value: T;
}

/**
 * Read-only signal surface (result of {@link computed}).
 */
export interface ReadonlySignal<T = unknown> {
  readonly value: T;
}

/**
 * Create a mutable signal. Equivalent of `signal()` from `@preact/signals`.
 */
export function signal<T>(value: T): Signal<T> {
  return shallowRef(value) as Signal<T>;
}

/**
 * Create a lazily-evaluated cached derived signal. Equivalent of
 * `computed()` from `@preact/signals`.
 */
export function computed<T>(fn: () => T): ReadonlySignal<T> {
  return vueComputed(fn) as ReadonlySignal<T>;
}

/**
 * Run `fn` immediately and re-run it whenever any signal it read changes.
 * Returns a disposer. Equivalent of `effect()` from `@preact/signals`.
 */
export function effect(fn: () => void): () => void {
  const runner = vueEffect(fn);
  return () => {
    runner.effect.stop();
  };
}

/**
 * Batch signal writes. Vue's reactivity triggers per-write but component
 * re-renders are scheduler-batched, so a passthrough preserves semantics;
 * kept so ported call sites stay identical to upstream.
 */
export function batch<T>(fn: () => T): T {
  return fn();
}
