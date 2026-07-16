// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Pure Vapor application entry — published as `vue-lynx/vapor`
 * (the source file keeps its historical name).
 *
 * When `pluginVueLynx({ vapor: true })` is set, 'vue' is aliased to this
 * module. It provides everything a Vapor app imports from 'vue' — the shared
 * runtime-core surface (reactivity, lifecycle, watch, …), vue-lynx's Lynx
 * utilities, and the Vapor helper surface — **without** the vdom renderer.
 *
 * vue-lynx does not support mixing vdom and Vapor components in one app
 * (upstream's `vaporInteropPlugin` is hard-wired to the browser renderer),
 * so the mode is a per-app build-time decision and each entry ships exactly
 * one runtime:
 *
 *  - `vue-lynx`        → vdom custom renderer only
 *  - `vue-lynx/vapor`  → Vapor runtime only (this module)
 *
 * vdom-only APIs (`h`, `Transition`, `vShow`, `vModelText`, `Teleport`,
 * `KeepAlive`, `Suspense`, `useCssVars`, …) are intentionally absent: in
 * Vapor mode their counterparts are the compiler-resolved Vapor variants
 * (`VaporTransition`, `applyVShow`, `applyTextModel`, `useVaporCssVars`, …),
 * and importing a vdom-only name should fail at build time, not misbehave at
 * runtime.
 */

// ---------------------------------------------------------------------------
// Shared runtime-core surface (reactivity, lifecycle, DI, scopes, macros)
// ---------------------------------------------------------------------------

import {
  onActivated as _onActivated,
  onBeforeMount as _onBeforeMount,
  onBeforeUnmount as _onBeforeUnmount,
  onBeforeUpdate as _onBeforeUpdate,
  onDeactivated as _onDeactivated,
  onMounted as _onMounted,
  onUnmounted as _onUnmounted,
  onUpdated as _onUpdated,
} from '@vue/runtime-core';

import { ifrInert, loadWorkletRuntime } from './ifr-env.js';

export const onMounted: typeof _onMounted = ifrInert(_onMounted);
export const onBeforeMount: typeof _onBeforeMount = ifrInert(_onBeforeMount);
export const onUnmounted: typeof _onUnmounted = ifrInert(_onUnmounted);
export const onBeforeUnmount: typeof _onBeforeUnmount = ifrInert(
  _onBeforeUnmount,
);
export const onUpdated: typeof _onUpdated = ifrInert(_onUpdated);
export const onBeforeUpdate: typeof _onBeforeUpdate = ifrInert(
  _onBeforeUpdate,
);
export const onActivated: typeof _onActivated = ifrInert(_onActivated);
export const onDeactivated: typeof _onDeactivated = ifrInert(_onDeactivated);
export { loadWorkletRuntime };

export {
  // reactivity
  computed,
  customRef,
  reactive,
  readonly,
  ref,
  shallowReactive,
  shallowRef,
  shallowReadonly,
  toRaw,
  toRef,
  toRefs,
  toValue,
  triggerRef,
  unref,
  isRef,
  isReactive,
  isReadonly,
  isProxy,
  isShallow,
  markRaw,
  // lifecycle
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered,
  // watchers
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  onWatcherCleanup,
  // dependency injection
  inject,
  provide,
  hasInjectionContext,
  // effect scopes
  effectScope,
  getCurrentScope,
  onScopeDispose,
  // component utilities (typing helpers / compiler macros compile away)
  defineComponent,
  getCurrentInstance,
  useId,
  useModel,
  useSlots,
  useAttrs,
  useTemplateRef,
  defineProps,
  defineEmits,
  defineExpose,
  defineOptions,
  defineModel,
  defineSlots,
  withDefaults,
  // misc shared helpers (also used by compiled template code)
  version,
  mergeProps,
  toDisplayString,
  camelize,
  capitalize,
  normalizeClass,
  normalizeStyle,
  normalizeProps,
} from '@vue/runtime-core';

export type * from '@vue/runtime-core';

// ---------------------------------------------------------------------------
// vue-lynx shared utilities (no vdom renderer involved)
// ---------------------------------------------------------------------------

export { nextTick } from './next-tick.js';
// Vapor owns its component-instance state through @vue/runtime-dom. Reuse its
// helper so CSS modules read from the same current-instance singleton.
export { useCssModule } from '@vue/runtime-dom';
export { withKeys, withModifiers } from './event-modifiers.js';
export {
  MainThreadRef,
  useMainThreadRef,
} from './main-thread-ref.js';
export { runOnMainThread } from './cross-thread.js';
export { runOnBackground } from './run-on-background.js';
export { transformToWorklet } from './transform-to-worklet.js';
export { ShadowElement, createPageRoot } from './shadow-element.js';
export type { VueLynxApp } from './index.js';

// ---------------------------------------------------------------------------
// Vapor surface (helpers imported by compiled vapor components + app APIs)
// ---------------------------------------------------------------------------

export * from './vapor/index.js';

// In a pure Vapor app, `createApp` IS `createVaporApp` — no runtime routing.
export { createVaporApp as createApp } from './vapor/index.js';
