# Analysis: ReactLynx `renderToOpcodes` — what it implies for Vue Lynx

**Date**: 2026-07-31
**Status**: Analysis (no code change)
**Source read**: `lynx-family/lynx-stack@main`
`packages/react/runtime/src/snapshot/renderToOpcodes/{index,opcodes,hydrate}.ts`,
`packages/react/runtime/src/snapshot/lifecycle/render.ts`

---

## 1. What `renderToOpcodes` actually is

It is a **fork of `preact-render-to-string@6.0.3`** (the header says so) whose
sink is not a string buffer. Three facts matter, and all three are easy to get
wrong from the name:

1. **Its primary output is a tree, not opcodes.** `renderToString(vnode,
   context, into)` walks the JSX once and calls `into.insertBefore(...)` /
   `instance.setAttribute(...)` on `SnapshotInstance`s — i.e. it *is* the
   main-thread first-frame renderer. `snapshot/lifecycle/render.ts`
   (`renderMainThread`) calls it with `__root` and throws the return value
   away unless `__ENABLE_SSR__`.
2. **The opcode array is a build-flag-gated second output.** Every
   `opcodes.push(...)` sits inside `if (__ENABLE_SSR__)`. In an IFR-only build
   the whole opcode machinery is dead code. One renderer, two deployments:
   **IFR** (in-process, output = the MT store tree) and **SSR** (out-of-process,
   output = a portable array).
3. **It is a degenerate mode of the framework, not the framework.** No diff, no
   commit, no scheduler, no effects (`options[SKIP_EFFECTS] = true`),
   `setState`/`forceUpdate` replaced by `markAsDirty` (updates silently dropped,
   with a ≤25-iteration settle loop for memoized hooks), no unmount bookkeeping,
   and `vnode[CHILDREN] = undefined` right after a subtree completes to release
   memory. Elements are the vnodes: `if (vnode.__parent) vnode = new
   SnapshotInstance(type)` — otherwise the JSX vnode object *becomes* the
   instance, so there is no parallel per-node allocation.

The opcode encoding itself (`opcodes.ts`) is four codes on a stack machine:

```
Begin [type, __id, elements[]] slotIndex   End   Attr key value   Text [[type,__id,elements],text] slotIndex
```

Note what is **not** in it: no parent id, no anchor, no per-node element id, no
structure. Parenthood is implicit in Begin/End nesting; position is
`slotIndex`; the static skeleton is not encoded at all because it already lives
in the bundle as the Snapshot `create()`. On the receiving side
`ssrHydrateByOpcodes(opcodes, into, refMap)` rebuilds the instance tree and
binds each instance to an **already-existing** element looked up by
`refMap[ssrID]`. Element identity is *transplanted through an external map*,
never assumed.

## 2. Where it lands in our matrix — and the column we are missing

`packages/vue-lynx/internal/src/matrix.ts` has six columns (Staging, Naming,
Addressing, Provider, Lifetime, Delivery). All six describe **how the residual
of `λ holes. tree` materializes**. `renderToOpcodes` is orthogonal to every one
of them: Snapshot `create()` is the residual mechanism (already placed in
`GRAPH-ENG-REPORT.md` §1.4 as Code-Template ≡ our VDOM JS ET);
`renderToOpcodes` is *the driver that calls it*.

That is the missing column:

| **Driver** | who executes the first-frame render, in what shape |
|---|---|
| `bts-runtime` | BG full runtime, ops cross the wire (our non-IFR default) |
| `mts-runtime` | MT runs the **complete** framework (our IFR today) |
| `mts-oneshot` | MT runs a stripped one-pass renderer (**RL's cell**) |
| `server` / `build` | render happens off-device, output is a portable array |

And a second one, which is the real subject of the code above:

| **Handover** | how the two renders are reconciled |
|---|---|
| `replay-compare` | stream equality on a recorded op stream (ours) |
| `tree-adopt` | element refs transplanted by tree walk + id swap map (RL) |

Our whole `+b` / `+b!` / `+b:c` / `+b:e` ladder varies the *Staging/Delivery*
columns. `+ifr:c` varies Staging of the ephemeral copy — and the b2 sweep's
verdict was **a wash** (`matrix.ts:316-329`: "create is PAPI-bound, not
interpretation-bound"). That result is the reason this analysis matters: if the
JS staging ladder cannot move first paint, the remaining levers are in the two
columns above — *who renders* and *how much work is thrown away*.

## 3. Six implications, ordered by leverage

### I1 — Reconcile at the tree level, not the stream level (enabler for everything else)

`main-thread/src/ifr.ts:241-353` walks `recordedOps` and the incoming BG batch
**frame by frame in order**, and any deviation calls `fallbackToBackground()` —
teardown plus replay of the whole buffered BG history. Stream equality is a
strictly stronger requirement than tree equality: it is sensitive to op *order*
and to flush granularity, not just to the resulting tree. A different prop
iteration order, a differently interleaved child flush, a style emitted before a
class — all produce the same tree and still cost a full rebuild.

RL's `hydrate(before, after)` (`renderToOpcodes/hydrate.ts:223`) compares
*trees*: transfer `__elements`, diff `__values` pairwise, then per slot either a
pairwise-same fast path or `diffArrayLepus` + `diffArrayAction` that degrades to
local `__InsertElementBefore` / `__RemoveElement`. Divergence costs a subtree
patch, never a page rebuild. Vue's own DOM SSR hydration has the same shape
(per-node adopt, per-subtree bail-out to client render) — our stream compare is
weaker than what Vue does for itself.

Two levels of fix, both scoped:

- **Cheap half (days).** Split frames into *structural* (`CREATE`,
  `CREATE_TEXT`, `INSERT`, `REMOVE`, `CLONE_TREE`, `INSTANTIATE_*`) and *value*
  (`SET_*`) classes. Structure must still match in order; value ops match by
  `(id, key)` in any order within a batch window. This kills the entire class of
  ordering-only teardowns at no protocol cost.
- **Real fix.** At `sealIfrRender()` fold `recordedOps` into a canonical tree
  (`parentId → ordered children`, plus a per-node value map) and reconcile BG
  batches against *that*. Mismatch is then localizable: remove the diverging
  subtree's elements and apply the BG ops for that subtree only, leaving the
  rest of the first frame painted.

Note the honest trade in the other direction: our byte-identical-JSON fast path
is *cheaper* than RL's tree walk in the happy case, and our BG stays completely
IFR-unaware (RL pays with a BG-side `hydrate` and a swap map). Tree-level
reconciliation gives some of that up.

**Why this is first**: every following item increases the risk that the two
renders differ. Hydration robustness is the precondition, not the payoff.

### I2 — The MT driver does not have to be the whole framework

Our IFR ships the Vue runtime + user app into the MT bundle: hello-world went
**83 kB → 169 kB** (`plans/0711-1-ifr-instant-first-frame.md` §Verification).
That is IFR's headline liability, and RL simply does not pay it: a one-pass
recursive renderer plus the Snapshot `create()`s that were in the bundle anyway.

The two render models are *not* symmetric here, and that asymmetry should drive
the roadmap:

- **Vapor is nearly free.** The compiled Vapor render function already *is* a
  one-pass creator; what has to be neutered is `renderEffect` → immediate
  one-shot call (exactly #290's prototype, referenced in
  `docs/plans/graph-eng-goal.md` §2). The MT bundle then needs compiled
  templates + a create/setText/insert shim — no reactivity, no scheduler, no
  patch, no unmount, no Transition/KeepAlive. This is the `mts-oneshot × vapor`
  cell and it is the cheapest real win on the board.
- **VDOM needs a second renderer.** But we should **not** fork runtime-core the
  way RL forked preact-render-to-string (see §4). Vue already ships the
  degenerate mode as a maintained package: `@vue/server-renderer` is one-pass,
  effect-free, and its compiled `ssrRender(ctx, push)` functions take a *sink*.
  Swapping the string sink for an ops/PAPI sink is the same move RL made, minus
  the fork. Bonus: `compiler-ssr`'s static-string hoisting is structurally the
  same idea as Code-Template — hoisted static markup ≡ the residual, `push`ed
  interpolations ≡ the holes.

Measurable as a new factor row: `ifrDriver: 'runtime' | 'oneshot'`, reported
against MT bundle size (already tracked per flag) and FCP.

### I3 — Ephemeral paint should not allocate a durable tree

During the IFR window the MT builds a full `ShadowElement` tree that hydration
throws away. RL avoids the parallel allocation entirely (the vnode *is* the
instance) and releases children as soon as a subtree completes. Our ephemeral
copy needs elements, not a patchable shadow tree — nothing will ever be patched
through it, because `finishHydration()` hands ownership to BG.

Given `+ifr:c`'s "a wash" result, this is the largest remaining MT-side lever
that is *not* PAPI-bound: it is allocation- and property-write-bound, which is
exactly the part of the frame the staging ladder could not touch. We already
track ShadowElement allocation count as a metric, so the factor is measurable
today.

### I4 — Rollback should be component-scoped, not page-scoped

`runIfrRender()` (`ifr.ts:196-217`) catches at the top level and tears down the
*entire* first frame; RL's `renderMainThread` does the same at its outer
boundary — but `_renderToString` additionally records a watermark
(`opcodes.length`, `into.__lastChild`) **before each component's child
recursion** and, on a thrown promise (Suspense), rolls back exactly that
subtree, re-renders the fallback, and keeps painting everything else
(`renderToOpcodes/index.ts:272-320`).

Same watermark applies to us: record `(recordedOps.length, lastChildOfParent)`
at component boundaries so one throwing component degrades to "that subtree
unpainted" instead of "blank first frame". This is also the principled answer to
`defineAsyncComponent` / `<Suspense>`, which `recordAndApply` currently handles
by *dropping* post-seal ops (`ifr.ts:145-165`) — RL instead has defined
semantics: the fallback is what the first frame paints.

### I4b — Settle semantics must match, or frames diverge

RL tolerates state writes during render by re-rendering up to 25 times
(`index.ts:250-258`), silently dropping the updates. We document "don't do this"
and drop post-seal ops. Either policy is fine — but the MT driver and the BG
runtime must implement the *same* one, and the smaller we make the MT driver
(I2) the more room there is for semantic drift. Another reason I1 comes first.

### I5 — The opcode shape is the precondition for SSR / prerender

Our recording is the **op stream**: id-bearing, PAPI-level, position-dependent.
It can only be replayed in a realm whose id counter is in the same state — which
is why our design note says id alignment comes "for free from determinism"
(`plans/0711-1-ifr-instant-first-frame.md` §Design 2). It follows that our
recording can never be produced on a server, at build time, or in a second
process. RL's opcodes are id-free, stack-encoded, and hole-only; identity is
supplied at hydration time via `refMap[ssrID]`. That single design choice is
what makes the *same renderer* serve SSR.

If we want SSR (explicitly listed as not-ported), or `firstScreenSyncTiming:
'jsReady'`-style re-render before handover, or tolerance for legitimately
non-deterministic renders (A/B flags, `Date`, `Math.random`), we need an
**id-remap layer** — RL's `options.swap` (`hydrate.ts:231-234`) is exactly that.

And here is the reverse-inspiration payoff for our own Naming axis: with
**block naming** (`base + indexInAddressed`) a swap table is per-*template
instance*, not per-node — O(instances) instead of O(nodes). `GRAPH-ENG-REPORT.md`
§6 currently says "sparse naming is not an FCP feature; its wins are JS
memory/table constants and enablement". Add a third win, defensible and new:
**block naming is what makes id transplant — and therefore SSR-shaped
hydration — cheap.**

### I6 — Two levels of residual compose → the build-time first frame

RL keeps two staged artifacts and composes them: the *template* residual
(Snapshot `create()`, bundle-delivered) and the *page-instance* linearization
(opcodes: types + slotIndex + dynamic values only). Our IFR recording does not
compose that way — `recordedOps` records everything, including registration and
per-node structure, even in the `+b!` / `+b:c` cells where the structure is
already in the MT bundle.

Reduce the recording to `(instantiations, hole values)` and a new cell opens up:
for a first screen whose initial data is known at build time (shells, skeletons,
static headers), the opcode array can be **baked into the bundle** and replayed
with zero JS render on the MT — no module evaluation of the user graph, no
component setup, no reactivity init. That is prerendering, and it is the one
cell that attacks the part of FCP the staging ladder provably cannot:
Driver = `build`, Lifetime = ephemeral.

## 4. What not to copy

- **Not the fork.** `renderToOpcodes` pins `preact-render-to-string@6.0.3` and
  reaches into Preact internals through mangled-name constants (`__c`, `__s`,
  `DIRTY`, `NEXT_STATE`, …). It is a permanent maintenance tax. runtime-core is
  larger than Preact; for VDOM use `@vue/server-renderer`'s sink, for Vapor use
  the compiled output directly. Zero forks.
- **Not the opcode format.** It is Snapshot-shaped (SnapshotInstance types +
  slotIndex + `ssrID` refs). Adopt the *properties* — stack-encoded, id-free,
  holes-only, structure-in-bundle — not the encoding.
- **Not BG-side hydration wholesale.** Our BG being IFR-unaware is a genuine
  architectural asset (zero protocol surface, one hydration site). I1 can be
  done entirely on the MT side; only I5 (SSR / id transplant) forces a BG-side
  contract.

## 5. The one structural decision underneath all of it

I1, I2 and I3 are not three independent changes. They are three faces of one
decision:

> **The MT first frame's artifact becomes a *tree*, not an *op-stream
> recording*.**

Today `ifr.ts` stores `recordedOps` + `backgroundHistory`. Instead, store a
**paint tree** — `id → { tag, parent, childOrder, values }` — built inside the
same `recordAndApply` hook, at roughly the cost of the `push` it replaces.
Hydration then becomes an **adopting ops interpreter**: the BG's first batches
run through `applyOps` in an adopt mode rather than being compared to a
recording.

- `CREATE(bgId, type)` — do not allocate; hold pending.
- `INSERT(parent, child, anchor)` — under the paint node corresponding to
  `parent`, find the next unclaimed child with the same tag. Hit ⇒
  `elements.set(bgId, paintElement)` (this map *is* RL's `swap` table, built on
  our side of the boundary). Miss ⇒ really create and really insert.
- `SET_*` — apply to the adopted element; skip when the value already matches.
- End of the first stream — delete paint elements nobody claimed.

This is precisely how Vue's own DOM SSR hydration walks siblings, and it is what
RL buys with `hydrate()` + `options.swap`.

Three consequences, and they are the point rather than side effects:

1. **Determinism drops from a correctness requirement to a performance
   optimization.** The constraint in `website/docs/guide/ifr.mdx` ("first-screen
   render must be deterministic; divergence ⇒ full BG re-render") can be
   deleted. Divergence costs the diverging nodes, nothing more.
2. **`ifr.ts` gets smaller.** `recordedOps`, `backgroundHistory`,
   `fallbackToBackground`, `teardownIfrTree`, `VALUE_OP`/`sameValue`/arity
   walking — roughly 150 lines of machinery — are replaced by per-node adoption.
3. **The same artifact is the SSR/prerender payload.** A paint tree serialized
   without ids, stack-encoded, *is* RL's opcode array. I5 and I6 stop being
   separate projects and become a serializer over a structure we already hold.

## 6. What changes per existing mode

| Mode | Change |
|---|---|
| every non-IFR cell (`vdom`, `vdom +b`, `vapor`, `vapor +b`, `+b!`, `+b:c`) | **none** — protocol, ops and staging untouched |
| every `+ifr` cell | implementation changes (handover stream → tree); coordinate gains two labels (`driver=mts-runtime`, `handover=tree`). Cell identity unchanged. |
| `+ifr:c` / `+ifr:e` (paint staging) | **orthogonal, kept** — paint still materializes through code/native, output still lands in the paint tree. But `+ifr:c` is already a wash; after D1 its only remaining value is as the descriptor source for the native rung, so it is a retirement candidate. |
| `ifr.ts` frame walking | deleted (value comparison descends to per-node) |

## 7. What gets added

Two columns in `internal/src/matrix.ts`:

- `driver: 'bts' | 'mts-runtime' | 'mts-oneshot' | 'build'`
- `handover: 'none' | 'stream' | 'tree'`

Two flags, read through the existing one-decision-point accessors in
`runtime/src/flags.ts` / `main-thread/src/flags.ts` so they constant-fold and
stay deletable:

- `ifrHandover: 'stream' | 'tree'` → `__VUE_LYNX_IFR_HANDOVER__`
- `ifrDriver: 'runtime' | 'oneshot' | 'prerender'` → `__VUE_LYNX_IFR_DRIVER__`

Four new cells (report notation: `:h` = tree handover, `:1` = one-shot driver,
`:p` = prerender; `:c` / `:e` keep meaning paint staging):

1. `vapor-data-block-ifr-tree` — `vapor +b +ifr:h`
2. `vapor-data-block-ifr-oneshot` — `vapor +b +ifr:h:1`
3. `vdom-code-block-ifr-oneshot` — `vdom +b +ifr:h:1`
4. `vapor-data-block-ifr-prerender` — `vapor +b +ifr:p` (Driver = `build`,
   Lifetime = ephemeral)

## 8. Rollout

**D0 (optional insurance).** Structural/value frame split on the existing
stream handover. Only worth doing if D1 slips; D1 deletes it.

**D1 — paint tree + adopting hydration.** Behind `ifrHandover`, default
`stream`. Acceptance: the 8 `ifr.test.ts` cases green; new deliberately
non-deterministic cases (shuffled `v-for`, `Math.random()` class) prove only the
diverging nodes are rebuilt; `test:dom` green; happy-path FCP no worse than
stream. That last one is the only real regression risk — per-node adoption
replaces a byte-equality fast path — which is exactly why it ships as a flag and
both paths get benched before the default flips.

**D2 — Vapor one-shot driver.** Alias `@vue/runtime-vapor` → a new
`vue-lynx/vapor-oneshot` on the MT layer only (the `issuerLayer` routing already
exists), implementing the same helper ABI without reactivity: `renderEffect(fn)`
→ `fn()`, `createIf`/`createFor` evaluated once, `createComponent` = setup +
render directly, no scheduler, no unmount, no keyed diff. Phase 1 keeps real
`@vue/reactivity` (setup bodies use `ref`/`computed`) and strips only
runtime-core/dom/vapor; phase 2 may swap in an SSR-semantics reactivity shim
(watchers not run — Vue's established server behavior). Depends on D1: a
one-shot driver does not emit a frame-comparable op stream. Acceptance: MT
bundle size (the flag-size report already tracks this) + FCP as an `ifrDriver`
factor row; IFR suite green under the new driver.

**D3 — no ShadowElement during ephemeral paint.** Falls out of D2 (the one-shot
driver writes the paint tree and PAPI directly). Reported separately as
allocation count.

**D4 — component-scoped rollback watermarks**, plus defined Suspense /
`defineAsyncComponent` first-frame semantics.

**D5 — VDOM one-shot** via a `@vue/server-renderer` sink writing the paint tree.

**D6 — id-free stack serialization of the paint tree** → the `build` driver cell
(prerendered first frame). Real SSR comes after, and only it forces a BG-side
contract.

Non-goals: no BG changes before D6 (adoption is entirely MT-side, the BG stays
IFR-unaware); no runtime-core fork; no attempt to template the update path.
