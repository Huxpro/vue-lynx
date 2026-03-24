# How I Vibed Vue Native in 2 Weeks

Two weeks ago, Vue Lynx didn't exist. Today, you can `pnpm create rspeedy` a Vue 3 app and run it natively on iOS and Android — with Composition API, Vue Router, Pinia, and all. Here's how that happened.

## What even is Lynx?

If you missed the news: ByteDance open-sourced [Lynx](https://lynxjs.org) in March — the native UI framework that powers TikTok, Lark, and dozens of apps serving hundreds of millions of users. Think of it as an alternative to React Native or Flutter, but with a dual-thread architecture that keeps your UI thread buttery smooth by running your framework logic on a separate background thread.

Lynx shipped with first-party React support (ReactLynx). But I'm a Vue person. And I thought: Vue 3's `createRenderer()` API was literally designed for this. How hard could it be?

## The 500-line bet

Turns out, not that hard.

Vue 3's custom renderer API is one of its most underappreciated features. You give it a handful of node operations — `createElement`, `insert`, `remove`, `patchProp` — and Vue does the rest. Reactivity, diffing, component lifecycle, slots, fragments — all handled by `@vue/runtime-core`.

The core adapter between Vue and Lynx is roughly 500 lines of TypeScript. That's it. Five hundred lines to unlock the entire Vue ecosystem for native development.

What those 500 lines do is build a `ShadowElement` tree on the background thread — a lightweight mirror of the native element tree — and serialize every mutation into a flat ops buffer that gets shipped to the main thread for native rendering. Fourteen operation codes. One JSON array. No bridge overhead.

```
Background Thread          Main Thread
┌──────────────────┐      ┌──────────────────┐
│  Vue 3 Runtime   │      │   Lynx PAPI      │
│  + Your App Code │─ops─▶│   + Native UI    │
│  + ShadowElement │◀─ev──│   + Layout Engine │
└──────────────────┘      └──────────────────┘
```

## "Vibe coding" is real (when the foundation is right)

I'll be upfront: I leaned heavily on AI tooling throughout this project. Claude was my pair programmer for most of the two weeks. But here's the thing people get wrong about vibe coding — it's not about generating code you don't understand. It's about compressing the iteration cycle.

I knew what the architecture needed to be. I'd studied Lynx's internals, understood the dual-thread model, knew exactly which Vue APIs I needed to implement. The AI helped me move fast on the mechanical parts — wiring up webpack loaders, writing SWC transforms, scaffolding test harnesses — so I could focus on the design decisions that actually matter.

The worklet transform pipeline is a good example. Lynx's Main Thread Script lets you mark functions with a `'main thread'` directive to run them directly on the native thread — critical for smooth animations and gestures. Getting the SWC transform right to extract these functions, capture their closures, and register them on the correct thread? That's fiddly. Having an AI that can iterate on AST transforms while I focus on the threading semantics saved me days.

Could I have done it without AI? Sure. Would it have taken two weeks? Absolutely not.

## What works today

Vue Lynx is pre-alpha, but it's more capable than you might expect:

**The full Composition API** — `ref`, `reactive`, `computed`, `watch`, `provide`/`inject`, `<script setup>` — it all works. Your Vue muscle memory transfers directly.

**Vue Router and Pinia** — Navigation and state management, working out of the box. The HackerNews example runs with full routing, lazy loading, and shared state.

**CSS class selectors** — Write `<style>` blocks in your SFCs. Classes get extracted and applied natively. Tailwind CSS works too.

**Main Thread Script** — Mark functions with `'main thread'` for zero-latency animations and gesture handling. This is something the web can't do.

**19 example apps** — From hello-world to a full TodoMVC, a HackerNews client, a TikTok Shop prototype, and the complete 7GUIs benchmark suite.

We also run Vue's own upstream test suite against our custom renderer to verify compatibility. When Vue's own tests pass on your renderer, you know you're doing something right.

## What's different from Vue on the web

If you know Vue 3, you know Vue Lynx. But there are a few native-isms:

- **Element names**: `<view>` instead of `<div>`, `<text>` instead of `<span>`, `<image>` instead of `<img>`
- **Events**: `@tap` instead of `@click`, `@longpress`, `@confirm`
- **Layout**: Flexbox by default, no block/inline flow
- **No DOM APIs**: No `document.querySelector`, no `window` — you're not in a browser

That's about it. Your components, composables, stores, and routes look identical to web Vue.

## Why this matters for the Lynx community

Lynx is an incredible piece of technology with a massive production track record. But framework choice is deeply personal. Millions of developers worldwide build with Vue — it's the most-starred JS framework on GitHub for a reason. Until now, those developers couldn't bring their skills to Lynx.

Vue Lynx changes that. It's not a wrapper or a compatibility layer. It's a first-class renderer that speaks Lynx natively, built on Vue's official Custom Renderer API. You get Vue's developer experience — the reactivity, the SFC authoring, the DevTools, the ecosystem — with Lynx's native performance.

## Try it

Vue Lynx is open source under Apache 2.0.

- **Docs**: [vue.lynxjs.org](https://vue.lynxjs.org)
- **GitHub**: [github.com/anthropics/vue-lynx](https://github.com/anthropics/vue-lynx)
- **Quick start**: Follow the [Getting Started guide](https://vue.lynxjs.org/guide/quick-start.html) to have a native Vue app running in minutes

It's pre-alpha. There are rough edges. But the foundation is solid, the architecture is right, and I'd love for the Vue and Lynx communities to build on it together.

If you've ever wished you could write native apps with Vue — now you can. Let's go.
