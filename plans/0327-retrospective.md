# Vue Lynx Project Retrospective

> Compiled 2026-03-27 from a deep-dive conversation analyzing git history,
> Claude Code session logs, and token usage data across the entire project.

---

## Timeline & Phases

### Overall: 160 commits, 21 active days (3/01 - 3/23)

> **Two time measures** used throughout this document:
>
> - **Human Time** (123h): Wall-clock active hours, measured from message
>   timestamps with 30-min idle gaps excluded and overlapping sessions merged.
>   This is "how long I was at the keyboard." Cannot exceed 24h/day.
>
> - **Claude Time** (233h): Cumulative agent active hours across all sessions,
>   including parallel sessions. Analogous to CPU time. Can exceed 24h/day
>   when multiple agents run simultaneously (e.g., 3/12 had 21 parallel sessions).
>
> Previous commit-span estimate was ~119h human time; message-timestamp method
> found ~123h, with significant redistribution across phases (see below).

```
3/01-3/10  ████████████░░░░░░░░  Renderer + MTS + Cross-Thread
3/11-3/12  ░░░░████████░░░░░░░░  Toolchain Migration
3/12-3/14  ░░░░░░░░████████░░░░  Examples + Docs Burst
3/15-3/17  ░░░░░░░░░░░░████░░░░  Website + Publish
3/18-3/21  ░░░░░░░░░░░░░░░█████  Docs Polish + i18n
3/22-3/23  ░░░░░░░░░░░░░░░░████  Examples Polish
```

### Work Sessions (by local time, 6h commit gap = new session)

| Session | Local Time | Span | Claude | Main Work | + New Examples | ! Revisits/Fixes |
|---------|-----------|------|--------|-----------|---------------|-----------------|
| S1 | 3/01 21:41 - 3/02 08:07 | 10.5h | 11.8h | **MVP**: dual-thread, runtime align | | |
| S2 | 3/03 00:36 - 3/03 06:47 | 6.2h | 9.1h | SFC + MTS Phase 1 + test infra | todomvc | |
| S3 | 3/04 22:02 - 3/05 06:08 | 8.1h | 7.0h | Gallery + Swiper demos | gallery, swiper | |
| S4-5 | 3/08 06:11 - 3/08 17:39 | 11.5h | 2.1h | Ops refactor, ops tests | | |
| S6-7 | 3/09 02:44 - 3/09 21:24 | 18.7h | 7.7h | runOnBackground, NodesRef, API audit | basic, gallery, swiper | gallery (CSS scope, runtime PAPI fix) |
| S8-9 | 3/10 04:31 - 3/10 17:30 | 13.0h | 11.5h | HMR, layer-based architecture | | |
| S10-11 | 3/11 03:00 - 3/12 04:00 | 25.0h | 8.8h | Lynx for Web fixes + **Repo migration** | standalone | multiple (background events, __CreateText) |
| S12 | 3/12 17:36 - 3/13 02:37 | 9.0h | 22.8h | **Rspress site + examples burst** + docs | hello-world, 7guis, tailwindcss, vue-router, option-api, pinia, suspense, main-thread, todomvc | 7guis (tap coords), todomvc (scroll), DevTool CSS |
| S13 | 3/14 02:16 - 3/14 21:40 | 19.4h | 4.2h | Transition, cross-thread modules | transition | gallery (height % → vh), MTS webpack runtime |
| S14-15 | 3/15 03:49 - 3/16 21:45 | 42.0h | 9.3h | Go-web integration + **publish pipeline** | | swiper (height), 7guis (still broken), bridge events |
| S16-17 | 3/17 04:16 - 3/18 18:10 | 37.9h | 10.8h | __CreateComponent elimination | | tailwindcss (theme rewrite), gallery (CSS dimensions) |
| S18 | 3/19 07:36 - 3/20 03:53 | 20.3h | 13.5h | **Examples sprint** + docs polish | networking, v-model, provide-inject, slots, reactivity, css-features | networking (scroll, assets), slots (overflow), numeric flex |
| S19-20 | 3/20 16:51 - 3/22 18:24 | 49.5h | 3.5h | Docs polish, splitChunks, guardReactiveProps. i18n overnight (18 commits, agent-automated) | | |
| S21 | 3/23 01:11 - 3/23 18:38 | 17.5h | 0.9h | **HackerNews** + 7GUIs polish | hackernews-css, hackernews-tailwind | 7guis (3 more rounds), tailwindcss (dark theme, runtime SET_PROP), transition (slide-fade) |
| S22 | 3/24 | -- | -- | TodoMVC pre-launch polish | | todomvc (8 fixes: layout, edit, input), vue alias pnpm fix |
| S23 | 3/25 | -- | -- | TodoMVC final + test improvements | | todomvc (input overflow, Day 1 tribute split) |

> **Span vs Claude Time**: "Span" is human wall-clock time (first-to-last commit,
> your perception of "I sat down at 9pm and worked until 8am"). "Claude Time" is
> cumulative agent active time across all sessions on those calendar days
> (measured from message timestamps, 30-min idle gap excluded) -- analogous to
> CPU time vs wall-clock time. Claude Time > Span means high parallelism (multiple
> agents working simultaneously, e.g., S12: you sat for ~9h but agents accumulated
> 22.8h). Claude Time << Span means the session was open but mostly idle
> (e.g., S19-20: 49.5h span, 3.5h Claude Time).

### Human Time vs Claude Time by Day

```
Date     Human          Claude          Ratio  Notes
──────────────────────────────────────────────────────────────────────────
03/01    ██              ██▌              1.3x
03/02    █████████       ███████████▌     1.2x  hackathon night 1
03/03    █████████       ██████████████   1.6x  hackathon night 2
03/04    █▌              █▌               1.2x
03/05    █████           ██████           1.1x
03/08    ██              ██▌              1.3x
03/09    ███████▌        ██████████████████▌  2.4x  ← high parallelism
03/10    ███████████▌    █████████████████████████  2.2x  ← peak human (HMR + toolchain)
03/11    ████████▌       ██████████████   1.6x
03/12    ████████████▌   ███████████████████████  1.8x  peak human (website + examples)
03/13    ██████████      ██████████████████████████▌  2.7x  ← highest parallelism
03/14    ████            ███████▌         1.8x
03/15    ███▌            ████             1.1x
03/16    █████▌          ██████           1.1x
03/17    ███████         ████████████████ 2.3x  ← high parallelism
03/18    ███▌            ████             1.2x
03/19    █████▌          ██████████       1.7x
03/20    ███████▌        ██████████████   1.9x
03/21    ██▌             ██▌              1.1x  i18n overnight (18 commits in 3h, agent-automated)
03/22    █               █                1.2x
03/23    ▌               ▌                1.0x
──────────────────────────────────────────────────────────────────────────
Total    123h            233h             1.9x
         21 active days | Avg 5.9h human/day
         Hackathon (3/01-3/03): 20.9h human, 28.9h claude (1.4x)
```

Peak parallelism days (ratio > 2.0x):
- **3/13** (2.7x): 58 raw intervals, docs system burst with many parallel agent sessions
- **3/09** (2.4x): 36 raw intervals, cross-thread API design with parallel research agents
- **3/17** (2.3x): 32 raw intervals, __CreateComponent elimination + parallel testing
- **3/10** (2.2x): 45 raw intervals, HMR + layer-based architecture with parallel worktrees

> **Key pattern**: 10 runtime/plugin fixes were surfaced by examples breaking,
> not by automated tests. The most persistent bugs (7guis/circle-drawer: 4 fix
> rounds across 3/13-3/23; todomvc: 8 fixes on 3/24) were layout/interaction
> issues that only manifest on real devices -- validating the "examples as
> acceptance tests" approach.

---

## Topic Distribution

### By LOC (79.5K total across 160 commits)

```
  Docs/Web     ████████████████████████████████           32,450 LOC  (41%)
  Toolchain    █████████████████                          17,396 LOC  (22%)
  Examples     █████████████████                          16,569 LOC  (21%)
  Renderer     █████████                                   9,320 LOC  (12%)
  MTS          ███                                         3,397 LOC   (4%)
  Publish                                                    357 LOC   (0%)
```

### By Claude Time (233h total, scaled to 123h human time for %)

```
  Debugging    ██████████████████████████████████████    47.4h (38%)
  Design       ███████████████████████                   29.3h (24%)
  Testing      ███████████                               13.6h (11%)
  Examples     ████████                                  10.2h  (8%)
  Docs         ██████                                     8.5h  (7%)
  Research     █████                                      6.9h  (6%)
  Other        █████                                      7.2h  (6%)
```

> **LOC vs Claude Time tell very different stories.** Docs/Web is 41% by LOC but
> only 7% by Claude Time (i18n translations are high LOC, low effort). Debugging
> is invisible in LOC (bug fixes are often single-line changes) but dominates
> Claude Time at 38%. The real cost of this project was comprehension and
> iteration, not content generation.

### Phase Summary

| Phase | Date | Human Time | Primary LOC |
|-------|------|-------------|-------------|
| Core Runtime | 3/01-3/03 | 20.9h | Renderer 3,754 + MTS 789 |
| MTS & Demos | 3/04-3/09 | 16.8h | MTS 2,233 + Examples 4,765 |
| Toolchain & Repo | 3/10-3/11 | 20.3h | Toolchain 9,298 |
| Website & Examples | 3/12-3/14 | 27.1h | Website 15,584 + Examples 4,190 |
| Polish & Publish | 3/15-3/18 | 20.1h | Mixed |
| Docs & i18n | 3/19-3/21 | 16.0h | Website 7,401 |
| Final Polish | 3/22-3/23 | 2.0h | Examples 3,519 |

> **vs. commit-span method**: The biggest shifts: Core Runtime went from 9.2h
> to 20.9h (+11.7h, because debugging/research without commits was invisible),
> while Docs & i18n dropped from 25.0h to 16.0h (-9.0h, because the old method
> over-counted long session spans with sparse commits). Total changed only +4.5h.

---

## Core Codebase (git blame, surviving lines)

Current core = 5,253 lines (runtime + main-thread + plugin + internal).

```
3/02  ████████████████████  19.6%  — MVP, node-ops/shadow-element foundation
3/03  ██████                 6.3%  — SFC + MTS Phase 1
3/05  ██████                 6.1%  — Gallery/Swiper demo-driven fixes
3/08  █████████              9.2%  — ops protocol refactor
3/09  █████████              8.6%  — runOnBackground, NodesRef
3/10  ███████████████       15.2%  — layer-based architecture (largest single day)
3/13  █████████████████     17.0%  — ComponentElement, cross-thread
3/14  █████████████         12.8%  — Transition + webpack runtime
3/17+ ██                     2.5%  — minor fixes
```

**Hackathon (3/01-3/03)**: 1,356 surviving lines = **25.8%** of current core
**Phase 1+2 (3/01-3/09)**: 2,609 surviving lines = **49.7%** of current core
**By 3/14**: 5,119 surviving lines = **97.4%** — core was essentially complete

---

## Design Plans

23 plans, 6,177 lines of architectural reasoning.

### By Category

| Type | Count | Lines |
|------|-------|-------|
| Design (architecture/implementation) | 13 | 4,037 |
| Research (analysis) | 3 | 823 |
| Refactor | 3 | 693 |
| Fix (root cause analysis) | 2 | 214 |
| Future (unimplemented) | 2 | 410 |

### Most Important Plans

**Tier 1 — Architecture Foundation:**
- `0303-3` Dual-Thread MVP (461L) — analyzed Vue Vine approach, designed opposite architecture
- `0303-5` Main Thread Script (457L) — mapped React Lynx worklets to Vue reactivity
- `0309-5` Layer-Based MT Architecture (538L) — solved multi-entry bundle sharing

**Tier 2 — Key Capabilities:**
- `0309-2` runOnBackground (393L) — MT→BG cross-thread calls
- `0308-2` Transition/TransitionGroup (578L) — longest plan, full CSS animation mapping
- `0317-1` Eliminate __CreateComponent (234L) — discovered dual CSS pipelines

**Tier 3 — Engineering Decisions:**
- `0303-1` Vue Vine Analysis (320L) — project origin, motivating the architecture
- `0310-1` Independent Repo Strategy (273L) — two npm packages decision
- `0308-1` ops-apply Split (406L) — God file refactor

### Plan Timeline

```
03/03  ██████████████████████  1,864L  6 plans  (MVP/MTS/testing)
03/04  ████                      264L  1 plan
03/06  ███                       201L  1 plan
03/08  ██████████████            984L  2 plans  (ops refactor + Transition)
03/09  ████████████████████    1,654L  5 plans  (cross-thread capability design)
03/10  ████                      273L  1 plan
03/11  ████                      275L  1 plan
03/12  █                          99L  1 plan
03/13  ██                        180L  2 plans
03/17  ████                      330L  2 plans
03/19  █                          53L  1 plan
```

---

## Token Usage & Cost

### Grand Total (bangalore worktree + vue-lynx repo)

```
┌──────────────────────────────────────────┐
│ The Bill (at Opus rate)                  │
├──────────────────────────────┬───────────┤
│ Sessions                     │       177 │
│ API turns                    │    31,701 │
├──────────────────────────────┼───────────┤
│ Input (3.8M tokens)          │ $      57 │
│ Output (6.8M tokens)         │ $     510 │
│ Cache Write (117.9M tokens)  │ $   2,211 │
│ Cache Read (2.5B tokens)     │ $   3,769 │
├──────────────────────────────┼───────────┤
│ TOTAL                        │ $   6,547 │
└──────────────────────────────┴───────────┘
```

Output = 8% of cost. Cache Read = 58%. The 370:1 read:write ratio.

### The Hackathon Night (3/01-3/03)

22 sessions, 5,773 turns, 1.29M output tokens, **~$1,379** at Opus rate.
Human time: **20.9h**. Previous commit-span estimate was ~9.2h, which severely
undercounted the debugging and research time that didn't produce commits.

### Daily Token Usage

| Date | Sessions | Turns | Output |
|------|----------|-------|--------|
| 3/01 | 3 | 525 | 144K |
| 3/02 | 13 | 2,290 | 441K |
| 3/03 | 8 | 3,129 | 703K |
| 3/04 | 1 | 426 | 117K |
| 3/05 | 3 | 663 | 155K |
| 3/08 | 5 | 271 | 68K |
| **3/09** | **9** | **2,976** | **769K** |
| **3/10** | **23** | **4,507** | **1,163K** |
| 3/11 | 7 | 1,351 | 260K |
| **3/12** | **21** | **4,918** | **871K** |
| **3/13** | **23** | **3,638** | **726K** |
| 3/14 | 3 | 282 | 74K |
| 3/15 | 3 | 650 | 150K |
| 3/16 | 2 | 481 | 83K |
| 3/17 | 17 | 1,418 | 257K |
| 3/18 | 5 | 502 | 102K |
| 3/19 | 17 | 1,551 | 291K |
| 3/20 | 8 | 1,611 | 312K |
| 3/21 | 4 | 376 | 117K |

Peak: 3/10 (1.2M output, HMR + Toolchain) and 3/12 (871K, Website + Examples burst).

---

## Session Metrics

### Profile

```
┌──────────────────────────────────────────────────────┐
│ Session Profile                                      │
├──────────────────────────────────┬───────────────────┤
│ Sessions                         │               185 │
│ Median turns per session         │               112 │
│ P90 turns per session            │               438 │
│ Max turns (single session)       │             1,377 │
├──────────────────────────────────┼───────────────────┤
│ Tool use ratio                   │             61.2% │
│ Avg output per turn              │        216 tokens │
│ Avg context read per turn        │     86K tokens    │
│ Peak context (P90)               │    167K tokens    │
│ Sessions triggering compaction   │           24%     │
├──────────────────────────────────┼───────────────────┤
│ Context : Output ratio           │           399:1   │
├──────────────────────────────────┼───────────────────┤
│ Human time (merged, 30-min gap)  │          123.2h   │
│ Claude time (unmerged)           │          232.9h   │
│ Parallelism ratio                │           1.89x   │
│ Active blocks                    │             149   │
│ Median active block              │          26 min   │
│ Mean active block                │          55 min   │
│ Longest active block             │           6.0h    │
└──────────────────────────────────┴───────────────────┘
```

> **Time measurement methodology**: Session file creation-to-modification
> times are unreliable (sessions stay open for days). Instead, we parse the
> ISO 8601 `timestamp` field on each message line in the session JSONL files,
> split into active intervals using a 30-minute idle gap threshold.
> - **Human time** (123.2h): merge overlapping intervals, then sum. Cannot exceed 24h/day.
> - **Claude time** (232.9h): sum all intervals without merging. Counts parallel work multiple times.

### Tool Usage Distribution

```
  Bash                       8,539  ( 42.0%) █████████████████████████████████████████
  Read                       4,594  ( 22.6%) ██████████████████████
  Edit                       2,210  ( 10.9%) ██████████
  Grep                       1,322  (  6.5%) ██████
  Write                        871  (  4.3%) ████
  Glob                         386  (  1.9%) █
  Agent (subagent)             311  (  1.5%) █
  WebFetch                     200  (  1.0%)
  DevTool MCP                  341  (  1.7%) █
```

---

## Workload Classification

### Six Workload Types

```
┌──────────────┬─────────┬──────────┬────────┬────────┬────────┬──────────────────────────────────────┐
│ Workload     │ Human T │ Claude T │ Turns  │ AvgOut │ CR:Out │ Signature                            │
├──────────────┼─────────┼──────────┼────────┼────────┼────────┼──────────────────────────────────────┤
│ Debugging    │  44.2h  │   83.9h  │ 14,994 │   208  │ 422:1  │ Long sessions, shell-output heavy    │
│ Design       │  32.7h  │   62.0h  │  7,100 │   241  │ 356:1  │ Highest output/turn, deep file reads │
│ Testing      │  13.6h  │   25.8h  │  3,786 │   143  │ 317:1  │ Lowest output, run-and-check cycles  │
│ Examples     │  10.2h  │   19.3h  │  1,900 │   149  │ 272:1  │ Short sessions, build-and-verify     │
│ Docs         │   8.5h  │   16.0h  │  2,142 │   214  │ 258:1  │ Balanced, lowest CR:Out ratio        │
│ Research     │   6.9h  │   13.1h  │  1,392 │   229  │ 336:1  │ 63% Read, almost no writes           │
│ Other        │   7.2h  │   14.6h  │  2,138 │   --   │   --   │ Implementation, verification, mixed  │
├──────────────┼─────────┼──────────┼────────┼────────┼────────┼──────────────────────────────────────┤
│ Total        │  123.2h │  234.7h  │ 33,452 │   216  │ 399:1  │ 1.9x parallelism ratio               │
└──────────────┴─────────┴──────────┴────────┴────────┴────────┴──────────────────────────────────────┘
```

```
Claude Time by workload (each █ = 2h):

  Debugging    █████████████████████████████████████████    83.9h (36%)
  Design       ███████████████████████████████              62.0h (26%)
  Testing      ████████████                                 25.8h (11%)
  Examples     █████████                                    19.3h  (8%)
  Docs         ████████                                     16.0h  (7%)
  Research     ██████                                       13.1h  (6%)
  Other        ███████                                      14.6h  (6%)
```

### What Fills the Context Window (by workload)

```
DEBUGGING (50% of all turns, CR:Out 422:1)
  Context is:   Shell ██████████████████████████████  56%    ← test output, error logs
                Read  ████████████████                32%    ← reading source to understand

DESIGN (33% of all turns, CR:Out 356:1)
  Context is:   Read  ███████████████████████         46%    ← deep source code analysis
                Shell ████████████████████            39%    ← build verification

RESEARCH (7% of all turns, CR:Out 336:1)
  Context is:   Read  ████████████████████████████    55%    ← comparing implementations
                Search████████                        15%    ← grep/glob across codebase

TESTING (4% of all turns, CR:Out 317:1)
  Context is:   Shell ████████████████████████        48%    ← test run results
                Read  ████████████████████            39%    ← reading test files/configs

DOCS (3% of all turns, CR:Out 258:1)
  Context is:   Read  ████████████████████            40%    ← reference docs/source
                Shell ███████████████████             38%    ← build/preview

EXAMPLES (2% of all turns, CR:Out 272:1)
  Context is:   Shell ██████████████████████████      51%    ← dev server, build output
                Read  █████████████████               34%    ← reading component source
```

### Key Insight

Debugging has the highest CR:Out ratio (422:1) because:
1. Sessions are longest (avg 254 turns)
2. Shell output dominates context (56%) — test failures and error logs
3. Output per turn is short (208 tokens) — "let me try X"

Docs has the lowest ratio (258:1) because sessions are shorter (avg 138 turns)
and Write ratio is higher — the agent produces content, not just reads.

---

## Harness Engineering Practices

### Mapping to Anthropic & OpenAI frameworks

| Practice | Anthropic Term | OpenAI Term | Our Implementation |
|----------|---------------|-------------|-------------------|
| 23 plan documents | Progress file / Initializer | Context engineering | Design docs with Context/Goals/Non-Goals |
| AGENTS.md | Environment setup | Context engineering | Architecture notes + debugging checklist |
| CLAUDE.md principles | -- | Architectural constraints | 4 rules from past failures |
| Upstream tests (941) | -- | Feedback loops + Constraints | Vue's test suite as conformance oracle |
| E2E pipeline tests | -- | Feedback loops | testing-library/ with LynxTestingEnv |
| DevTool MCP verification | Browser automation | Feedback loops | Agent-on-Native (iOS Simulator) |
| agent-browser verification | Browser automation | Feedback loops | Agent-on-Web (Lynx for Web) |
| Biome + TypeScript | -- | Deterministic checks | CI lint + type check |
| ops-apply refactor etc. | -- | Garbage collection | 3 refactor plans |
| Conventional commits | Git history | Incremental progress | 160 well-structured commits |

### Five Feedback Loops

```
┌────────────────────┬────────────────────────────────────┬─────────────────────┬──────┬──────┐
│ Feedback Loop      │ What it validates                  │ Source              │ Pass │ Skip │
├────────────────────┼────────────────────────────────────┼─────────────────────┼──────┼──────┤
│ Conformance tests  │ ShadowElement ↔ Vue VDOM diff      │ Vue runtime-core    │  407 │   59 │
│ Integration tests  │ BG → ops → MT → PAPI → jsdom       │ Vue runtime-dom     │   54 │   20 │
│ E2E pipeline tests │ Lynx elements, events, APIs        │ Our own tests       │   33 │   -- │
│ Agent-on-Native    │ Layout, rendering, gesture bugs    │ Lynx DevTool MCP    │   -- │   -- │
│ Agent-on-Web       │ Visual and interaction regressions │ agent-browser       │   -- │   -- │
└────────────────────┴────────────────────────────────────┴─────────────────────┴──────┴──────┘
```

First three = automated. Last two = agent-driven (end-to-end testing as a human user would).

### Three Architect Traits in the Engineering Section

1. **Direction** — Plans + constraints (Dual-Threaded Architecture section)
2. **Quality** — Upstream tests + feedback loops (Bridging the Upstream Tests section)
3. **Strategy** — Examples + docs + adoptability (Scaling Out section)
