# How I Vibed Vue Lynx in Two Weeks

Vue developers have wanted native for years. The ["Vue + Lynx = Vue Native"](https://x.com/danielkelly_io/status/1899746975588737407) tweet pulled 1.7k likes. The [Vue integration issue](https://github.com/lynx-family/lynx/issues/193) on our repo hit 1,600 upvotes -- our biggest feature request ever. The demand was clear; the question was bandwidth.

When [Lynx](https://lynxjs.org) open-sourced a year ago, [Evan You](https://x.com/youyuxi/status/1898663514581168173) and [Rich Harris](https://x.com/Huxpro/status/1927276405328429259) both shouted it out, but production-quality framework integration has always demanded serious engineering bandwidth. Then projects like [Vercel's web streams rewrite](https://vercel.com/blog/we-ralph-wiggumed-webstreams-to-make-them-10x-faster) and [Cloudflare's ViNext](https://blog.cloudflare.com/vinext/) showed how solo engineers, armed with AI, can ship what used to take a team. That changed the math for me.

Vue already has the foundation: a mature Custom Renderer API. I spent a weekend on it. One ~$1,400, 37-hour hackathon. It started with a design exploration: "Can Vue's Custom Renderer even work with dual-thread code splitting, and how?" By 3am Sunday I was debugging "Tap to increment doesn't work" with Claude. By Monday morning, I had a working [TodoMVC](https://vue.lynxjs.org/guide/todomvc) ([tweet](https://x.com/Huxpro/status/2028672358912086524)). I couldn't resist dropping a subtle subtweet, and it immediately took off on X.

[Embedded X]

---

## Introducing Vue Lynx

The next two weeks of evenings and weekends went into making it real: 160+ commits across ~180 sessions.

```
▎ Week 1   ████████████░░░░░░░░  Runtime + Toolchain
▎ Week 2   ░░░░░░░░████████████  Docs + Examples + i18n
```

I could have shipped after week one. But if you know me, you know my principle:

>*When things actually work, you let the demos do the talking.*

Check [vue.lynxjs.org](https://vue.lynxjs.org) for 20+ example apps running natively **and on the web** -- you can try them without leaving your browser.

We cover the full Composition API, [`<Transition>`](https://vue.lynxjs.org/guide/vue-compatibility), [`<Suspense>`](https://vue.lynxjs.org/guide/vue-compatibility), and ecosystem integrations including [Vue Router](https://vue.lynxjs.org/guide/routing), [Pinia](https://vue.lynxjs.org/guide/pinia), [Tailwind CSS](https://vue.lynxjs.org/guide/tailwindcss), and [TanStack Query](https://vue.lynxjs.org/guide/data-fetching). We also ported Lynx's official tutorial ([Waterfall Gallery](https://vue.lynxjs.org/guide/tutorial-gallery) and [Swiper](https://vue.lynxjs.org/guide/tutorial-swiper)) to showcase native components and [Main Thread Script](https://vue.lynxjs.org/guide/main-thread-script) for zero-latency gestures. A [HackerNews clone](https://vue.lynxjs.org/guide/hackernews) brings them all together.


[Embedded X]

### Try It Today

  ```
  npm create vue-lynx@latest
  ```

It's [open source](https://github.com/huxpro/vue-lynx), of course. I know you will star it, but don't hesitate to star [Lynx](https://github.com/lynx-family/lynx) and [Lynx Stack](https://github.com/lynx-family/lynx-stack) as well.

I'd love for the Vue and Lynx communities to build on it together. Issues, PRs, and feedback are all welcome.

---

## Engineering

> no human has been asked to write code for this project

### Setting Up the Architecture for AI

There were two prior community efforts. The second, from the Vue Vine maintainer, went impressively far, even getting Main Thread Script running. But both projects ran Vue on the main thread like the Web. This would work on Lynx, but it's not taking advantage of the [dual-thread architecture](https://lynxjs.org/blog/lynx-unlock-native-for-more#use-the-main-thread-responsibly-for-interactivity) Lynx is known for: offloading the heavy framework re-rendering to the background and keeping the native UI thread non-blocking, only tapped when needed (with Main Thread Scripts).

This was the core architectural assumption I validated on Day 1. In Vue Lynx, the entire Vue runtime runs on the Background Thread. A lightweight `ShadowElement` linked-list tree mirrors the DOM element tree in memory for the Custom Renderer to operate on, and every DOM mutation gets serialized into a flat ops buffer shipped to the Main Thread in one batch per tick:

```
┌──────────────────────────────────────────────────────┐
│                  Background Thread                   │
│  Vue 3 runtime · reactivity · lifecycle · your code  │
└──────────────┬──────────────────────▲────────────────┘
          ops  │                      │  events
               ▼                      │
┌──────────────────────────────────────┴───────────────┐
│                    Main Thread                       │
│  Native elements · layout · rendering · MTS handlers │
└──────────────────────────────────────────────────────┘
```

To keep the agent aligned with this dual-threaded architecture and not drift towards the single-threaded Web model it defaults to, I embedded all [critical plans directly in the source tree](https://github.com/Huxpro/vue-lynx/tree/main/plans) : design discussion notes, decision logs, and post-implementation learning as *cross-session context*. Each new session picks up where the last left off, inheriting our architectural constraints and reasoning that shaped the code.

### ["Harness"](https://openai.com/index/harness-engineering/) Engineering

> Gotta use the hottest word after AI, Vibe and "Agentic"
#### Bridging the Vue Upstream Tests Infra

The most critical investment in any AI-driven development is feedback. Ideally, to ensure conformance with official Vue, we'd reuse Vue's upstream test suite directly. But Vue's test suite assumes a single-thread DOM. How do you run it to test a dual-thread renderer?

Fortunately, Lynx already has the infra for [dual-threaded testing environments](https://lynxjs.org/next/api/lynx-testing-environment/index.html#lynx-jstesting-environment). So we can rewire the suite to run through our **dual-thread pipeline**: BG `ShadowElement` -> ops buffer -> `syncFlush()` -> MT `applyOps` -> PAPI -> jsdom, then let the agent **grind** until no remaining failures were fixable (effectively [Ralph Loop](https://ghuntley.com/loop/)). The result: 852 passed out of 949 upstream tests. Every failure is accounted for in a [skiplist](https://github.com/Huxpro/vue-lynx/blob/main/packages/upstream-tests/skiplist.json)  with documented reasons, and all turned out to be negligible. See the [full report and skip analysis](https://github.com/Huxpro/vue-lynx/blob/main/packages/upstream-tests/README.md).

We also added our own tests for Lynx-specific surface area such as `<list>` elements, `bindtap` events, Main Thread Scripting APIs. With the pipeline proven, I pushed further and forked the [7GUIs benchmark](https://eugenkiss.github.io/7guis/) from the official Vue docs as [a stress test](https://vue.lynxjs.org/guide/7guis).


```
                BG Thread  ┃  Main Thread
                           ┃
Vue → ShadowElement → Ops  ┃  PAPI → Lynx Engine → UI
                           ┃
├─ vue runtime-core ─┤     ┃
├─── vue runtime-dom ──────╂──┤
        ├── E2E Pipeline ──╂─────────────┤
                           ┃         ├── Agentic ───┤
```

#### Agentic E2E Verification Loop

But those classic machinery tests can't catch real UI bugs that used to require human evaluation: a misaligned CSS layout, an interaction broken on a real device. For advanced Vue features like `<Transition>`, `<Suspense>`, you need to see them run and interact to verify the behavior.

With the right harnessing, writing examples isn't just demoing -- they double as workloads that the agent can evaluate automatically. I wired up two execution environments: iOS simulator via Lynx DevTool CLI/MCP/Skill, and agent-controlled browser via Lynx for Web. The loop is simple: run an example in both, observe and verify the output, and any regression triggers a fix. No human in the loop.

```
┌──── Fix ◀─────────────────────────────────┐
│                                           │
▼                                           │
Example ──┬──▶ iOS Simulator ───┬──▶ Evaluate
          │    (DevTool MCP)    │
          │                     │
          └──▶ Lynx for Web ────┘
               (agent-browser)
```

I started with Vue core features, where correctness is well-defined: the agent reads the official docs, writes an example, and checks whether the output conforms. Then I expanded scope to ecosystem integrations: Vue Router, Pinia, TanStack Query, Tailwind CSS.

For the final exams, I tried a different approach: one I'd later learn has a name: **differential evaluation**: I let the agent port existing applications and verify the output against the originals. The first used the canonical Vue HackerNews implementation as ground truth, running both the Web version and the vue-lynx port with Lynx for Web side-by-side in the browser; the second used existing ReactLynx demos as reference, porting them to vue-lynx and verifying parity on the iOS Simulator via Lynx DevTool MCP. The harness doesn't need to know what "correct" looks like in the abstract. It just needs the two outputs to agree.

```
| Ground Truth          | Candidate       | Environment              |
|-----------------------|-----------------|--------------------------|
| Vue HackerNews (Web)  | vue-lynx port   | Lynx Web (browser)       |
| ReactLynx demos       | vue-lynx port   | Lynx Native (Simulator)  |


                    ┌─────────────────────────────┐
       ┌────────────▶  ground truth ──▶       A   │
       │            │                         │   │
Input ─┤            │                      Compare ──▶  Divergence
       │            │                         │   │         │
       └────────────▶  Lynx (candidate)  ──▶  B   │         ▼
                    └─────────────────────────────┘      Fix Loop
```


#### The Bill

```
┌──────────────────────────────────────────┐
│ The Bill (at Opus rate)                  │
├──────────────────────────────┬───────────┤
│ Input (3.8M tokens)          │ $      57 │
│ Output (6.8M tokens)         │ $     510 │
│ Cache Write (117.9M tokens)  │ $   2,211 │
│ Cache Read (2.5B tokens)     │ $   3,769 │
├──────────────────────────────┼───────────┤
│ TOTAL                        │ $   6,547 │
└──────────────────────────────┴───────────┘
```

The numbers tell a story. Output tokens -- the code and text Claude actually *wrote* -- account for just 8% of the cost. The other 92% is comprehension: re-reading the codebase, ingesting tool outputs, re-processing conversation history across 31,700 API turns. Every turn, the agent re-reads the full context of what came before. That's 2.5 billion tokens of reading to produce 6.8 million tokens of writing -- a 370:1 ratio.

This is what "agentic" actually looks like at the billing level. The agent isn't a code printer. It's a participant in a feedback loop: read context, make a change, run tests, read results, iterate. Most of its compute goes to *understanding the state of things*, not *generating new things*. The real cost of AI-assisted engineering isn't generation. It's comprehension.

Was the $6,500 worth it? I wouldn't know. I'm on Max. That's $200.


## What's Next?

### Long-term Stewardship

This project started as one person's nights-and-weekends effort. I'd love to explore with Evan You and the Vue core team how we can shape the future of Vue on native together. Personally, and on behalf of the Lynx team, we're committed to supporting its growth.
### Feature Completeness

Vue Lynx is pre-alpha. The architecture is solid, but Vue's API surface is large, and we haven't verified every corner of it.
- Features like `KeepAlive` and `Teleport` likely need runtime adaptations.
- `<style scoped>` and `v-model` on native inputs are solvable but not yet implemented.
- The Main Thread Script API currently reuses ReactLynx's directive-based design. A more Vue-idiomatic approach (like `<script main-thread setup>`) is worth exploring.
- Vue DevTools integration with Lynx DevTool app.

And beyond Vue core, there's a massive Vue ecosystem waiting to grow on native.

The vision is simple: Vue developers should be able to ship native apps as naturally as they ship for the web today. We're not there yet, but the foundation is in place, and the path is clear.

---

If you've read this far: try it. Build something. Break something. Tell us what's missing.