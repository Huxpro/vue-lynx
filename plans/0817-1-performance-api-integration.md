# Feature: Lynx Performance API integration (Pipeline / Timing)

**Date**: 2026-08-17
**Status**: Implemented on `main` (vdom), ported to `vapor`

---

## Background

Lynx attributes rendering work to a **Lynx Pipeline** — the unit that runs from a
rendering trigger to the pixels it produces. The engine records the pixel half
itself, but the framework half (diff, serialization, cross-thread transfer,
element mutation) is invisible to it unless the framework opts in. A framework
that does not integrate produces no `PipelineEntry` for its own updates and no
`pipeline.loadBundle` correlation for its first screen: `PerformanceObserver`
fires, but the entries are hollow.

lynx-family/lynx-website#1311 is the first public specification of what that
opt-in looks like for a framework that is *not* ReactLynx. It adds:

- `PipelineOptions` — the correlation context (`pipelineID`, `pipelineOrigin`,
  `needTimestamps`, `dsl`, `stage`)
- `__FlushElementTree(root?, options?)` — the submission boundary, with
  `options.pipelineOptions` as the association point
- four framework hooks on `lynx.performance`: `_generatePipelineOptions`,
  `_onPipelineStart`, `_markTiming`, `_bindPipelineIdWithTimingFlag`
- an integration guide with lifecycle rules, timing keys, and a conformance list

Reference implementation studied: `@lynx-js/react` in lynx-stack —
`packages/react/runtime/src/core/performance.ts` (pipeline lifecycle),
`snapshot/lifecycle/patch/commit.ts` (BTS commit), `patch/updateMainThread.ts`
(MTS apply), `snapshot/lynx/calledByNative.ts` (engine callbacks), and the newer
`element-template/` backend, which routes the same context through a different
transport.

## Design

The integration is a **property of the ops pipeline, not of the renderer**.
Vue Lynx's background thread funnels every mutation through `scheduleFlush()` →
`doFlush()` → `callLepusMethod('vuePatchUpdate', …)`, and the main thread through
`vuePatchUpdate` → `applyOps()` → `__FlushElementTree()`. Those four points are
where a pipeline is opened, marked, transferred, and committed — and they are the
same four points whether the tree above them is produced by the virtual-DOM
renderer or by Vapor. So the integration lives entirely in the ops layer and is
shared verbatim by both.

### Pipeline ownership

| Pipeline | Initiator | How Vue Lynx handles it |
|---|---|---|
| `loadBundle` (first screen) | Engine | Arrives at `renderPage`. **Retained**, then attached to whichever flush submits real content. |
| `updateTriggeredByBts` (update) | Vue Lynx (BG) | Created per scheduler tick that produces ops, transferred with the batch, committed by the flush that applies it. |
| `updatePage` / `updateGlobalProps` | Engine / Native | Forwarded verbatim to a flush so the pipeline completes. |

**The first background batch is deliberately not a framework pipeline.** This is
the structural difference from ReactLynx. ReactLynx's `renderPage` builds the
real element tree synchronously on the main thread, so the engine's load pipeline
is consumed there, and the background thread's first message is *hydration* —
which ReactLynx opens as its own `reactLynxHydrate` pipeline. In a non-IFR Vue
Lynx build, `renderPage` creates nothing but an empty page root: that page is a
**placeholder** in exactly the sense the integration guide defines, and the first
screen is the background thread's first batch. If the background thread opened a
framework pipeline for it, two pipelines would compete for one flush and the
`loadBundle` correlation — the one that produces first-screen metrics — would
lose. So the background side skips its first batch, and the main thread attaches
the retained load pipeline to it.

With IFR the load pipeline is consumed by `renderPage` instead, because the first
screen really is built there. Both cases are handled by the same rule: *the load
pipeline rides the first flush that submits real content*, and `runIfrRender()`
now reports whether that flush is `renderPage`'s own.

### Timing keys

Marked where the corresponding work happens:

| Thread | Window | Keys |
|---|---|---|
| BG | first mutation of a tick → post-flush | `diffVdomStart` / `diffVdomEnd` |
| BG | `JSON.stringify(ops)` | `packChangesStart` / `packChangesEnd` |
| MT | `JSON.parse(data)` | `parseChangesStart` / `parseChangesEnd` |
| MT | ops interpreter + list flush | `patchChangesStart` / `patchChangesEnd` |

`diffVdomStart` is forced (`needTimestamps` bypassed) because the Timing Flag
that enables timestamps can only be discovered *during* the diff — the same
reason ReactLynx forces it. Everything else is gated, so an unflagged update
costs one `_generatePipelineOptions` + `_onPipelineStart` + one mark, and no
per-stage engine calls.

Vue Lynx never emits `hydrateParseSnapshot*` (it re-renders rather than parsing a
snapshot), `mtsRender*` (not in the public key list), or the deprecated
`update*`-prefixed keys.

### Timing Flags

An application marks content with `__lynx_timing_flag="..."`. The framework's
only job is to raise `needTimestamps` on the pipeline that batch rides in — the
engine reads the attribute off the element and uses it as the
`PipelineEntry.identifier` itself. Vue Lynx does **not** call
`_bindPipelineIdWithTimingFlag`; binding there as well would attribute the same
flag twice. (ReactLynx behaves identically: `prepareSpreadForCommit` sets
`needTimestamps` and nothing else. It reserves `_bindPipelineIdWithTimingFlag`
for the flag it synthesizes for its own hydrate pipeline, `react_lynx_hydrate`,
which Vue Lynx has no equivalent of.)

Because the flag can be the *first* mutation of a tick — before the renderer
reaches its `scheduleFlush()` — `observeTimingFlagProp` opens the pipeline itself
if needed; `beginUpdatePipeline` is idempotent within a tick.

### Lifecycle guarantees

The guide's cancellation rules map onto existing code paths:

| Condition | Behavior |
|---|---|
| Tick produces no ops | `doFlush` drops the pipeline instead of carrying it forward |
| Empty batch on MT | `applyOps` returns `false`; pending load pipeline untouched |
| Duplicate batch (double bundle eval) | same as above |
| IFR hydration consumed the batch | batch pipeline released, load pipeline untouched |
| Reload / page replacement | `resetMainThreadState()` drops every held pipeline |
| Engine supplies no options | flush calls keep their exact pre-integration shape |

`flushElementTree()` preserves the caller's flush scope (`__FlushElementTree()`
vs `__FlushElementTree(page)`) when there is nothing to associate, and merges
`pipelineOptions` into caller-owned options rather than replacing them.

### Version gating

`_onPipelineStart(pipelineID, options)` — the form that carries `dsl`/`stage` —
landed in Lynx 3.1. Below that, only the id is passed. Every hook is called
through an optional-call guard, so an engine without `lynx.performance` degrades
to the pre-integration behavior with no branches in the hot path beyond one
undefined check.

## Change

### Shared (`internal/src/ops.ts`)

`PipelineOptions`, `FlushOptions`, `FrameworkTimingKey`, and the constants
`PIPELINE_ORIGIN_UPDATE_BTS`, `PIPELINE_STAGE_UPDATE`, `DSL_VUE`,
`TIMING_FLAG_ATTR`. This module is already the single wire-protocol source both
bundles import, and the pipeline context is part of that wire protocol now.

### Background thread

- **`runtime/src/performance.ts`** (new) — pipeline lifecycle: open, mark,
  observe flags, take, drop. Renderer-agnostic.
- **`runtime/src/flush.ts`** — `scheduleFlush()` opens the pipeline;
  `doFlush()` marks `diffVdomEnd` / `packChanges*`, attaches the context to the
  `callLepusMethod` payload, drops it on an empty batch.
- **`runtime/src/node-ops.ts`** — `patchProp` reports `__lynx_timing_flag`.
- **`runtime/src/index.ts`** — `setFrameworkDsl` (internal), reset wiring.

### Main thread

- **`main-thread/src/performance.ts`** (new) — receives pipelines, arbitrates
  between the retained load pipeline and a batch pipeline, and owns
  `flushElementTree()`. ES2019 only (LEPUS bytecode constraint).
- **`main-thread/src/entry-main.ts`** — `renderPage` retains
  `options.pipelineOptions`; `updatePage` / `updateGlobalProps` forward engine
  options to a flush instead of being no-ops; `vuePatchUpdate` adopts the
  batch pipeline and marks `parseChanges*`.
- **`main-thread/src/ops-apply.ts`** — marks `patchChanges*`, flushes through
  `flushElementTree()`, returns whether it submitted; `resetMainThreadState()`
  drops held pipelines.
- **`main-thread/src/ifr.ts`** — `runIfrRender()` returns whether a first screen
  was painted on this thread.

### Wire format

`callLepusMethod('vuePatchUpdate', { data })` → `{ data, pipelineOptions? }`.
Additive and both-ways compatible: an older main thread ignores the extra field,
and an older background thread simply sends `undefined`.

## vdom vs Vapor

The two are structurally the same integration. Everything above — both new
modules, the flush wiring, the wire format, the lifecycle rules — is byte-for-byte
identical on `main` and `vapor`. The differences are three, and all of them are
small:

1. **Where the timing flag is observed.** The vdom renderer has one generic
   attribute path (`node-ops.ts` `patchProp`'s final `else`). Vapor writes
   attributes from several places — `ShadowElement.setAttribute`, the template
   clone path, and its own `node-ops` — so the observation call appears at each
   of them. Same one-line call, more call sites.
2. **`dsl`.** The vapor branch runs both rendering strategies, so it reports
   `vue-vapor` for Vapor apps via `setFrameworkDsl()` and leaves `vue` for the
   vdom renderer. Keeping them distinct is the whole point: the two have very
   different framework-rendering cost profiles, and merging them under one `dsl`
   would make pipeline data unable to tell them apart.
3. **What `diffVdomStart`/`diffVdomEnd` actually measure.** Under vdom it is a
   virtual-DOM diff. Under Vapor there is no virtual DOM at all — it is the
   window in which reactive effects write directly into the ops buffer. The keys
   are the same because the public key list has no other name for "framework
   rendering work on the background thread" (see the feedback below).

That the seam is the ops pipeline rather than the renderer is what makes this
work. A renderer-level integration — hooking Vue's component render, the way
ReactLynx hooks Preact's `options._render` — would have had to be written twice
and would not have survived the vdom→Vapor change.

## Feedback for lynx-family/lynx-website#1311

The PR is a genuinely good spec — the ownership tables and the pipeline/flush
distinction are the parts a framework author actually needs, and they are right.
The following came up while implementing against it.

**1. The Timing Flag procedure contradicts the reference implementation.**
`_bindPipelineIdWithTimingFlag`'s "Usage requirements" tell a framework to
(1) set `needTimestamps`, (2) bind the flag, (3) submit. ReactLynx does only (1)
and (3) for application flags; the engine derives `identifier` from the element
attribute. Following the documented procedure would bind the same flag twice.
The page should say that `_bindPipelineIdWithTimingFlag` is for
*framework-synthesized* flags (ReactLynx's `react_lynx_hydrate`), and that an
application `__lynx_timing_flag` needs `needTimestamps` only. This is the single
most likely thing for an integrator to get wrong, because the current wording is
imperative and specific.

**2. `renderPage(data, options?)` is documented as the load-pipeline entry point,
but ReactLynx's own `LynxCallByNative` types it as `(data) => void`.** The guide
marks the callback contract "To be added" and CFP-04 tracks the signature, but a
reader will not notice that the *only* validated path today is the engine's
implicit flush inside `renderPage`. Frameworks whose `renderPage` produces a
placeholder — which the guide itself describes at length — have no documented way
to obtain the load pipeline at all. Worth stating plainly which SDK versions pass
the second argument, since the whole placeholder section depends on it.

**3. The placeholder case deserves promotion, not a subsection.** A
background-driven framework whose `renderPage` creates only a page root is not an
edge case — it is the default shape for anything that isn't ReactLynx-with-IFR.
The guide handles it correctly (retain, don't consume with empty batches), but it
reads as an exception to the synchronous case. Recommend leading with it.

**4. `FrameworkTimingKey` is vdom-vocabulary in a framework-neutral contract.**
`diffVdomStart` / `diffVdomEnd` are the only keys for "framework rendering work
before serialization", and they are unusable as written by any framework without
a virtual DOM — signal-based frameworks, Vue Vapor, Svelte-style compilers. We
emit them anyway because there is no alternative, which makes the reported data
mildly dishonest. CFP-09 asks for framework-neutral `hydrate`/`update`
*semantics*; the same treatment is needed for the *key names*. A neutral alias
(`frameworkRenderStart`/`End`) with the `diffVdom*` names retained for
compatibility would fix it.

**5. `stage` has no value for "first screen".** The enumerated values are
`hydrate` and `update`. A framework-initiated pipeline that submits the first
screen is neither: it is not reconciling against an existing representation, and
it is not "ordinary rendering after initialization". We avoid the question by
letting the engine's `loadBundle` pipeline own the first screen, but a framework
that must open its own would have to pick a wrong value or invent one, which
§`stage` forbids.

**6. `_markTiming`'s "Typical runtime" table implies a thread the key does not
enforce.** It lists change parsing and element mutation as Main Thread. Nothing
in the API prevents a main-thread-rendering framework from recording
`diffVdomStart` on the main thread, and the guide elsewhere says a framework "may
use Main Thread Rendering". Recommend framing the table as "the runtime that
performs the work", which the prose already says, and dropping the implication
that keys are thread-bound.

**7. Two guide-level gaps worth an explicit sentence each.**
   - *One flush, one pipeline.* `FlushOptions.pipelineOptions` is singular, but a
     framework can hold a retained load pipeline and receive an update pipeline
     for the same batch. The guide never says which wins, and the answer
     (`loadBundle`, because first-screen metrics depend on it) is not obvious.
   - *Flush scope.* `__FlushElementTree(root, options)` has no
     `(options)`-only overload, so a framework that has always called
     `__FlushElementTree()` with no arguments must start naming a root the moment
     it attaches a pipeline. The guide says not to change the flush scope; it
     should acknowledge that the no-argument form makes that impossible and state
     that the page element is the correct substitute.

**8. Minor.** `_generatePipelineOptions()` is documented as returning
`PipelineOptions`, but ReactLynx calls it as `lynx.performance?._generatePipelineOptions?.()`
and null-checks the result — the reference should say it may be absent on older
engines rather than leaving every integrator to discover the guard. And
`CUSTOM_FRAMEWORK_PERFORMANCE_API_OPEN_ISSUES.md` sits at the repository root; it
looks like a working file that should not ship in the merge.

## Follow-ups

- **A `hydrate`-stage pipeline for IFR.** The background thread's first batch in
  an IFR build is genuinely hydration and could carry `stage: 'hydrate'`, the way
  ReactLynx does. It is skipped today because the background side cannot tell an
  IFR build from a non-IFR one on `main` (`vapor` has `isIfrEnabled()`, `main`
  does not), and getting it wrong would cost the `loadBundle` correlation.
- **Earlier `diffVdomStart`.** The mark lands on the first tree mutation of a
  tick, not the first component render, because Vue exposes no public
  "a render is about to run" hook. Component-render time before the first
  mutation is therefore unattributed.
- **Conformance.** CFP-11's suite does not exist yet; `performance.spec.ts`
  covers the twelve scenarios from the guide's testing section that can be
  exercised without a device. Device validation (Android/iOS release builds,
  `PerformanceObserver` + `onPerformanceEvent`) is untested.
