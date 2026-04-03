// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * vue-lynx
 *
 * Vue 3 custom renderer for Lynx's Background Thread.
 *
 * Usage:
 *   import { createApp, ref, h, defineComponent } from 'vue-lynx'
 *
 * This module re-exports Vue's reactivity / component APIs and provides a
 * custom createApp() that mounts into a ShadowElement tree and flushes DOM
 * operations to the Main Thread via callLepusMethod('vuePatchUpdate', ...).
 */

import {
  nextTick as _vueNextTick,
  createRenderer,
  // Re-export types need explicit imports for isolatedDeclarations
} from '@vue/runtime-core';
import type {
  App,
  Component,
  ComponentPublicInstance,
  ObjectDirective,
  VNode,
} from '@vue/runtime-core';

import { runOnMainThread } from './cross-thread.js';
import { register, unregister, updateHandler, resetRegistry } from './event-registry.js';
import { resetFlushState, scheduleFlush, waitForFlush } from './flush.js';
import { resetFunctionCallState } from './function-call.js';
import {
  MainThreadRef,
  resetMainThreadRefState,
  useMainThreadRef,
} from './main-thread-ref.js';
import { nodeOps, resetNodeOpsState } from './node-ops.js';
import { OP, pushOp, takeOps } from './ops.js';
import {
  resetRunOnBackgroundState,
  runOnBackground,
} from './run-on-background.js';
import { ShadowElement, createPageRoot } from './shadow-element.js';
import { transformToWorklet } from './transform-to-worklet.js';
import { Transition } from './Transition.js';
import { TransitionGroup } from './TransitionGroup.js';

export type { App, Component, ComponentPublicInstance };

const _renderer = createRenderer<ShadowElement, ShadowElement>(nodeOps);
const _createApp = _renderer.createApp;

/** @internal Raw renderer render function — only for upstream-tests bridge. */
export const _render: (
  vnode: import('@vue/runtime-core').VNode | null,
  container: ShadowElement,
) => void = _renderer.render;

// ===========================================================================
// Vue Lynx APIs
// ===========================================================================

/**
 * A Vue Lynx application instance returned by {@link createApp}.
 *
 * @public
 */
export interface VueLynxApp {
  /**
   * Mount the root component onto the Lynx page root.
   *
   * Unlike Vue on the web, there is no container selector — Lynx has a single
   * page root and all content is always mounted there.
   */
  mount(): void;
  /** Unmount the application and clean up all components. */
  unmount(): void;
  /** Install a Vue plugin. */
  use(plugin: unknown, ...options: unknown[]): VueLynxApp;
  /** Provide a value that can be injected by descendant components. */
  provide(key: unknown, value: unknown): VueLynxApp;
  /** The application-level configuration object (same as Vue's `app.config`). */
  config: App['config'];
  [key: string]: unknown;
}

/**
 * Create a Vue Lynx application instance.
 *
 * @param rootComponent - The root Vue component
 * @param rootProps - Optional props to pass to the root component
 * @returns A {@link VueLynxApp} instance
 *
 * @example
 * ```ts
 * import { createApp } from 'vue-lynx';
 * import App from './App.vue';
 *
 * createApp(App).mount();
 * ```
 *
 * @public
 */
export function createApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown>,
): VueLynxApp {
  const internalApp = _createApp(rootComponent, rootProps);

  const app: VueLynxApp = {
    get config() {
      return internalApp.config;
    },

    use(plugin: unknown, ...options: unknown[]): VueLynxApp {
      internalApp.use(plugin as Parameters<App['use']>[0], ...options);
      return app;
    },

    provide(key: unknown, value: unknown): VueLynxApp {
      internalApp.provide(
        key,
        value,
      );
      return app;
    },

    mount(): void {
      const root = createPageRoot();
      internalApp.mount(root);
    },

    unmount(): void {
      internalApp.unmount();
    },
  };

  return app;
}

/**
 * Wait for the next DOM update flush **and** the main-thread ops acknowledgement.
 *
 * Unlike standard Vue's `nextTick` which only waits for the scheduler flush,
 * Vue Lynx's version also waits for the main thread to apply the ops, so
 * native Lynx elements are fully materialised when the callback fires.
 *
 * @param fn - Optional callback to execute after flush
 * @returns A promise that resolves when the main thread has applied all pending ops
 *
 * @see {@link https://vuejs.org/api/general.html#nexttick | Vue nextTick} — Vue Lynx extends the standard behavior.
 *
 * @public
 */
export function nextTick(fn?: () => void): Promise<void> {
  if (fn) {
    return _vueNextTick()
      .then(() => waitForFlush())
      .then(fn);
  }
  return _vueNextTick().then(() => waitForFlush());
}

export {
  MainThreadRef,
  useMainThreadRef,
  runOnMainThread,
  runOnBackground,
  transformToWorklet,
};

/** @internal Exposed for upstream-tests bridge render(). */
export { createPageRoot } from './shadow-element.js';

// ---------------------------------------------------------------------------
// v-show directive (Vue Lynx implementation)
// ---------------------------------------------------------------------------

function applyVShow(el: ShadowElement, value: unknown): void {
  el._vShowHidden = !value;
  const style = el._vShowHidden ? { ...el._style, display: 'none' } : el._style;
  pushOp(OP.SET_STYLE, el.id, style);
  scheduleFlush();
}

/**
 * Vue Lynx implementation of the `v-show` directive.
 *
 * Toggles the element's visibility by setting `display: none` on the native
 * Lynx element's style. Unlike the DOM version, this operates on
 * {@link ShadowElement} and sends style ops to the main thread.
 *
 * @see {@link https://vuejs.org/api/built-in-directives.html#v-show | Vue v-show}
 *
 * @public
 */
export const vShow: ObjectDirective<ShadowElement, unknown> = {
  beforeMount(el, { value }) {
    applyVShow(el, value);
  },
  updated(el, { value, oldValue }) {
    if (value !== oldValue) applyVShow(el, value);
  },
};

// ===========================================================================
// Vue Core Re-exports — Composition API
// ===========================================================================
//
// These are standard Vue 3 APIs re-exported from vue-lynx for convenience.
// See https://vuejs.org/api/ for full documentation.

/**
 * Takes a getter function and returns a readonly reactive ref object for the
 * returned value from the getter.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#computed | Vue docs}
 * @public
 */
export { computed } from '@vue/runtime-core';

/**
 * Creates a customized ref with explicit control over its dependency tracking
 * and updates triggering.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#customref | Vue docs}
 * @public
 */
export { customRef } from '@vue/runtime-core';

/**
 * Returns a reactive proxy of the object.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#reactive | Vue docs}
 * @public
 */
export { reactive } from '@vue/runtime-core';

/**
 * Takes an object (reactive or plain) or a ref and returns a readonly proxy
 * to the original.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#readonly | Vue docs}
 * @public
 */
export { readonly } from '@vue/runtime-core';

/**
 * Takes an inner value and returns a reactive and mutable ref object.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#ref | Vue docs}
 * @public
 */
export { ref } from '@vue/runtime-core';

/**
 * Shallow version of {@link reactive}. Only the root level properties are reactive.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#shallowreactive | Vue docs}
 * @public
 */
export { shallowReactive } from '@vue/runtime-core';

/**
 * Shallow version of {@link ref}. Only `.value` access is reactive.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#shallowref | Vue docs}
 * @public
 */
export { shallowRef } from '@vue/runtime-core';

/**
 * Shallow version of {@link readonly}.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#shallowreadonly | Vue docs}
 * @public
 */
export { shallowReadonly } from '@vue/runtime-core';

/**
 * Returns the raw, original object of a Vue-created proxy.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#toraw | Vue docs}
 * @public
 */
export { toRaw } from '@vue/runtime-core';

/**
 * Can be used to create a ref for a property on a reactive object.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#toref | Vue docs}
 * @public
 */
export { toRef } from '@vue/runtime-core';

/**
 * Converts a reactive object to a plain object where each property is a ref.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#torefs | Vue docs}
 * @public
 */
export { toRefs } from '@vue/runtime-core';

/**
 * Normalizes values / refs / getters to values.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#tovalue | Vue docs}
 * @public
 */
export { toValue } from '@vue/runtime-core';

/**
 * Force trigger effects that depends on a shallow ref.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#triggerref | Vue docs}
 * @public
 */
export { triggerRef } from '@vue/runtime-core';

/**
 * Returns the inner value if the argument is a ref, otherwise returns the argument itself.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#unref | Vue docs}
 * @public
 */
export { unref } from '@vue/runtime-core';

/**
 * Checks if a value is a ref object.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#isref | Vue docs}
 * @public
 */
export { isRef } from '@vue/runtime-core';

/**
 * Checks whether an object is a proxy created by {@link reactive} or {@link shallowReactive}.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#isreactive | Vue docs}
 * @public
 */
export { isReactive } from '@vue/runtime-core';

/**
 * Checks whether an object is a proxy created by {@link readonly} or {@link shallowReadonly}.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#isreadonly | Vue docs}
 * @public
 */
export { isReadonly } from '@vue/runtime-core';

/**
 * Checks if an object is a proxy created by reactive, readonly, shallowReactive, or shallowReadonly.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#isproxy | Vue docs}
 * @public
 */
export { isProxy } from '@vue/runtime-core';

/**
 * Checks whether a value is a shallow reactive/ref.
 *
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#isshallow | Vue docs}
 * @public
 */
export { isShallow } from '@vue/runtime-core';

/**
 * Marks an object so that it will never be converted to a proxy.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#markraw | Vue docs}
 * @public
 */
export { markRaw } from '@vue/runtime-core';

// ===========================================================================
// Vue Core Re-exports — Lifecycle Hooks
// ===========================================================================

/**
 * Registers a callback to be called after the component is mounted.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onmounted | Vue docs}
 * @public
 */
export { onMounted } from '@vue/runtime-core';

/**
 * Registers a hook to be called right before the component is to be mounted.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onbeforemount | Vue docs}
 * @public
 */
export { onBeforeMount } from '@vue/runtime-core';

/**
 * Registers a callback to be called after the component is unmounted.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onunmounted | Vue docs}
 * @public
 */
export { onUnmounted } from '@vue/runtime-core';

/**
 * Registers a hook to be called right before the component is about to be unmounted.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onbeforeunmount | Vue docs}
 * @public
 */
export { onBeforeUnmount } from '@vue/runtime-core';

/**
 * Registers a callback to be called after the component has updated its DOM tree.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onupdated | Vue docs}
 * @public
 */
export { onUpdated } from '@vue/runtime-core';

/**
 * Registers a hook to be called right before the component is about to update.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onbeforeupdate | Vue docs}
 * @public
 */
export { onBeforeUpdate } from '@vue/runtime-core';

/**
 * Registers a callback to be called when an error propagating from a descendant
 * component has been captured.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured | Vue docs}
 * @public
 */
export { onErrorCaptured } from '@vue/runtime-core';

/**
 * Registers a debug hook to be called when a reactive dependency has been tracked.
 * Dev mode only.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onrendertracked | Vue docs}
 * @public
 */
export { onRenderTracked } from '@vue/runtime-core';

/**
 * Registers a debug hook to be called when a reactive dependency triggers a re-render.
 * Dev mode only.
 *
 * @see {@link https://vuejs.org/api/composition-api-lifecycle.html#onrendertriggered | Vue docs}
 * @public
 */
export { onRenderTriggered } from '@vue/runtime-core';

// ===========================================================================
// Vue Core Re-exports — Watchers
// ===========================================================================

/**
 * Watches one or more reactive data sources and invokes a callback when the sources change.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#watch | Vue docs}
 * @public
 */
export { watch } from '@vue/runtime-core';

/**
 * Runs a function immediately while reactively tracking its dependencies and
 * re-runs it whenever the dependencies are changed.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#watcheffect | Vue docs}
 * @public
 */
export { watchEffect } from '@vue/runtime-core';

/**
 * Alias of {@link watchEffect} with `flush: 'post'` option.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#watchposteffect | Vue docs}
 * @public
 */
export { watchPostEffect } from '@vue/runtime-core';

/**
 * Alias of {@link watchEffect} with `flush: 'sync'` option.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#watchsynceffect | Vue docs}
 * @public
 */
export { watchSyncEffect } from '@vue/runtime-core';

/**
 * Register a cleanup callback on the current active watcher.
 *
 * @see {@link https://vuejs.org/api/reactivity-core.html#onwatchercleanup | Vue docs}
 * @public
 */
export { onWatcherCleanup } from '@vue/runtime-core';

// ===========================================================================
// Vue Core Re-exports — Dependency Injection
// ===========================================================================

/**
 * Injects a value provided by a parent component or the application.
 *
 * @see {@link https://vuejs.org/api/composition-api-dependency-injection.html#inject | Vue docs}
 * @public
 */
export { inject } from '@vue/runtime-core';

/**
 * Provides a value that can be injected by descendant components.
 *
 * @see {@link https://vuejs.org/api/composition-api-dependency-injection.html#provide | Vue docs}
 * @public
 */
export { provide } from '@vue/runtime-core';

/**
 * Returns true if `inject()` can be used without warning about being called in the wrong place.
 *
 * @see {@link https://vuejs.org/api/composition-api-dependency-injection.html#hasinjectioncontext | Vue docs}
 * @public
 */
export { hasInjectionContext } from '@vue/runtime-core';

// ===========================================================================
// Vue Core Re-exports — Effect Scope
// ===========================================================================

/**
 * Creates an effect scope object which can capture the reactive effects created within it.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#effectscope | Vue docs}
 * @public
 */
export { effectScope } from '@vue/runtime-core';

/**
 * Returns the current active effect scope if there is one.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#getcurrentscope | Vue docs}
 * @public
 */
export { getCurrentScope } from '@vue/runtime-core';

/**
 * Registers a dispose callback on the current active effect scope.
 *
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#onscopedispose | Vue docs}
 * @public
 */
export { onScopeDispose } from '@vue/runtime-core';

// ===========================================================================
// Vue Core Re-exports — Component
// ===========================================================================

/**
 * Define a Vue component with type inference support.
 *
 * @see {@link https://vuejs.org/api/general.html#definecomponent | Vue docs}
 * @public
 */
export { defineComponent } from '@vue/runtime-core';

/**
 * Define an async component which is lazy loaded.
 *
 * @see {@link https://vuejs.org/api/general.html#defineasynccomponent | Vue docs}
 * @public
 */
export { defineAsyncComponent } from '@vue/runtime-core';

/**
 * Create virtual DOM nodes (VNodes) programmatically.
 *
 * @example
 * ```ts
 * import { h, defineComponent } from 'vue-lynx';
 *
 * export default defineComponent({
 *   setup() {
 *     return () => h('view', { class: 'container' }, [
 *       h('text', 'Hello Lynx!'),
 *     ]);
 *   },
 * });
 * ```
 *
 * @see {@link https://vuejs.org/api/render-function.html#h | Vue docs}
 * @public
 */
export { h } from '@vue/runtime-core';

/**
 * Returns the internal instance of the current component. For advanced use cases and library authors.
 *
 * @see {@link https://vuejs.org/api/composition-api-helpers.html#getcurrentinstance | Vue docs}
 * @public
 */
export { getCurrentInstance } from '@vue/runtime-core';

/**
 * Generate a unique application-scoped ID.
 *
 * @see {@link https://vuejs.org/api/composition-api-helpers.html#useid | Vue docs}
 * @public
 */
export { useId } from '@vue/runtime-core';

/**
 * A helper to power two-way binding in a custom component.
 *
 * @see {@link https://vuejs.org/api/composition-api-helpers.html#usemodel | Vue docs}
 * @public
 */
export { useModel } from '@vue/runtime-core';

/**
 * Returns the slots object of the current component.
 *
 * @see {@link https://vuejs.org/api/composition-api-helpers.html#useslots | Vue docs}
 * @public
 */
export { useSlots } from '@vue/runtime-core';

/**
 * Returns the attrs object of the current component (fallthrough attributes).
 *
 * @see {@link https://vuejs.org/api/composition-api-helpers.html#useattrs | Vue docs}
 * @public
 */
export { useAttrs } from '@vue/runtime-core';

/**
 * Returns a ref that matches a template ref or a child component ref.
 *
 * @see {@link https://vuejs.org/api/composition-api-helpers.html#usetemplateref | Vue docs}
 * @public
 */
export { useTemplateRef } from '@vue/runtime-core';

// ===========================================================================
// Vue Core Re-exports — Script Setup Macros
// ===========================================================================

/**
 * Compiler macro for declaring component props in `<script setup>`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits | Vue docs}
 * @public
 */
export { defineProps } from '@vue/runtime-core';

/**
 * Compiler macro for declaring component emits in `<script setup>`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits | Vue docs}
 * @public
 */
export { defineEmits } from '@vue/runtime-core';

/**
 * Compiler macro for declaring exposed properties in `<script setup>`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineexpose | Vue docs}
 * @public
 */
export { defineExpose } from '@vue/runtime-core';

/**
 * Compiler macro for declaring component options in `<script setup>`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineoptions | Vue docs}
 * @public
 */
export { defineOptions } from '@vue/runtime-core';

/**
 * Compiler macro for declaring a two-way binding prop in `<script setup>`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#definemodel | Vue docs}
 * @public
 */
export { defineModel } from '@vue/runtime-core';

/**
 * Compiler macro for declaring typed slots in `<script setup>`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#defineslots | Vue docs}
 * @public
 */
export { defineSlots } from '@vue/runtime-core';

/**
 * Compiler macro for providing default values for `defineProps`.
 *
 * @see {@link https://vuejs.org/api/sfc-script-setup.html#withdefaults | Vue docs}
 * @public
 */
export { withDefaults } from '@vue/runtime-core';

// ===========================================================================
// Vue Core Re-exports — Built-in Components
// ===========================================================================

/**
 * A special component for rendering multiple elements or components without a wrapper node.
 *
 * @see {@link https://vuejs.org/api/built-in-special-elements.html#fragment | Vue docs}
 * @public
 */
export { Fragment } from '@vue/runtime-core';

/**
 * For displaying async content with fallback.
 *
 * @see {@link https://vuejs.org/guide/built-ins/suspense.html | Vue docs}
 * @public
 */
export { Suspense } from '@vue/runtime-core';

/**
 * Vue's version string.
 *
 * @public
 */
export { version } from '@vue/runtime-core';

/**
 * Merge multiple props objects.
 *
 * @see {@link https://vuejs.org/api/render-function.html#mergeprops | Vue docs}
 * @public
 */
export { mergeProps } from '@vue/runtime-core';

// ===========================================================================
// @internal — Template compiler runtime helpers
// ===========================================================================
// These are used by Vue's SFC compiler output and should not be called directly.

/** @hidden */ export { openBlock } from '@vue/runtime-core';
/** @hidden */ export { createBlock } from '@vue/runtime-core';
/** @hidden */ export { createElementBlock } from '@vue/runtime-core';
/** @hidden */ export { createVNode } from '@vue/runtime-core';
/** @hidden */ export { createElementVNode } from '@vue/runtime-core';
/** @hidden */ export { createTextVNode } from '@vue/runtime-core';
/** @hidden */ export { createCommentVNode } from '@vue/runtime-core';
/** @hidden */ export { cloneVNode } from '@vue/runtime-core';
/** @hidden */ export { isVNode } from '@vue/runtime-core';
/** @hidden */ export { toDisplayString } from '@vue/runtime-core';
/** @hidden */ export { normalizeClass } from '@vue/runtime-core';
/** @hidden */ export { normalizeStyle } from '@vue/runtime-core';
/** @hidden */ export { normalizeProps } from '@vue/runtime-core';
/** @hidden */ export { camelize } from '@vue/runtime-core';
/** @hidden */ export { capitalize } from '@vue/runtime-core';
/** @hidden */ export { renderList } from '@vue/runtime-core';
/** @hidden */ export { withDirectives } from '@vue/runtime-core';
/** @hidden */ export { resolveComponent } from '@vue/runtime-core';
/** @hidden */ export { resolveDynamicComponent } from '@vue/runtime-core';
/** @hidden */ export { resolveDirective } from '@vue/runtime-core';
/** @hidden */ export { withCtx } from '@vue/runtime-core';
/** @hidden */ export { renderSlot } from '@vue/runtime-core';
/** @hidden */ export { createSlots } from '@vue/runtime-core';
/** @hidden */ export { setBlockTracking } from '@vue/runtime-core';
/** @hidden */ export { pushScopeId } from '@vue/runtime-core';
/** @hidden */ export { popScopeId } from '@vue/runtime-core';
/** @hidden */ export { withScopeId } from '@vue/runtime-core';
/** @hidden */ export { toHandlerKey } from '@vue/runtime-core';
/** @hidden */ export { toHandlers } from '@vue/runtime-core';
/** @hidden */ export { withMemo } from '@vue/runtime-core';
/** @hidden */ export { guardReactiveProps } from '@vue/runtime-core';
// @ts-expect-error withAsyncContext is exported at runtime but missing from Vue's .d.ts
/** @hidden */ export { withAsyncContext } from '@vue/runtime-core';
/** @hidden */ export { Text } from '@vue/runtime-core';
/** @hidden */ export { Comment } from '@vue/runtime-core';

// ===========================================================================
// @internal — Deprecated / unsupported APIs
// ===========================================================================

/**
 * @deprecated Lynx has no server-side rendering. This hook will never be called.
 * Use onMounted() for data fetching in Lynx.
 * @internal
 */
export function onServerPrefetch(_fn: () => unknown): void {
  if (__DEV__) {
    console.warn(
      '[vue-lynx] onServerPrefetch is not supported — Lynx has no SSR.',
    );
  }
}

/**
 * @deprecated Lynx has no SSR context. Returns undefined.
 * @internal
 */
export function useSSRContext(): undefined {
  if (__DEV__) {
    console.warn(
      '[vue-lynx] useSSRContext is not available — Lynx has no SSR.',
    );
  }
  return undefined;
}

/**
 * @deprecated Vue Lynx does not implement `insertStaticContent`.
 * Static VNodes will throw at mount time. Use `h()` / `createVNode()` instead.
 * @internal
 */
export function createStaticVNode(
  _content: string,
  _numberOfNodes: number,
): never {
  throw new Error(
    '[vue-lynx] createStaticVNode is not supported — the Lynx renderer does not implement insertStaticContent.',
  );
}

/**
 * @deprecated Vue Lynx does not implement `insertStaticContent`.
 * Static VNodes cannot be rendered. Use `Text` or `Comment` instead.
 * @internal
 */
export const Static: symbol = Symbol.for('v-stc');

/**
 * @deprecated KeepAlive requires an internal storage container created via
 * `createElement('div')`. In Vue Lynx this creates an orphan element on the
 * Main Thread with no visual tree parent, causing undefined native behaviour.
 * Component caching is not supported.
 * @internal
 */
export function KeepAlive(): void {
  if (__DEV__) {
    console.warn(
      '[vue-lynx] KeepAlive is not supported — Lynx renderer has no element recycling.',
    );
  }
}

/**
 * @deprecated onActivated depends on KeepAlive, which is not supported in Lynx.
 * This hook will never be called. Use onMounted() instead.
 * @internal
 */
export function onActivated(_fn: () => void): void {
  if (__DEV__) {
    console.warn(
      '[vue-lynx] onActivated is not supported — KeepAlive is not available.',
    );
  }
}

/**
 * @deprecated onDeactivated depends on KeepAlive, which is not supported in Lynx.
 * This hook will never be called. Use onUnmounted() instead.
 * @internal
 */
export function onDeactivated(_fn: () => void): void {
  if (__DEV__) {
    console.warn(
      '[vue-lynx] onDeactivated is not supported — KeepAlive is not available.',
    );
  }
}

/**
 * @deprecated Teleport requires `querySelector` renderer option to resolve
 * string targets (e.g. `to="#modal"`). Vue Lynx does not implement
 * `querySelector`. In dev mode, Vue will warn and the content will not be
 * teleported. Direct element references are also unsupported because Lynx
 * native elements are not accessible from the Background Thread.
 * @internal
 */
export function Teleport(): void {
  if (__DEV__) {
    console.warn(
      '[vue-lynx] Teleport is not supported — Lynx renderer has no querySelector.',
    );
  }
}

// ===========================================================================
// Intentionally NOT re-exported — @vue/runtime-core internal APIs
// ===========================================================================
// These are implementation details not part of Vue's public API:
//
// Reactivity internals:  effect, ReactiveEffect, stop, proxyRefs,
//                        TrackOpTypes, TriggerOpTypes
// Error internals:       callWithErrorHandling, callWithAsyncErrorHandling,
//                        handleError, ErrorCodes, ErrorTypeStrings
// Dev/debug internals:   warn, devtools, setDevtoolsHook, initCustomFormatter,
//                        registerRuntimeCompiler, DeprecationTypes, compatUtils
// Rendering internals:   isMemoSame, isRuntimeOnly, guardReactiveProps,
//                        transformVNodeArgs, assertNumber
// Transition internals:  BaseTransition, BaseTransitionPropsValidators,
//                        resolveTransitionHooks, setTransitionHooks,
//                        getTransitionRawChildren, useTransitionState
//   (BaseTransition is consumed internally by our Transition/TransitionGroup)
// SSR internals:         ssrContextKey, ssrUtils, createHydrationRenderer
// Hydration (SSR):       hydrateOnIdle, hydrateOnVisible,
//                        hydrateOnMediaQuery, hydrateOnInteraction
// Compat:                resolveFilter

// ===========================================================================
// @internal — Directive stubs (v-model, event modifiers)
// ===========================================================================

// ---------------------------------------------------------------------------
// v-model directive (Vue Lynx implementation for <input> / <textarea>)
// ---------------------------------------------------------------------------

interface InputEventData {
  detail?: { value?: string; isComposing?: boolean };
}

function looseToNumber(val: string): number | string {
  const n = Number.parseFloat(val);
  return isNaN(n) ? val : n;
}

function getModelAssigner(vnode: VNode): (value: unknown) => void {
  const fn = vnode.props?.['onUpdate:modelValue'];
  if (Array.isArray(fn)) return (value: unknown) => { for (const f of fn) f(value); };
  return fn ?? ((_: unknown) => undefined);
}

export const vModelText: ObjectDirective<ShadowElement> = {
  created(el, { modifiers }, vnode) {
    const isLazy = modifiers?.lazy;
    const eventName = isLazy ? 'confirm' : 'input';
    el._vModelEvent = eventName;

    const assign = getModelAssigner(vnode);

    const handler = (data: unknown) => {
      const evt = data as InputEventData;
      let value: string = evt?.detail?.value ?? '';
      if (evt?.detail?.isComposing) return;
      if (modifiers?.trim) value = value.trim();
      el._vModelValue = value;
      assign(modifiers?.number ? looseToNumber(value) : value);
    };

    const sign = register(handler);
    el._vModelSign = sign;
    pushOp(OP.SET_EVENT, el.id, 'bindEvent', eventName, sign);
    scheduleFlush();
  },

  mounted(el, { value }) {
    const val = value == null ? '' : String(value);
    el._vModelValue = val;
    pushOp(OP.SET_PROP, el.id, 'value', val);
    scheduleFlush();
  },

  beforeUpdate(el, { value, modifiers }, vnode) {
    // Refresh handler closure with latest assigner
    if (el._vModelSign) {
      const assign = getModelAssigner(vnode);
      const handler = (data: unknown) => {
        const evt = data as InputEventData;
        let val: string = evt?.detail?.value ?? '';
        if (evt?.detail?.isComposing) return;
        if (modifiers?.trim) val = val.trim();
        el._vModelValue = val;
        assign(modifiers?.number ? looseToNumber(val) : val);
      };
      updateHandler(el._vModelSign, handler);
    }

    // Push value to MT only if changed
    const strVal = value == null ? '' : String(value);
    if (strVal !== el._vModelValue) {
      el._vModelValue = strVal;
      pushOp(OP.SET_PROP, el.id, 'value', strVal);
      scheduleFlush();
    }
  },

  beforeUnmount(el) {
    if (el._vModelSign) {
      unregister(el._vModelSign);
      pushOp(OP.REMOVE_EVENT, el.id, 'bindEvent', el._vModelEvent!);
      el._vModelSign = undefined;
      el._vModelEvent = undefined;
      scheduleFlush();
    }
  },
};

const vModelUnsupported: ObjectDirective = {
  beforeMount(): void {
    if (__DEV__) {
      console.warn(
        '[vue-lynx] v-model on checkbox/radio/select is not supported. '
        + 'Lynx only supports <input> and <textarea>.',
      );
    }
  },
  beforeUpdate(): void {/* no-op */},
};

export const vModelCheckbox: ObjectDirective = vModelUnsupported;
export const vModelSelect: ObjectDirective = vModelUnsupported;
export const vModelRadio: ObjectDirective = vModelUnsupported;

/** @internal Lynx stub for withModifiers (event modifier helper). */
export function withModifiers(
  fn: (...args: unknown[]) => unknown,
  _modifiers: string[],
): (...args: unknown[]) => unknown {
  return fn;
}

/** @internal Lynx stub for withKeys (keyboard event modifier helper). */
export function withKeys(
  fn: (...args: unknown[]) => unknown,
  _keys: string[],
): (...args: unknown[]) => unknown {
  return fn;
}

// ===========================================================================
// Built-in components — Transition
// ===========================================================================

export { Transition, TransitionGroup };

// ===========================================================================
// @internal — Testing utilities
// ===========================================================================

/** @hidden */
export { ShadowElement };
/** @hidden */
export { nodeOps };
/** @hidden */
export { takeOps };

/**
 * Reset all module-level state between tests.
 * Must be called before each test to ensure isolation.
 * @internal
 */
export function resetForTesting(): void {
  resetRegistry();
  resetNodeOpsState();
  resetFlushState();
  resetMainThreadRefState();
  resetFunctionCallState();
  resetRunOnBackgroundState();
  takeOps(); // drain any leftover ops
  ShadowElement.nextId = 2;
}
