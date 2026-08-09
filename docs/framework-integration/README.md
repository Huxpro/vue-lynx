# Bringing Your Framework to Lynx — a guide series

> Draft series for lynxjs.org. Written from the accumulated experience of five real
> integrations: **ReactLynx** (the official framework), **Vue Lynx** (vdom and vapor,
> eleven measured architecture variants), **Octane** (a compiled React-model framework),
> and **miso-lynx** (a Haskell/Elm-architecture framework). Every claim in this series
> traces to shipped code or a same-host measurement; case-study boxes name the source.

Lynx renders your UI with two JavaScript threads: a **main thread** that owns the
pixels, and a **background thread** that owns your app. That one design decision is why
Lynx apps stay responsive under load — and it is also the single fact that makes
integrating a UI framework onto Lynx different from porting it to another browser.

The good news: the integration surface is layered, and you can stop at any layer with
something real. The series is organized as three stages:

| Stage | Question you're answering | You're done when |
|---|---|---|
| [1 · Build a Bundle](./01-build-a-bundle.md) | How do my sources become a `.lynx.bundle` the engine loads? | Your hello world renders in Lynx Explorer |
| [2 · Drive the UI](./02-drive-the-ui.md) | How does my framework's DOM layer speak Element PAPI? | Your components render, update, and handle events |
| [3 · Think in Two Threads](./03-think-in-two-threads.md) | Where does my framework *run*, and what crosses the wire? | You've chosen a threading posture on purpose — and measured it |

Stages 1 and 2 are largely mechanical — a few days each with the right map. Stage 3 is
an open architectural space. We know some of its laws (this series states three of them,
with measurements), several of its traps (we fell into them so you don't have to), and
we genuinely do not know its ceiling. That's the invitation: the second half of stage 3
is yours to explore — and what you learn there transfers back to the web, because
browsers have had idle worker threads waiting for multi-threaded UI frameworks for a
decade.

## The cast, for reference throughout

- **ReactLynx** (`lynx-family/lynx-stack`) — compiled JSX "snapshots", dual-slice
  bundles, always-on IFR, tree-adoption handover. The most complete answer today.
- **Vue Lynx** (`huxpro/vue-lynx`) — Vue 3 custom renderer on the background thread,
  flat numeric op stream, a measured matrix of eleven template/threading variants.
- **Octane** (`octanejs/octane` `packages/lynx`) — React's programming model, compiled;
  a protocol-first transport whose early guard-policy mistakes (and their fixes) are the
  best documented cautionary tale in this series.
- **miso-lynx** (`haskell-miso/miso-lynx`) — Haskell + Elm architecture, currently
  running *entirely on the main thread* through a 105-line adapter: proof of how small
  stage 1+2 can be, and a live case study of the fused threading posture.
