# Stage 2 · Drive the UI

Goal: your framework's declarative model — whatever it is: VDOM, signals, compiled
templates, an Elm loop — creates, updates, and removes real Lynx elements, and receives
events back. This is where "how my framework touches the DOM" becomes "how my framework
speaks Element PAPI".

## The contract the engine calls

Your main-thread program must define a small set of global callbacks. Define them all,
even as no-ops — the engine will call them:

```js
globalThis.renderPage = function (data) { /* build + paint the first frame */ };
globalThis.processData = function (data) { /* pre-render data updates */ };
globalThis.updatePage = function (data, options) { /* native-driven data updates */ };
```

`renderPage` is your first frame: create the page root (`__CreatePage("0", 0)`), build
the tree, and `__FlushElementTree()`. Two timing facts that every integration learns
the hard way:

- **PageConfig lands late.** The engine decodes `pageConfig` onto the ElementManager
  only *after* your main-thread script evaluates (`TemplateAssembler::DidVMExecute`).
  Elements created during evaluation see config-dependent defaults — notably
  `defaultOverflowVisible` — as unset, and paint clipped. Defer your first render to
  the `renderPage` callback; don't paint at module top-level. (Octane documents and
  handles this explicitly; copy that.)
- **Nothing paints until you flush.** `__FlushElementTree()` is the commit point.
  Batch, then flush once.

## Element PAPI in ten minutes

It's a DOM-shaped C++ API exposed to the main-thread JS runtime. The parts that matter:

**Creation is typed.** Use the specific creators — the engine attaches per-type
behavior: `__CreateView`, `__CreateText`, `__CreateRawText(text)`, `__CreateImage`,
`__CreateScrollView`, `__CreateList`, and `__CreateElement(tag, …)` only as the
fallback. Text content lives in `raw-text` children (`__SetAttribute(rawText, 'text',
value)`), not as a text property of `<text>`.

**Tree ops are what you expect.** `__AppendElement`, `__InsertElementBefore`,
`__RemoveElement`, `__ReplaceElements`, `__SwapElement`, plus `__GetParent`,
`__ElementIsEqual`, `__GetElementUniqueID` (a stable numeric id — you will want it).

**Props are routed by kind — this is not `setAttribute` all the way down:**

| your concept | PAPI call |
|---|---|
| CSS classes | `__SetClasses(el, "row danger")` |
| inline style | `__SetInlineStyles(el, styles)` |
| id | `__SetID(el, id)` |
| dataset | `__SetDataset(el, bag)` |
| scoped-CSS scope | `__SetCSSId(els, cssId)` |
| everything else | `__SetAttribute(el, key, value)` |

Routing wrong doesn't throw — it silently does nothing or the wrong thing. (Octane's
`applyProps` is a good reference implementation of the full routing table.)

**Events have three registration semantics.** `__AddEvent(el, kind, name, handler)`
where kind is `bindEvent` (bubbling, the default you want), `catchEvent` (**stops
propagation** — this is not "addEventListener with capture", and using it as your
default silently breaks parent handlers; a real integration shipped this bug), or
`capture-bind`/`capture-catch`. The handler value is a *string or object token*, not a
closure — who receives it and where is a stage-3 decision; for a main-thread-only
integration a `{type:'worklet', value: fn}` object works today.

**Lists are the platform's gift — take it.** `__CreateList(parent, componentAtIndex,
enqueueComponent, opts, componentAtIndexes)` gives you native windowed recycling: the
engine asks for cells on demand and returns them to your reuse pool. All four mature
integrations wired it; the one that passed `null, null` (miso, for now) gets an
eagerly-materialized list and none of the platform's scroll performance. If you adopt
one platform-specific API deeply, make it this one.

## Bridging your framework: three shapes, all shipped

**(a) Direct adapter — a day of work.** If your framework already has a renderer seam
(Vue's `createRenderer`, miso's `DrawingContext`, any React-reconciler-style host
config), implement it straight onto PAPI. miso-lynx's entire bridge is 105 lines:

```ts
createElement: (tag) => { switch (tag) { case 'view': return __CreateView(pageId); … } },
appendChild:   (p, c) => __AppendElement(p, c),
setAttribute:  (n, k, v) => k === 'id' ? __SetID(n, v) : __SetAttribute(n, k, v),
flush:         () => __FlushElementTree(),
```

This runs your whole framework on the main thread. It is the fastest possible port and
a legitimate architecture (stage 3 discusses when) — but know you're deferring the
threading decision, not escaping it.

**(b) Retained mirror + op stream.** Your framework runs on the background thread
against a lightweight mirror tree (Vue Lynx's `ShadowElement`); mutations serialize
into a flat op buffer that a small main-thread interpreter replays into PAPI calls.
Your framework's renderer seam doesn't change — only its "DOM" becomes the mirror.

**(c) Compiled structures.** Your compiler splits each template into a static shell +
a hole list. ReactLynx bakes the shell as a `create()` function of straight-line PAPI
calls; Octane emits a JSON plan with a slot table. Either way the runtime only moves
*hole values*, and the wire (stage 3) gets radically cheaper.

Start with (a) or (b). Shape (c) is a stage-3 optimization that assumes you already
know what crosses your wire.

**Done when:** the krausest-style table app — create/update/select rows, events firing
— runs in your framework on Lynx for Web. Steal the app contract from
`huxpro/vue-lynx` `packages/benchmark/apps/` so your numbers are comparable with every
framework in this series from day one.
