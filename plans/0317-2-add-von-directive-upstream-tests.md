# Plan: Add vOn directive tests to upstream-tests

## Context

The upstream-tests only include 5 of 10 runtime-dom test files, all focused on `patchProp` variants. The `directives/vOn.spec.ts` tests are highly feasible to add because:
- `withModifiers` and `withKeys` are already implemented in `@vue/runtime-dom` and can be re-exported from the bridge
- The tests use `patchEvent()` (thin wrapper over patchProp for events) + `dispatchEvent` — same pattern as patchEvents tests
- No full render pipeline needed

`vShow` is **out of scope** — all its tests use `render(h(component), root)` which requires the full component rendering pipeline that the bridge doesn't support.

## Problem with current forwarder

The current bridge forwarder dispatches `new Event(papiKey)` — a bare event with no properties. The vOn tests depend on original event properties for modifier checks (`withModifiers(['ctrl'])` checks `e.ctrlKey`, `withModifiers(['stop'])` calls `e.stopPropagation()`, etc.).

## Changes

### 1. Fix forwarder to preserve original event properties

**File:** `upstream-tests/src/lynx-runtime-dom-bridge.ts` (line 275)

Change the forwarder to directly call the PAPI listener from `eventMap` with the original event:

```typescript
const forwarder = ((evt: Event) => {
  const papiListener = (el as any).eventMap?.[targetPapiKey];
  if (typeof papiListener === 'function') {
    papiListener(evt);
  }
}) as EventListener;
```

This preserves all event properties (ctrlKey, button, key, target/currentTarget, stopPropagation, preventDefault) while still exercising the ops pipeline: SET_EVENT/REMOVE_EVENT register the listener in eventMap via `__AddEvent`, and the forwarder invokes that listener → `publishEvent(sign, evt)` → event registry → user handler.

Existing patchEvents tests are unaffected — they only check call counts, not event properties.

### 2. Add `patchEvent` export to bridge

**File:** `upstream-tests/src/lynx-runtime-dom-bridge.ts`

The vOn tests import `patchEvent` from `../../src/modules/events`. Add a thin wrapper near the other exports:

```typescript
export function patchEvent(
  el: Element,
  rawName: string,
  prevValue: unknown,
  nextValue: unknown,
  _instance?: unknown,
): void {
  patchProp(el, rawName, prevValue, nextValue);
}
```

### 3. Use real `withModifiers`/`withKeys` from `@vue/runtime-dom`

**File:** `upstream-tests/src/lynx-runtime-dom-bridge.ts`

The vue-lynx `withModifiers`/`withKeys` are stubs that just return `fn` without applying any modifiers. The bridge must import the real implementations from `@vue/runtime-dom` instead:

```typescript
export { withModifiers, withKeys } from '@vue/runtime-dom';
```

### 4. Add import rewrite for `../../src/modules/events`

**File:** `upstream-tests/vitest.dom.config.ts`

The vOn test lives in `__tests__/directives/`, so the import path is `../../src/modules/events` (two levels up). Add rewrite rule in `rewriteRuntimeDomImportsPlugin`:

```typescript
// '../../src/modules/events' → bridge (tests in __tests__/directives/)
result = result.replace(
  /from\s+['"]\.\.\/\.\.\/src\/modules\/events['"]/g,
  `from '${bridgePath}'`,
);
```

### 5. Add vOn to included tests

**File:** `upstream-tests/vitest.dom.config.ts`

Add `'directives/vOn'` to `includedTests` array.

## Files Modified

| File | Change |
|------|--------|
| `upstream-tests/src/lynx-runtime-dom-bridge.ts` | Fix forwarder; add `patchEvent` export; use real `withModifiers`/`withKeys` from `@vue/runtime-dom` |
| `upstream-tests/vitest.dom.config.ts` | Add `../../src/modules/events` rewrite; add `directives/vOn` to includedTests |

## Verification

1. `cd upstream-tests && pnpm test:dom` — all existing 21 tests + 8 new vOn tests pass (29 total)
2. `cd testing-library && pnpm test` — unaffected (32 tests pass)
3. No skiplist entries needed — all 8 vOn tests pass
