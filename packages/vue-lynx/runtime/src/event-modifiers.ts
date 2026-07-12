// Copyright 2026 Xuan Huang (huxpro). All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// ---------------------------------------------------------------------------
// withModifiers — runtime event modifier support for Lynx
// ---------------------------------------------------------------------------

/**
 * Modifiers that are side-effects on the event object (don't filter the event).
 */
const lynxModifierSideEffects: Record<
  string,
  (e: Record<string, unknown>) => void
> = {
  stop: (e) => (e.stopPropagation as (() => void) | undefined)?.(),
  // `.prevent` is intentionally absent: Lynx has no browser default actions to
  // cancel. It is accepted as a compatibility no-op so web code can be shared
  // without modification, but calling preventDefault() would be misleading.
};

/**
 * Modifiers that act as guards: if the guard returns true the handler is
 * skipped entirely.
 */
const lynxModifierGuards: Record<
  string,
  (e: Record<string, unknown>) => boolean
> = {
  // Only invoke the handler if the event originated directly on this element.
  //
  // We can't use simple reference equality (e.target !== e.currentTarget) here
  // because cross-thread event objects are always distinct plain objects —
  // even when they represent the same element.  Instead we compare by numeric
  // element identifier:
  //   - Lynx native:      target.uid        (set by the native runtime)
  //   - Lynx web preview: target.uniqueId   (set by createCrossThreadEvent in
  //                       @lynx-js/web-mainthread-apis from the 'l-uid' attribute)
  // DOM events (used by the testing-library) do use real element references,
  // so we fall back to reference equality when neither identifier is present.
  self: (e) => {
    const t = e.target as { uid?: number; uniqueId?: number } | null | undefined;
    const ct = e.currentTarget as { uid?: number; uniqueId?: number } | null | undefined;
    if (t != null && typeof t.uid === 'number' && ct != null && typeof ct.uid === 'number') {
      return t.uid !== ct.uid;
    }
    if (t != null && typeof t.uniqueId === 'number' && ct != null && typeof ct.uniqueId === 'number') {
      return t.uniqueId !== ct.uniqueId;
    }
    return e.target !== e.currentTarget;
  },
};

/**
 * Wraps an event handler with Lynx event modifiers.
 *
 * Supported modifiers:
 * - `.once`    — handler is invoked at most once; subsequent events are ignored
 * - `.stop`    — registers the event as `catchEvent` (native Lynx stop-propagation)
 *               and also calls `event.stopPropagation()` for DOM environments
 * - `.prevent` — accepted for code portability; no-op on Lynx (no browser default actions exist)
 * - `.self`    — skips the handler unless the event target is the listener element
 *
 * The wrapped function is cached on `fn._withMods` keyed by the modifier
 * string so that stable function references survive re-renders.
 *
 * `.stop` sets `_lynxCatch = true` on the wrapper so that `patchProp` can
 * register the event as `catchEvent` — the native Lynx mechanism for stopping
 * event bubbling. Calling `stopPropagation()` at the JS level alone is not
 * sufficient because native Lynx bubbling is decided before JS handlers run.
 */
export function withModifiers(
  fn: (...args: unknown[]) => unknown,
  modifiers: string[],
): (...args: unknown[]) => unknown {
  if (!fn) return fn;

  // Per-function cache keyed by modifier combination so stable fn references
  // reuse the same wrapper (and the same `.once` `called` flag) across renders.
  const fnAny = fn as { _withMods?: Record<string, (...args: unknown[]) => unknown> };
  const cache = fnAny._withMods ?? (fnAny._withMods = {});
  const cacheKey = modifiers.join('.');
  if (cache[cacheKey]) return cache[cacheKey]!;

  const hasOnce = modifiers.includes('once');
  let called = false;

  const wrapped = (event: unknown, ...args: unknown[]): unknown => {
    if (hasOnce && called) return;

    const e = event as Record<string, unknown>;
    for (const mod of modifiers) {
      if (mod === 'once') continue;
      const guard = lynxModifierGuards[mod];
      if (guard?.(e)) return; // guard returned true → skip handler
      lynxModifierSideEffects[mod]?.(e);
    }

    if (hasOnce) called = true;
    return fn(event, ...args);
  };

  // Signal to patchProp to use catchEvent instead of bindEvent so native Lynx
  // stops bubbling at this element — the only reliable stop mechanism in Lynx.
  if (modifiers.includes('stop')) {
    (wrapped as { _lynxCatch?: boolean })._lynxCatch = true;
  }

  cache[cacheKey] = wrapped;
  return wrapped;
}

/**
 * No-op on native Lynx. The native runtime converts keyboard input to named
 * custom events (e.g. `confirm`) before they reach the JS thread —
 * `event.key` is never populated on iOS/Android regardless of whether the
 * keyboard is virtual or hardware. Use `@confirm` directly on `<input>` for
 * native targets.
 *
 * Works on web preview (lynx-stack#2594). Native support depends on an
 * upstream runtime change to forward `UIKeyboardEvent`/`KeyEvent` into the
 * Lynx JS event pipeline — not yet tracked upstream.
 *
 * @internal
 */
export function withKeys(
  fn: (...args: unknown[]) => unknown,
  _keys: string[],
): (...args: unknown[]) => unknown {
  return fn;
}

// ---------------------------------------------------------------------------
// v-model event payload helpers — shared by the vdom entry (makeVModelHandler)
// and the Vapor entry (applyTextModel)
// ---------------------------------------------------------------------------

/** Lynx `input`/`confirm` event payload shape used by v-model. */
export interface InputEventData {
  detail?: { value?: string; isComposing?: boolean };
}

/** `.number` modifier semantics: parseFloat with original-string fallback. */
export function looseToNumber(val: string): number | string {
  const n = Number.parseFloat(val);
  return Number.isNaN(n) ? val : n;
}
