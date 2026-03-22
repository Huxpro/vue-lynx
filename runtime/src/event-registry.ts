// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Sign-based event handler registry for the Background Thread.
 *
 * When patchProp registers an event handler, it gets a unique sign string.
 * The Main Thread stores this sign with __AddEvent().  When Native fires an
 * event it calls publishEvent(sign, data) on the BG Thread, which looks up
 * the handler and executes it directly – no cross-thread round-trip.
 */

interface RegistryState {
  signCounter: number;
  handlers: Map<string, (data: unknown) => void>;
}

// The consumer bundle can materialize multiple event-registry module instances
// (for example via separate entry-background/runtime graphs). Store the state
// on globalThis so register() and publishEvent() still see the same handlers.
const REGISTRY_STATE_KEY = '__VUE_LYNX_EVENT_REGISTRY__';

type RegistryGlobal = typeof globalThis & {
  __VUE_LYNX_EVENT_REGISTRY__?: RegistryState;
};

function getRegistryState(): RegistryState {
  const g = globalThis as RegistryGlobal;
  let state = g[REGISTRY_STATE_KEY];
  if (!state) {
    state = {
      signCounter: 0,
      handlers: new Map<string, (data: unknown) => void>(),
    };
    Object.defineProperty(g, REGISTRY_STATE_KEY, {
      value: state,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  }
  return state;
}

export function register(handler: (data: unknown) => void): string {
  const state = getRegistryState();
  const sign = `vue:${state.signCounter++}`;
  state.handlers.set(sign, handler);
  return sign;
}

/**
 * Update the handler for an existing sign without changing the sign.
 * Used on re-renders: keeps the same sign registered on the Main Thread
 * while pointing it to the freshest handler closure.
 */
export function updateHandler(
  sign: string,
  handler: (data: unknown) => void,
): void {
  getRegistryState().handlers.set(sign, handler);
}

export function unregister(sign: string): void {
  getRegistryState().handlers.delete(sign);
}

/** Called by Lynx Native when an event fires on BG Thread. */
export function publishEvent(sign: string, data: unknown): void {
  const state = getRegistryState();
  const handler = state.handlers.get(sign);
  if (__DEV__ && typeof handler !== 'function' && handler != null) {
    console.warn('[vue-lynx] publishEvent: non-function handler for sign', sign, handler);
  }
  if (typeof handler === 'function') {
    handler(data);
  }
}

/** Reset all state – for testing only. */
export function resetRegistry(): void {
  const state = getRegistryState();
  state.signCounter = 0;
  state.handlers.clear();
}
