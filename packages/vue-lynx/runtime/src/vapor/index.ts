// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Vapor mode surface for vue-lynx.
 *
 * Compiled Vapor components import their runtime helpers from 'vue', which
 * the vue-lynx build plugin aliases to this package. This module re-exports
 * the full `@vue/runtime-vapor` helper surface (running against the
 * ShadowElement tree through the DOM shim, see dom-shim.ts) and overrides
 * the helpers whose semantics differ on Lynx:
 *
 *  - `withVaporModifiers` / `withVaporKeys` — Lynx event modifier semantics
 *    (`.stop` → native catchEvent, `.prevent` no-op, …)
 *  - `on` / `onBinding` — preserve `.stop` through Vapor invoker wrappers
 *  - `applyTextModel` — v-model on <input>/<textarea> via Lynx `input` /
 *    `confirm` events carrying `detail.value`
 *  - `setHtml` / `setBlockHtml` — v-html is unsupported (no HTML on Lynx)
 *  - `delegate` / `delegateEvents` — event delegation is compiled away
 *    (eventDelegation: false); precompiled delegated handlers fall back to
 *    per-element listeners
 *  - `vaporInteropPlugin` — vdom↔vapor interop is not wired up yet
 *  - `createVaporApp` — mounts to the Lynx page root
 */

import { installVaporDomShim } from './dom-shim.js';

// The shim only patches globals lazily used by runtime-vapor (document is
// touched at template/mount time, not at module evaluation), so installing
// after the hoisted import below is still safe — but install as the very
// first side effect regardless.
installVaporDomShim();

import {
  createInvoker,
  createVaporApp as _createVaporApp,
  onBinding as _onBinding,
  renderEffect,
  template as _template,
} from '@vue/runtime-vapor';
import * as runtimeDom from '@vue/runtime-dom';
import { onMounted, watchPostEffect } from '@vue/runtime-dom';
import type { App, Component } from '@vue/runtime-core';

import type { VaporTemplateIR } from 'vue-lynx/internal/ops';
import { registerMount } from '../app-registry.js';
import { buildInertFromIR } from './build-inert.js';
import { looseToNumber, withKeys, withModifiers } from '../event-modifiers.js';
import type { InputEventData } from '../event-modifiers.js';
import { isIfrMainThread } from '../ifr-env.js';
import { createPageRoot } from '../shadow-element.js';
import type { ShadowElement } from '../shadow-element.js';
import type { VueLynxApp } from '../index.js';
import { applyVaporCssVarsToBlock } from './css-vars.js';

// ---------------------------------------------------------------------------
// Full helper surface (explicit exports below override these).
// ---------------------------------------------------------------------------

export * from '@vue/runtime-vapor';

// ---------------------------------------------------------------------------
// Template factory — accept the build-time structured form (issue #234, A)
// ---------------------------------------------------------------------------

type TemplateFactory = () => ShadowElement;

/**
 * Vapor's `template()` helper. Overrides upstream to accept, in addition to
 * the minified-HTML string, the build-time **structured** form emitted by the
 * `vaporBuildTimeTemplates` plugin transform: `template([<VaporTemplateIR>],
 * flags)`. The structured path rebuilds the inert prototype directly (no HTML
 * parse), then clones it per instance exactly like the string path.
 *
 * The string form is preserved verbatim (delegated to upstream) so precompiled
 * third-party Vapor code — and builds with the flag off — keep working.
 * @public
 */
export function template(
  input: string | VaporTemplateIR[],
  flags = 0,
  ns?: number,
): TemplateFactory {
  if (typeof input === 'string') {
    return _template(input, flags, ns) as unknown as TemplateFactory;
  }
  // Structured form: the IR already encodes the parsed tree, so `ns` (the
  // string parser's svg/math nesting hint) is irrelevant here.
  const root = !!(flags & 1);
  let node: ShadowElement | undefined;
  return () => {
    if (node === undefined) {
      node = buildInertFromIR(input).firstChild as ShadowElement;
    }
    const ret = node.cloneNode(true) as ShadowElement & { $root?: boolean };
    if (root) ret.$root = true;
    return ret;
  };
}

// ---------------------------------------------------------------------------
// Event modifier helpers — Lynx semantics
// ---------------------------------------------------------------------------

type AnyFn = ReturnType<typeof createInvoker>;
type EventHandlerValue = Parameters<typeof _onBinding>[2];
type OnBindingOptions = NonNullable<Parameters<typeof _onBinding>[3]>;

/**
 * Vapor counterpart of vue-lynx's `withModifiers`: wraps the handler with
 * Lynx modifier semantics. `.stop` handlers carry the `_lynxCatch` tag so
 * the `on` override below registers them as native `catchEvent`.
 * @public
 */
export function withVaporModifiers(
  fn: AnyFn | undefined,
  modifiers: string[],
): AnyFn | undefined {
  return typeof fn === 'function' ? withModifiers(fn, modifiers) : fn;
}

/**
 * Vapor counterpart of vue-lynx's `withKeys` (no-op on native Lynx — see
 * the `withKeys` docs).
 * @public
 */
export function withVaporKeys(fn: AnyFn, keys: string[]): AnyFn {
  return withKeys(fn, keys);
}

// ---------------------------------------------------------------------------
// Events — preserve the `.stop` → catchEvent tag through invoker wrappers
// ---------------------------------------------------------------------------

interface OnOptions {
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
}

function usesLynxCatch(handler: AnyFn): boolean {
  return !!(handler as { _lynxCatch?: boolean })._lynxCatch;
}

function addVaporEventListener(
  el: ShadowElement,
  event: string,
  handler: AnyFn,
  options: OnOptions,
  forceCatch = usesLynxCatch(handler),
): void {
  const invoker = createInvoker(handler) as AnyFn & { _lynxCatch?: boolean };
  if (forceCatch) invoker._lynxCatch = true;
  el.addEventListener(event, invoker as (data: unknown) => void, options);
}

/**
 * Attach an event listener. Same contract as `@vue/runtime-vapor`'s `on`,
 * except the `_lynxCatch` tag set by `.stop` modifiers is propagated onto
 * the invoker so ShadowElement.addEventListener registers a native
 * `catchEvent` (Lynx's stop-propagation mechanism).
 * @public
 */
export function on(
  el: ShadowElement,
  event: string,
  handler: AnyFn | AnyFn[] | undefined,
  options: OnOptions = {},
): void {
  if (Array.isArray(handler)) {
    const forceCatch = handler.some(usesLynxCatch);
    for (const fn of handler) {
      addVaporEventListener(el, event, fn, options, forceCatch);
    }
    return;
  }
  if (!handler) return;
  addVaporEventListener(el, event, handler, options);
}

/**
 * Reactive event binding used by the Vapor compiler for dynamic event names.
 *
 * Delegate effect cleanup and array handling to upstream `onBinding`, but
 * intercept its generated invoker before it reaches ShadowElement so the
 * original handler's `_lynxCatch` marker survives. The adapter forwards the
 * exact same invoker to removal, preserving upstream's onEffectCleanup
 * identity and rebinding semantics.
 * @public
 */
export function onBinding(
  el: ShadowElement,
  event: string,
  handler: EventHandlerValue,
  options: OnBindingOptions = {},
): void {
  if (!handler) return;

  const handlers = Array.isArray(handler) ? handler : [handler];
  const forceCatch = handlers.some(usesLynxCatch);

  const target = {
    addEventListener(
      name: string,
      invoker: EventListener,
      eventOptions?: AddEventListenerOptions | boolean,
    ) {
      if (forceCatch) {
        (invoker as unknown as { _lynxCatch?: boolean })._lynxCatch = true;
      }
      el.addEventListener(
        name,
        invoker as unknown as (data: unknown) => void,
        eventOptions,
      );
    },
    removeEventListener(name: string, invoker: EventListener) {
      el.removeEventListener(
        name,
        invoker as unknown as (data: unknown) => void,
      );
    },
  };

  _onBinding(
    target as unknown as Element,
    event,
    handler,
    options,
  );
}

// ---------------------------------------------------------------------------
// v-model — Lynx input protocol
// ---------------------------------------------------------------------------

interface TextModelModifiers {
  trim?: boolean;
  number?: boolean;
  lazy?: boolean;
}

/**
 * Vapor v-model for `<input>` / `<textarea>` on Lynx.
 *
 * Unlike the DOM implementation (which reads `el.value` inside a DOM
 * 'input' listener), Lynx delivers the current value in the event payload
 * (`detail.value`). `.lazy` maps to Lynx's `confirm` event.
 * @public
 */
export function applyTextModel(
  el: ShadowElement,
  get: () => unknown,
  set: (value: unknown) => void,
  modifiers: TextModelModifiers = {},
): void {
  const { trim, number, lazy } = modifiers;
  const eventName = lazy ? 'confirm' : 'input';

  el.addEventListener(eventName, (data: unknown) => {
    const detail = (data as InputEventData)?.detail;
    if (detail?.isComposing) return;
    let value = detail?.value ?? '';
    if (trim) value = value.trim();
    // Track the on-screen value without re-emitting SET_PROP.
    el._valueProp = value;
    set(number ? looseToNumber(value) : value);
  });

  renderEffect(() => {
    const next = get();
    const str = next == null ? '' : String(next);
    if (str !== el.value) {
      el.value = str; // emits SET_PROP('value', …)
    }
  });
}

// ---------------------------------------------------------------------------
// SFC CSS variables — ShadowElement block traversal instead of DOM observers
// ---------------------------------------------------------------------------

/** Lynx-specific runtime-vapor implementation used by SFC CSS v-bind(). */
export function useVaporCssVars(getter: () => Record<string, string>): void {
  if (isIfrMainThread()) return;

  // runtime-dom exposes this internal live binding at runtime, but omits it
  // from the public declaration surface.
  const instance = (runtimeDom as unknown as {
    readonly currentInstance: { block?: unknown } | null;
  }).currentInstance;
  if (!instance) return;

  onMounted(() => {
    watchPostEffect(() => {
      applyVaporCssVarsToBlock(instance.block, getter());
    });
  });
}

// ---------------------------------------------------------------------------
// v-html — unsupported
// ---------------------------------------------------------------------------

let _warnedSetHtml = false;

function warnSetHtml(): void {
  if (__DEV__ && !_warnedSetHtml) {
    _warnedSetHtml = true;
    console.warn(
      '[vue-lynx] v-html is not supported — Lynx elements cannot parse HTML strings.',
    );
  }
}

/** @internal v-html is unsupported on Lynx. */
export function setHtml(_el: unknown, _value: unknown): void {
  warnSetHtml();
}

/** @internal v-html is unsupported on Lynx. */
export function setBlockHtml(_block: unknown, _value: unknown): void {
  warnSetHtml();
}

// ---------------------------------------------------------------------------
// Event delegation — compiled away; degrade gracefully for precompiled code
// ---------------------------------------------------------------------------

/**
 * @internal Registers the handler as a plain per-element listener. The
 * vue-lynx plugin compiles templates with `eventDelegation: false`, so this
 * only runs for Vapor components precompiled elsewhere with delegation on.
 */
export function delegate(
  el: ShadowElement,
  event: string,
  handler: AnyFn | AnyFn[],
): void {
  // `on` already handles the array / undefined handler cases.
  on(el, event, handler);
}

/** @internal No-op — there is no document to delegate to on Lynx. */
export function delegateEvents(..._names: string[]): void {
  /* no-op */
}

// ---------------------------------------------------------------------------
// Interop — not wired up yet
// ---------------------------------------------------------------------------

/**
 * @internal Upstream's `vaporInteropPlugin` is hard-wired to
 * `@vue/runtime-dom`'s renderer singleton and cannot drive the vue-lynx
 * custom renderer. vdom↔vapor interop is tracked as a follow-up.
 */
export function vaporInteropPlugin(): never {
  throw new Error(
    '[vue-lynx] vaporInteropPlugin is not supported yet. '
    + 'Use a pure Vapor app (all components compiled with the `vapor` attribute) '
    + 'or a pure vdom app.',
  );
}

// ---------------------------------------------------------------------------
// App creation
// ---------------------------------------------------------------------------

/**
 * Create a Vapor-mode Vue Lynx application.
 *
 * Like vue-lynx's `createApp`, there is no container selector — `mount()`
 * always mounts onto the Lynx page root.
 *
 * @example
 * ```ts
 * import { createVaporApp } from 'vue-lynx';
 * import App from './App.vue'; // <script setup vapor>
 *
 * createVaporApp(App).mount();
 * ```
 *
 * @public
 */
export function createVaporApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown>,
): VueLynxApp {
  const internalApp = _createVaporApp(
    rootComponent as Parameters<typeof _createVaporApp>[0],
    rootProps as Parameters<typeof _createVaporApp>[1],
  ) as unknown as App<ShadowElement>;

  const app: VueLynxApp = {
    get config() {
      return internalApp.config;
    },

    use(plugin: unknown, ...options: unknown[]): VueLynxApp {
      internalApp.use(plugin as Parameters<App['use']>[0], ...options);
      return app;
    },

    provide(key: unknown, value: unknown): VueLynxApp {
      internalApp.provide(key as string, value);
      return app;
    },

    mount(): void {
      if (isIfrMainThread()) {
        registerMount(() => {
          const root = createPageRoot();
          internalApp.mount(root);
        });
        return;
      }
      const root = createPageRoot();
      internalApp.mount(root);
    },

    unmount(): void {
      internalApp.unmount();
    },
  };

  return app;
}
