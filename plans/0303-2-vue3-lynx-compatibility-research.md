# Research Plan: Vue 3 x Lynx Compatibility Research

## Objective

Understand the work required to run Vue 3 on Lynx, with a focus on the **testing infrastructure** perspective:

1. How does Vue 3's renderer interface integrate with Lynx BSI / Element PAPI?
2. Which existing patterns -- `applyProp()`, LynxTestingEnv, preact-upstream-tests -- can be directly reused?
3. What are the semantic gaps that require new shims or are unsupported?

No runnable code produced -- the output is a **gap analysis report with clear conclusions**.

---

## Prerequisites (Known conclusions, no need to re-research)

### Vue 3 RendererOptions Interface (Confirmed)

`createRenderer(options)` requires implementing 10 mandatory methods + 4 optional methods:

```typescript
// Mandatory (10)
createElement(type, namespace?, isCustomizedBuiltIn?, vnodeProps?)
createText(text)
createComment(text)
setText(node, text)
setElementText(el, text)
insert(el, parent, anchor?)
remove(el)
parentNode(node): HostElement | null     // <- requires read-back
nextSibling(node): HostNode | null       // <- requires read-back
patchProp(el, key, prevValue, nextValue, namespace?, parentComponent?)

// Optional (4)
querySelector?(selector)                 // <- used by Teleport, not supported by BSI
setScopeId?(el, id)                      // Scoped CSS
cloneNode?(node)                         // Static hoist optimization
insertStaticContent?(content, ...)       // Static hoist optimization
```

### patchProp Dispatch Structure (Confirmed)

```
patchProp(el, key, prev, next)
├── key === 'class'  →  __SetClasses(el, next)
├── key === 'style'  →  __SetInlineStyles(el, next)        [needs CSS variable and vendor prefix handling]
├── isOn(key)        →  __AddEvent(el, ...)                [invoker wrapper pattern]
├── shouldSetAsProp  →  el[key] = next                     [IDL properties, not supported by BSI]
└── else             →  __SetAttribute(el, key, next)
```

### Test Suite Structure (Confirmed)

- `@vue/runtime-core/__tests__/` -- 31 test files, use mock renderer, **do not depend on real DOM**
- `@vue/runtime-dom/__tests__/` -- 10 test files, patchClass/patchStyle/patchEvents etc., depend on real DOM

**runtime-core tests** are the most valuable upstream test target (analogous to preact's `preact/test/`).

---

## Research Tasks

### Task 0: Pull Vue 3 Source Code

```bash
# In packages/vue-upstream-tests/ or .context/
git clone --depth=1 https://github.com/vuejs/core vue-core
```

Key directories to focus on:

```
packages/runtime-core/src/
  renderer.ts          ← complete renderer implementation (~2500 lines)
  vnode.ts             ← VNode structure
packages/runtime-dom/src/
  patchProp.ts         ← patchProp entry point
  nodeOps.ts           ← reference DOM nodeOps implementation
  modules/
    class.ts
    style.ts
    events.ts          ← invoker pattern details
    attrs.ts
packages/runtime-core/__tests__/
  renderer*.spec.ts    ← directly examine renderer tests
  apiWatch.spec.ts
  apiLifecycle.spec.ts
```

---

### Task 1: Confirm BSI Read-Back Capability

**Core question**: Vue's `parentNode(node)` and `nextSibling(node)` are called frequently during the patch phase. BSI is currently write-only (only pushes patches), and does not support these two operations.

Need to confirm:

1. Read `packages/react/runtime/src/snapshot/BackgroundSnapshotInstance.ts` (or related files):
   - Does BSI have `parentNode` / `nextSibling` properties or methods?
   - Does BSI maintain in-memory parent-child relationships (or is it completely write-only)?

2. Read `packages/react/runtime/src/snapshot/SnapshotInstance.ts`:
   - Does SI support `parentNode` / `nextSibling` through jsdom nodes?

**Expected conclusion**: BSI needs to add in-memory tree structure (parent, nextSibling pointers) to satisfy Vue nodeOps requirements. This is one of the main architectural differences between VueLynx and ReactLynx.

---

### Task 2: Deep Read of events.ts Invoker Pattern

Vue's event updates **do not** removeEventListener + addEventListener; instead, they replace the handler inside the invoker:

```typescript
// The invoker calls addEventListener on first creation
// Subsequent updates only do: invoker.value = nextHandler
```

Need to confirm:

1. Does the current implementation of `__AddEvent(el, eventType, eventName, handler)` (`ElementPAPI.ts:209`) support this update-without-re-register semantic?
2. Vue event names are camelCase `onClick` -- does Lynx need `bind:tap` or `bindtap`? What are the event name conversion rules?
3. How do Vue event modifiers (`.stop`, `.prevent`, `.once`, `.capture`) map to the Lynx event system?

**Expected conclusion**: An invoker-like wrapper layer needs to be implemented in the `patchProp` event branch; `__AddEvent` cannot be called directly (because Vue frequently updates event handlers, and `__AddEvent` creates a new listener each time).

---

### Task 3: Deep Read of style.ts CSS Variable and v-show Compatibility

`style.ts` has several special handling cases:

1. **CSS variables** (`--xxx`): Uses `el.style.setProperty('--xxx', v)` instead of normal assignment
2. **v-show integration**: Saves original display value to `el._vod`, restores it on hide/show
3. **Vendor prefix auto-detection**: `webkit`/`moz`/`ms`

Need to confirm:

1. Does Lynx's `__SetInlineStyles` support CSS variables?
2. `v-show` needs to read back `el.style.display` -- BSI doesn't have this read capability, how to handle it?
3. Is the current `applyProp()` handling of style (`style:cssText`, `style:<prop>`) sufficient, or does it need extension?

---

### Task 4: Understand runtime-core Tests' Mock Renderer Pattern

**Objective**: Understand what the mock renderer used in `runtime-core/__tests__` looks like, and determine whether it can be directly replaced with the Lynx renderer.

Read several representative files in `packages/runtime-core/__tests__/`:

- `rendererElement.spec.ts` -- element creation / patch
- `rendererChildren.spec.ts` -- children updates (keyed, unkeyed, mixed)
- `apiWatch.spec.ts` -- watcher tests (not DOM-dependent)
- `apiLifecycle.spec.ts` -- lifecycle tests (not DOM-dependent)

Specific questions to answer:

1. What does the mock renderer provide? Is it a built-in test-utils or custom per test file?
2. How many assertions are based on DOM read-back (`innerHTML`, `querySelector`, `el.style`), and how many are based on the VDOM tree?
3. Which test files are completely DOM-free (only verifying lifecycle hooks, watcher callbacks, etc.)?
4. Estimate: if complete nodeOps were implemented, what would the initial pass rate for runtime-core tests be approximately?

---

### Task 5: Teleport and Suspense querySelector Dependency

Vue's `Teleport` component requires `querySelector` (to find the target container).

Need to confirm:

1. Is `Teleport` a separate renderer branch in `renderer.ts` or handled inline?
2. Is `querySelector` used only in `Teleport`, or in other places too?
3. Does Suspense's async handling require any special nodeOps support?

**Expected conclusion**: Teleport on Lynx needs an `id`-based lookup as an alternative to CSS selectors (similar to Lynx's own ref system). Can be a skip_list entry.

---

### Task 6: Comparative Analysis with Preact Upstream Tests

After completing the above research, compare with the preact-upstream-tests architecture and answer:

| Question                                     | Preact's Solution                 | Vue's Situation                                            |
| -------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| How to replace render()?                     | pipelineRenderPlugin rewrites calls | Vue uses `app.mount(el)` -- requires different intercept approach |
| Generic snapshot fallback?                   | `snapshotManager.values` interception | Vue nodeOps has no snapshot concept, not needed            |
| BSI shim (style/event/removeAttribute)?      | `shimBSI()`                       | Vue isolates through nodeOps, theoretically no shim needed |
| Main thread switch timing?                   | `options.__c` commit hook         | Vue's scheduler (`scheduler.ts`) flush timing              |
| Can skiplist structure be reused?            | Yes                               | Yes, fully reusable                                        |

---

## Output Format

After research is complete, update this file by adding under each Task:

```
### Conclusion
- [Confirmed] xxx
- [Needs addition] xxx
- [Unsupported/skip] xxx
- [Gap assessment] Effort: S/M/L
```

Final output as a **Gap Analysis Table**:

| Feature                             | Existing Lynx Support     | Needs Addition                | Complexity |
| ----------------------------------- | ------------------------- | ----------------------------- | ---------- |
| createElement/insert/remove         | BSI patch ops             | None                          | -          |
| parentNode / nextSibling            | No, BSI is write-only     | BSI needs in-memory tree      | M          |
| patchProp: class / style / attrs    | `applyProp()` covered     | None                          | -          |
| patchProp: events (invoker pattern) | `__AddEvent` no update    | Invoker wrapper layer         | M          |
| querySelector (Teleport)            | No                        | skip_list                     | -          |
| v-show (style read-back)            | No                        | Shim or skip                  | S          |
| cloneNode (static hoist)            | No                        | skip_list (optional optimization, not required) | -  |
| CSS variables                       | To be confirmed           | TBD                           | ?          |
| Event name conversion onClick -> bindtap | No                   | Conversion function           | S          |

---

## Execution Order

1. **Task 0** -- Pull code (10 min)
2. **Task 1 + Task 2** -- In parallel (BSI read-back + invoker pattern) (30 min)
3. **Task 3 + Task 5** -- In parallel (style gaps + Teleport) (20 min)
4. **Task 4** -- runtime-core test structure (20 min)
5. **Task 6** -- Summary comparison (10 min)

Total estimate: approximately 90 minutes of research -> Gap Analysis Table output.
