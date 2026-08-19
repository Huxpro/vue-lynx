# Vapor Example Matrix and Lynx-for-Web Verification Design

## Goal

Audit every runnable entry in the repository's 26 `examples/` directories,
build a Vapor version wherever the exercised APIs are supported, verify both
VDOM and Vapor variants in a real Lynx-for-Web runtime, and expose an explicit,
evidence-backed Vapor status for every entry.

The current scope ends when all 45 entries have a conclusive Lynx-for-Web
result. Native Lynx Explorer verification can consume the same manifest and
scenarios later, but is not a completion gate for this phase.

## Baseline

The repository currently contains 26 example directories and 45 configured
Rspeedy entries. A clean baseline build on 2026-07-13 produced all 45
`.web.bundle` files and all 45 `.lynx.bundle` files without failures. This
establishes that subsequent Vapor failures belong to the Vapor conversion or
runtime path rather than to an already-broken VDOM build.

## Source of Truth

Create one checked-in, typed entry manifest. The manifest is entry-granular;
directory-level status is derived from its entries.

Each entry records:

- stable ID (`directory/entry`);
- source entry path;
- expected Vapor disposition (`candidate`, `adapter`, or `unsupported`);
- structured unsupported reason when applicable;
- optional Vapor bootstrap adapter;
- deterministic Web verification scenario;
- source files or packages that justify an unsupported result.

Generated verification results record the VDOM build, VDOM Web runtime, Vapor
build, Vapor Web runtime, parity status, source hash, and diagnostic evidence.
The source hash covers the reachable source graph, example config, scenario,
Vue version, and Vue Lynx version. A source change invalidates stale green
evidence.

## Vapor Build Profile

VDOM source remains canonical. A separate build profile compiles selected
entries as pure Vapor apps without copying entire example directories.

The profile performs these mechanical changes only during the Vapor build:

1. compile every reachable `<script setup>` SFC as Vapor;
2. resolve the exact `vue-lynx` runtime entry to `vue-lynx/vapor-app`;
3. select only the requested entry so partially supported directories build
   independently;
4. emit `dist-vapor/<entry>.web.bundle` and
   `dist-vapor/<entry>.lynx.bundle`;
5. reject Options API, render functions, mixed VDOM dependencies, and known
   unsupported built-ins before compilation with a structured reason.

Adapters are allowed only when an entry's bootstrap uses `h()` to supply demo
props or slots while the feature itself is template-compatible. An adapter is
a thin `<script setup vapor>` SFC plus entry file that mounts the same existing
components with the same props, slots, data, styles, and behavior. It may not
remove functionality.

The networking example's second non-setup script contains only a static style
object. Moving that object to a shared TypeScript module is a parity-preserving
source normalization, not a reduced Vapor example.

## Initial Entry Classification

### Direct candidates (30)

- all seven `7guis` entries;
- `basic/main`;
- `css-features/main`;
- `event-modifiers/main`;
- `gallery/GalleryList`;
- `gallery/GalleryAutoScroll`;
- `gallery/GalleryScrollbar`;
- `gallery/GalleryScrollbarCompare`;
- `gallery/GalleryComplete`;
- `hello-world/main`;
- all five `main-thread` entries;
- `pinia/main`;
- `provide-inject/main`;
- `reactivity/main`;
- `slots/main`;
- `tailwindcss/main`;
- `todomvc/main`;
- `todomvc-day1/main`;
- `v-model/main`;
- `vapor/main`.

### Adapter or normalization candidates (6)

- `gallery/ImageCard`;
- `gallery/LikeCard`;
- `swiper/SwiperEmpty`;
- `swiper/SwiperMTS`;
- `swiper/Swiper`;
- `networking/main`.

### Intentional unsupported candidates (9)

- `basic/h-counter`: render function and `h()`;
- `hackernews-css/main`: Vue Router VDOM components and Transition built-ins;
- `hackernews-tailwind/main`: Vue Router VDOM components and Transition
  built-ins;
- `keep-alive/main`: `KeepAlive`;
- `option-api/main`: Options API;
- `suspense/main`: `Suspense` and async component rendering;
- `transition/transition`: `Transition` and `TransitionGroup`;
- `todomvc-codex/main`: Vue Router VDOM components;
- `vue-router/main`: Vue Router VDOM components.

This is a hypothesis, not the published answer. Build and runtime evidence may
move candidates to a different final state. Unsupported entries still run and
pass their VDOM Lynx-for-Web scenario; the harness also verifies that their
unsupported reason remains present and accurate.

## Web Harness

The harness runs in real Chromium with `@lynx-js/web-core`. It does not use
jsdom. A dedicated hidden website route creates one `lynx-view`, applies the
same template-loader fixes as the existing benchmark playground, and exposes a
small test contract after its shadow tree is ready.

Every entry runs in a fresh browser context and passes three gates.

### Runtime gate

- bundle and dependent resources return successfully;
- `lynx-view` creates an open shadow root;
- the Lynx tree becomes non-empty and settles;
- no uncaught exception, console error, unhandled rejection, or failed resource
  occurs;
- the page remains responsive after initial render.

### Entry scenario

Each entry has deterministic assertions against visible content and at least
one representative interaction when the example is interactive. Scenarios use
semantic text or stable example-owned selectors. Network examples use browser
request fixtures. Async and animation examples wait for observable conditions,
not fixed sleeps.

### VDOM/Vapor parity

The same scenario runs against both variants. It compares normalized visible
state and scenario checkpoints, not internal node IDs or byte-identical DOM.
Any missing feature, different result, runtime error, or interaction failure
prevents a `supported` result.

## Result States

An entry finishes in exactly one state:

- `supported`: VDOM build/Web and Vapor build/Web all pass, and parity passes;
- `unsupported`: VDOM build/Web pass and a current, structured Vapor capability
  gap is proven;
- `regression`: VDOM previously expected to work but fails;
- `blocked`: external infrastructure prevents a conclusive run. This state is
  never presented as API support or success.

No entry may remain `candidate`, `unknown`, or unvisited at phase completion.

## Website Presentation

The website consumes the generated matrix.

- Each `<Go>` instance shows a local `VDOM` / `Vapor` mode control when its
  selected entry is supported.
- Unsupported entries show a neutral `Vapor unsupported` badge with a concise
  reason and a link to the Vapor limitations section.
- Multi-entry examples update the status when the selected entry changes.
- Vapor source view displays the effective entry/adapter and the mechanical
  `<script setup vapor>` build profile without duplicating the canonical source
  tree.
- There is no global site-wide Vapor switch.

## CI and Commands

The repository exposes these commands:

```text
pnpm examples:inventory
pnpm examples:build:vapor
pnpm examples:verify:web
pnpm examples:verify:status
```

`examples:inventory` fails if a configured entry is absent from the manifest
or if the manifest references a deleted entry. `examples:verify:web` supports
entry filters and CI sharding but defaults to all 45 entries.
`examples:verify:status` fails unless every entry has a conclusive state and
the stored source hash matches current inputs.

## Error Handling and Diagnostics

Failures include entry ID, mode, phase, bundle URL, console messages, failed
requests, scenario step, and a screenshot. The harness continues across entry
failures and exits non-zero after writing a complete report. Expected
unsupported cases are validated as data and do not hide unexpected compiler
or runtime failures.

## Completion Criteria

This phase is complete only when:

1. inventory discovers exactly the repository's configured entries and has no
   manifest drift;
2. all 45 VDOM variants pass build and Lynx-for-Web runtime scenarios;
3. every non-unsupported entry either passes Vapor build/Web/parity or is moved
   to `unsupported` with concrete evidence;
4. all intentional unsupported entries have passing VDOM scenarios and current
   reason checks;
5. no entry remains unknown, candidate, unvisited, or stale;
6. the website build consumes and renders the matrix;
7. lint, unit tests, example builds, Web verification, and website build pass
   from a clean checkout.
