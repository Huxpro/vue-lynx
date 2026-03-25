# ops-apply.ts Split Refactoring

> **Initiative type**: Better Engineering -- manual code review findings
> **Origin**: `todo.md` section ops-apply.ts + section Source code vise (marked in todo.md -> this plan)

## Background

### Problem 1: Mixed responsibilities in `ops-apply.ts`

`packages/vue/main-thread/src/ops-apply.ts` is currently 494 lines, mixing three unrelated categories of responsibilities:

| Category                          | Lines   | Characteristics                                                    |
| --------------------------------- | ------- | ------------------------------------------------------------------ |
| Core DOM ops (11 op codes)        | ~130    | Independent, each case 5-9 lines                                   |
| List logic                        | ~180    | Invades CREATE / INSERT / SET_PROP three cases + post-flush loop   |
| MTS/Worklet logic                 | ~110    | Independent SET_WORKLET_EVENT / SET_MT_REF / INIT_MT_REF           |

### Problem 2: Duplicate OP protocol definitions (single source of truth violation)

`runtime/src/ops.ts` and `main-thread/src/ops-apply.ts` each define their own `const OP = { ... }`.
The latter has a comment on line 15 stating **"mirrored from runtime/ops.ts -- must stay in sync"** -- this is an obvious code smell:

- Adding a new op code requires changing two files
- A mistake or omission will silently fail (wrong integer -> wrong behavior, no compile error)

The `OP` constants are the **wire protocol** between BG Thread and Main Thread, belonging to neither side.
There should be a single source of truth for their definition.

---

As list and worklet features continue to evolve, continuing to pile everything in the same file will lead to:

- Linearly increasing maintenance difficulty
- Unit tests unable to independently mock state for each category of logic
- Confused focus during code review

## Performance Premise: Splitting Does Not Affect Lepus Runtime Performance

**Key fact**: `main-thread-bundled.js` is built by rslib into a flat ESM without module wrappers.
The Lepus engine sees a single compilation unit at runtime; module boundaries disappear after bundling. JIT can freely inline functions across original file boundaries, identical to having functions in the same file.

Furthermore, the real bottleneck on the Main Thread is PAPI (FFI calls at approximately 50-500 us), while function call overhead is approximately 2-20 ns, a ratio of < 0.04%, negligible.

**Function extraction constraint**: Use module-level named function declarations (`function foo()` rather than `const foo = () =>`), as this is the form most easily inlined by V8/JSC Turbofan/DFG.

## Target File Structure

```
packages/vue/
├── shared/                        (NEW package) vue-lynx/internal/ops
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── ops.ts                 Only OP const + format doc comments (no pushOp/takeOps)
│
├── runtime/src/
│   └── ops.ts                     OP changed to re-export from shared; retains pushOp / takeOps
│
└── main-thread/src/
    ├── entry-main.ts              (modified: import elements source changed)
    ├── element-registry.ts        (NEW)  only elements Map
    ├── ops-apply.ts               (slimmed) ~150 lines, pure switch loop; OP from shared
    ├── list-apply.ts              (NEW)  ~200 lines, all list state and functions
    └── worklet-apply.ts           (NEW)  ~120 lines, all worklet state and functions
```

---

## Step 0: Create `packages/vue/shared/` -- OP Protocol Package

### Why Not Export `OP` Directly from `runtime`

`runtime/src/ops.ts` contains three things: `OP` (protocol), `pushOp` (BG buffer write), `takeOps` (BG buffer read).
Having `main-thread` import `vue-lynx` would mean the executor depends on the renderer -- an architecturally incorrect semantic.
Both should be peer protocol implementers, with no interdependency.

### New Package: `vue-lynx/internal/ops`

Minimal workspace package, containing only the shared wire protocol definition:

```ts
// packages/vue/shared/src/ops.ts
/**
 * Flat-array operation codes — the wire protocol between BG Thread and Main Thread.
 *
 * Format:
 *   CREATE:            [0, id, type]
 *   CREATE_TEXT:       [1, id]
 *   INSERT:            [2, parentId, childId, anchorId]   anchorId=-1 means append
 *   REMOVE:            [3, parentId, childId]
 *   SET_PROP:          [4, id, key, value]
 *   SET_TEXT:          [5, id, text]
 *   SET_EVENT:         [6, id, eventType, eventName, sign]
 *   REMOVE_EVENT:      [7, id, eventType, eventName]
 *   SET_STYLE:         [8, id, styleObject]
 *   SET_CLASS:         [9, id, classString]
 *   SET_ID:            [10, id, idString]
 *   SET_WORKLET_EVENT: [11, id, eventType, eventName, workletCtx]
 *   SET_MT_REF:        [12, id, refImpl]
 *   INIT_MT_REF:       [13, wvid, initValue]
 */
export const OP = {
  CREATE: 0,
  CREATE_TEXT: 1,
  INSERT: 2,
  REMOVE: 3,
  SET_PROP: 4,
  SET_TEXT: 5,
  SET_EVENT: 6,
  REMOVE_EVENT: 7,
  SET_STYLE: 8,
  SET_CLASS: 9,
  SET_ID: 10,
  SET_WORKLET_EVENT: 11,
  SET_MT_REF: 12,
  INIT_MT_REF: 13,
} as const;

export type OpCode = typeof OP[keyof typeof OP];
```

`package.json`: `"private": true` (monorepo internal only, not published).

### Adjustments in Each Package

**`runtime/src/ops.ts`**:

```diff
- export const OP = { CREATE: 0, ... } as const
+ export { OP } from 'vue-lynx/internal/ops'

  export function pushOp(...args: unknown[]): void { ... }
  export function takeOps(): unknown[] { ... }
```

**`main-thread/src/ops-apply.ts`**:

```diff
- // Op codes (mirrored from runtime/ops.ts – must stay in sync)
- const OP = { CREATE: 0, ... } as const
+ import { OP } from 'vue-lynx/internal/ops'
```

**`main-thread/rslib.config.ts`**: `vue-lynx/internal/ops` is **not added to externals**, letting rslib inline the 14 integer constants directly into `main-thread-bundled.js`. No runtime cross-package dependency, only compile-time single source of truth.

---

## Step 1: Create `element-registry.ts`

The `elements` Map is currently defined in `ops-apply.ts`, but is accessed by `entry-main.ts` (seed page root), list logic, and worklet logic simultaneously. Making it independent avoids circular dependencies.

```ts
// element-registry.ts
/** Map from BG-thread ShadowElement id → Lynx Main Thread element handle */
export const elements = new Map<number, LynxElement>();
```

---

## Step 2: Create `list-apply.ts`

Migrate the following content from `ops-apply.ts`:

**State** (all module-level):

- `listElementIds: Set<number>`
- `listItems: Map<number, ListItemEntry[]>`
- `itemKeyMap: Map<number, string>`
- `listItemPlatformInfo: Map<number, Record<string, unknown>>`
- `listItemsReported: Map<number, number>`
- `PLATFORM_INFO_ATTRS: Set<string>`
- `enqueueComponentNoop()`
- `createListCallbacks()` internal functions

**Public exports** (called by `ops-apply.ts` switch cases):

```ts
// Query
export function isListParent(parentId: number): boolean;
export function isPlatformInfoAttr(key: string): boolean;

// Called by CREATE case
export function createListElement(id: number): LynxElement;
// Internally: set up 6 state structures + __CreateList + __SetCSSId

// Called by INSERT case
export function insertListItem(
  parentId: number,
  child: LynxElement,
  childId: number,
): void;
// Internally: listItems.get(parentId)?.push(...)

// Called by SET_PROP case
export function setPlatformInfoProp(
  id: number,
  key: string,
  value: unknown,
): void;
// Internally: write listItemPlatformInfo, itemKey written to itemKeyMap separately

// Called at end of applyOps (original lines 449-476)
export function flushListUpdates(): void;
// Internally: iterate listItems, construct insertAction, __SetAttribute update-list-info

// For testing
export function resetListState(): void;
```

---

## Step 3: Create `worklet-apply.ts`

Migrate all logic from the `SET_WORKLET_EVENT` / `SET_MT_REF` / `INIT_MT_REF` three cases.
These three sections share the `lynxWorkletImpl` access pattern, which can be extracted as an internal helper.

**Public exports**:

```ts
export function applySetWorkletEvent(
  id: number,
  eventType: string,
  eventName: string,
  ctx: Record<string, unknown>,
): void;

export function applySetMtRef(id: number, refImpl: unknown): void;

export function applyInitMtRef(wvid: number, initValue: unknown): void;

// For testing
export function resetWorkletState(): void;
```

Internal helper (not exported):

```ts
// Access globalThis.lynxWorkletImpl._refImpl, encapsulating repeated null check chains
function getWorkletRefImpl(): WorkletRefImpl | undefined;
```

---

## Step 4: Slim down `ops-apply.ts`

Post-refactoring structure:

```ts
import { elements } from './element-registry.js';
import {
  isListParent,
  isPlatformInfoAttr,
  createListElement,
  insertListItem,
  setPlatformInfoProp,
  flushListUpdates,
} from './list-apply.js';
import {
  applySetWorkletEvent,
  applySetMtRef,
  applyInitMtRef,
} from './worklet-apply.js';

export function applyOps(ops: unknown[]): void {
  // duplicate-batch guard (unchanged)

  while (i < len) {
    switch (code) {
      case OP.CREATE: {
        // type === 'list'      → createListElement(id)
        // type === '__comment' → __CreateRawText('')
        // else                 → __CreateElement(type, 0) + __SetCSSId
        elements.set(id, el);
        break;
      }
      case OP.CREATE_TEXT: {
        /* unchanged */ break;
      }
      case OP.INSERT: {
        // isListParent(parentId) → insertListItem(parentId, child, childId)
        // else                   → __AppendElement / __InsertElementBefore
        break;
      }
      case OP.REMOVE: {
        /* unchanged */ break;
      }
      case OP.SET_PROP: {
        // isPlatformInfoAttr(key) → setPlatformInfoProp(id, key, value)
        // else                    → __SetAttribute
        break;
      }
      case OP.SET_TEXT: {
        /* unchanged */ break;
      }
      case OP.SET_EVENT: {
        /* unchanged */ break;
      }
      case OP.REMOVE_EVENT: {
        /* unchanged */ break;
      }
      case OP.SET_STYLE: {
        /* unchanged */ break;
      }
      case OP.SET_CLASS: {
        /* unchanged */ break;
      }
      case OP.SET_ID: {
        /* unchanged */ break;
      }

      case OP.SET_WORKLET_EVENT: {
        applySetWorkletEvent(ops[i++], ops[i++], ops[i++], ops[i++]);
        break;
      }
      case OP.SET_MT_REF: {
        applySetMtRef(ops[i++], ops[i++]);
        break;
      }
      case OP.INIT_MT_REF: {
        applyInitMtRef(ops[i++], ops[i++]);
        break;
      }
    }
  }

  flushListUpdates();
  __FlushElementTree();
}

export { elements };

export function resetMainThreadState(): void {
  elements.clear();
  resetListState();
  resetWorkletState();
}
```

Expected to be approximately 150 lines after slimming, with a clean and readable switch loop.

---

## Step 5: Update `entry-main.ts`

```diff
- import { applyOps, elements } from './ops-apply.js'
+ import { elements } from './element-registry.js'
+ import { applyOps } from './ops-apply.js'
```

---

## Step 6: Update Tests (`src/__test__/`)

- `resetMainThreadState()` internally delegates to each sub-module, external interface unchanged
- If there are unit tests targeting list/worklet, they can directly import `list-apply.ts` / `worklet-apply.ts` to independently test their state management

---

## Note on List Invading CREATE / INSERT / SET_PROP

Even after extracting `list-apply.ts`, these three cases still have "is this a list" conditional checks. This is unavoidable: the op stream is encoded by operation type, not by element type.

In the future, a `CREATE_LIST: 14` op code could be introduced to completely eliminate the `type === 'list'` branch in the CREATE case, letting the BG side explicitly choose different op codes. But the current benefit is that the BG side does not need to be aware that Lepus uses `__CreateList`, maintaining BG/MT decoupling. Consider this when profiling data shows it to be a hotspot.

---

## Scope of Changes

```
packages/vue/
├── shared/                    New package (~30 lines, private)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/ops.ts
│
├── runtime/
│   ├── package.json           New dep: vue-lynx/internal/ops
│   └── src/ops.ts             OP changed to re-export; pushOp/takeOps unchanged
│
└── main-thread/
    ├── package.json           New dep: vue-lynx/internal/ops
    ├── rslib.config.ts        Do not external vue-internal (inline constants)
    └── src/
        ├── entry-main.ts      Modified import (elements source)
        ├── element-registry.ts New (~3 lines)
        ├── ops-apply.ts        Slimmed (~150 lines); OP from vue-internal
        ├── list-apply.ts       New (~200 lines)
        └── worklet-apply.ts    New (~120 lines)
```

`rspeedy-plugin` and `e2e-lynx` require no changes.

## Acceptance Criteria

- [ ] `pnpm build` passes in `packages/vue/shared`, `packages/vue/runtime`, `packages/vue/main-thread`
- [ ] `main-thread-bundled.js` has no significant size increase (OP constants inlined, no runtime module introduced)
- [ ] `runtime/src/ops.ts` no longer has a local `const OP = { ... }` definition
- [ ] `main-thread/src/ops-apply.ts` no longer has a local `const OP = { ... }` definition, nor the "must stay in sync" comment
- [ ] Existing e2e-lynx demos (counter, gallery, swiper) behave unchanged on LynxExplorer
- [ ] `resetMainThreadState()` still properly cleans up all state in tests
- [ ] No debug leftovers other than `console.log` in new files (SET_EVENT / SET_WORKLET_EVENT `console.info` retained)
