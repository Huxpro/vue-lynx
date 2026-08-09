# Stage 3 · Think in Two Threads

Stages 1–2 got you rendering. Stage 3 is the question that makes Lynx different:
**where does your framework run, and what crosses the boundary?** This is an open
architectural space. We can map the postures that exist, state three laws with
measurements behind them, list the traps with named victims — and then the frontier is
yours.

## 3.1 The postures

The platform's default worldview: **background thread = user space** (your app, your
framework, unbounded work), **main thread = privileged space** (pixels, gestures,
first frame — nothing slow allowed). Within that, every integration picks a posture:

| posture | who runs where | shipped by |
|---|---|---|
| **MT-fused** | everything on the main thread, direct PAPI | miso-lynx today |
| **BG-driven** | framework on BG; MT runs a small op interpreter / command receiver | Vue Lynx, Octane |
| **Dual-slice** | full framework on BG; a stripped one-shot projection of it on MT for the first frame | ReactLynx, Octane's first screen, Vue IFR |

**MT-fused is a trap — and also a strategy.** As a *default* it surrenders the
platform's core promise: every update contends with gestures and layout, and a heavy
runtime boot (miso's GHC output is ~1MB gzip) sits on the first-paint critical path.
But as a *chosen* posture it is defensible: fastest possible time-to-first-pixel for
small, mostly-static surfaces; zero wire complexity; the whole stage-3 problem space
deferred. What matters is choosing it, knowing the ceiling, and keeping a migration
path (miso's renderer-seam design means moving to BG-driven later changes an adapter,
not the framework).

**BG-driven is the workhorse.** Your framework doesn't change; its "DOM" becomes a
mirror + a wire. All the interesting problems move into the wire — see 3.3.

**Dual-slice is the endgame for first paint** — see 3.5.

## 3.2 Law one: across the boundary, equality is by value

Two threads are two JS realms. Two consequences, both with scars attached:

- **Identity means nothing across the wire.** A fresh `['row', selected && 'danger']`
  array or a fresh arrow-function per render is *the same value* to your user and *a
  brand-new object* to an identity-based differ. One shipped framework compared
  transported props by identity: a one-row selection over 10k rows put **~30,000
  commands / 2.4MB** on the wire — against **39 bytes** for the same click in a
  value-compared system. That is a 61,700× tax on a correct-looking default, invisible
  on the web (where a false positive is a nanosecond same-value DOM write), fatal
  across a priced boundary. Compare by value (depth-limited structural equality);
  encode event handlers as stable tokens, never as compared closures.
- **Even `Object.prototype` differs between realms.** A validator that tested
  `getPrototypeOf(x) === Object.prototype` rejected *every* message from the other
  thread on Lynx for Web (the background lives in another realm). Realm-safe
  predicates only — and test in a genuinely two-realm rig (Node `vm` works), because a
  single-realm jsdom suite cannot see this entire bug class.

## 3.3 Law two: wire cost must be proportional to change size

The boundary is your hot path — treat the message format as architecture, not
plumbing:

- **Flat beats clever.** A flat array of opcodes and operands
  (`[SET_CLASS, 1042, "row danger"]`) costs near-nothing to clone and one `switch` to
  interpret. One-object-per-command through structured clone, with per-command
  validation on both sides, measured out to a 5–9× point-update penalty *at identical
  render-model architecture*. Numbers, ids, strings; no nested object trees; validate
  deeply in dev, envelope-only in production.
- **Batch per flush, ack lazily.** One message per commit, not per mutation. If your
  protocol acknowledges commits, don't ship eager per-node handle snapshots in the
  ack; make handle access pull-based.
- **Backpressure is a feature.** If state changes faster than the main thread applies,
  fold pending renders and ship only the latest state — deliberately (a paced,
  latest-version-per-frame contract), not accidentally. One framework's storm
  benchmark *win* turned out to be accidental coalescing behind 2.4MB commits; fixing
  the payload evaporated the win until pacing was made explicit.

## 3.4 Law three: spend the compiler's knowledge on the wire

Whatever your framework compiles — templates, JSX, SFCs — the compiler knows the
static shell and the dynamic holes of every subtree. There is a ladder of how much of
that knowledge you cash in (each rung measured in the Vue Lynx matrix):

1. **ops** — stream per-node commands; the shell is re-described on every instance.
2. **data** — ship the shell once as a serialized template; instances are
   `clone(templateId) + hole values`. (Vue vapor; Octane's `plan` is this shape —
   note: *having* the plan isn't enough, the wire must use it.)
3. **code** — bake the shell into the MT bundle as a compiled `create()` of
   straight-line PAPI calls; the wire carries `(templateId, holeValues)`.
   (ReactLynx snapshots, Vue's element templates.)
4. **native** — the engine itself holds the template (`elementTemplates` section,
   engine-side instantiation). The ceiling; the section exists in the bundle format
   today.

Moving up the ladder shrinks both wire bytes and main-thread work per instance. The
honest caveat from measurement: creation is ultimately PAPI-bound, so rungs mostly pay
off on *wire volume and interpretation overhead* — measure before you climb past rung 2.

## 3.5 First frame: IFR is SSR, on-device

The main thread is idle while your background runtime boots — IFR spends that budget:
render the first frame *on the main thread*, then hand the tree over.

The SSR analogy is exact and the vocabulary transfers: a **one-shot renderer** (your
framework's projection: no effects, no scheduler, frozen state — ReactLynx forks
render-to-string; Octane freezes its hooks; a server-renderer sink works), then
**handover** (adopt the painted tree by walking and re-owning nodes — never replay-
and-compare a recorded stream; divergence should cost the divergent subtree, not the
page), then **event replay** (taps that land during the window are queued and
re-dispatched after adoption — the window where the page is visible but deaf is real).

The costs are also real: if your MT slice is *the whole framework again*, the bundle
doubles (a measured 83→169KB hello world; 40→81KB on a real app) — and bundle bytes
are first-paint latency whenever the bundle isn't cached. A one-shot projection is
nearly free (ReactLynx runs always-on IFR in a 32KB total bundle). And every
millisecond of MT evaluation multiplies by your DAU: unlike SSR, IFR runs on every
device, every cold start.

## 3.6 Main-thread superpowers need framework-level API

Gestures and animations can't wait for a thread hop. Lynx lets marked functions run
*on the main thread* (`'main thread'` directives / worklets): your compiler extracts
them, your build ships them to the MT slice, and events bound to them dispatch with
zero cross-thread latency. All four integrations converged on the same wire shape for
this (`_wkltId` + captured-values object). Design your framework's API for it
deliberately — it is a *different contract* than a background handler (captures are
copied at render time; no setState) — and consider encoding event metadata like
priority into the registration token so dispatch never needs a round trip to decide.

## 3.7 The checklist, and the invitation

Every framework that reached production shape built the same eight pieces. Walk in
with this list and you'll build them on purpose instead of discovering them:

1. **Equality semantics** across the boundary (by value, realm-safe) — law one.
2. **Cross-thread identity** (numeric ids; block-level base+offset if compiled).
3. **Wire encoding** (flat, batched, change-proportional) — law two.
4. **First-frame driver** (one-shot projection, not the framework twice).
5. **Handover** (tree adoption + event replay).
6. **List recycling** (`componentAtIndex` — the platform already built it; wire it).
7. **Event routing** (bind vs catch semantics; token-encoded handlers).
8. **Main-thread function support** (worklet extraction and its API surface).

And then the open space, where we'd love company: can the two threads render
*in parallel* instead of in relay? What's the right scheduling contract between state
production and frame application — pacing, priorities, interruption? Can bundles cache
compiled templates across launches? How far can engine-side templates (rung 4) go?
None of these have settled answers.

One more thing. Nothing in this stage is Lynx-specific except the names. The browser
has had Web Workers for fifteen years and `OffscreenCanvas`-era appetite for getting
work off the UI thread; a framework that learns to live on Lynx — value-semantic
boundaries, change-proportional wires, one-shot first frames, adopted handovers — has
learned to be a *multi-threaded UI framework*, and that design travels. We think that's
the most interesting reason to do this work.

---

*Comparative data behind this series: the unified benchmark matrix in
`huxpro/vue-lynx` (`packages/benchmark`, eleven Vue variants + ReactLynx + Octane on
one harness), and the Octane-on-Lynx research report (PR #356 of that repo) with
captured wire payloads, stage-level timings, and both compilers' real output.*
