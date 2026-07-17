# GenUI Porting Tracker (`@lynx-js/genui` → Vue Lynx)

Port of [`lynx-family/lynx-stack` `packages/genui`](https://github.com/lynx-family/lynx-stack/tree/main/packages/genui)
(upstream `@lynx-js/genui@0.0.6`) into Vue Lynx as `packages/genui`
(`vue-lynx-genui`). Both the **A2UI v0.9** renderer and the **OpenUI Lang
v0.5** renderer are in scope, with full feature parity unless impossible or
unsuitable for Vue (marked below with reasons).

Legend: ✅ done · 🚧 in progress · ⬜ pending · ❌ not ported (reason given)

## Architecture mapping

| Upstream (ReactLynx)                     | Vue Lynx port                                   |
| ---------------------------------------- | ----------------------------------------------- |
| `@preact/signals` (`signal`, `computed`, `effect`, `batch`) | `@vue/reactivity` via `src/shared/signals.ts` adapter (`shallowRef`-backed, same call shape) |
| React context (`createContext`)          | `provide`/`inject` with `InjectionKey`          |
| Hooks (`useX`)                           | Composables (props passed as getters/refs)      |
| `useSyncExternalStore`                   | `useExternalStore` composable (`shallowRef` + subscribe) |
| JSX components                           | `defineComponent` + `h()` render functions (no SFC, keeps 1:1 diffability, plain `tsc` build) |
| `@lynx-js/react` elements (`<view>`, `<text>`, …) | same Lynx elements through vue-lynx custom renderer |
| `@lynx-js/lynx-ui` primitives (React-only) | minimal Vue reimplementations in `src/a2ui/lynx-ui/` (see below) |
| `@a2ui/web_core` (protocol types + basic functions) | kept as npm dependency (framework-agnostic)    |
| `@openuidev/lang-core` (parser/store/query manager) | kept as npm dependency (framework-agnostic)    |

## A2UI

### Core (`a2ui/src/store` → `src/a2ui/store`)

| Module                  | Status | Notes |
| ----------------------- | ------ | ----- |
| `MessageStore.ts`       | ✅     | framework-agnostic, verbatim |
| `MessageProcessor.ts`   | ✅     | verbatim (uses signals adapter) |
| `SignalStore.ts`        | ✅     | `@preact/signals` → signals adapter |
| `signalResolution.ts`   | ✅     | same |
| `FormController.ts`     | ✅     | same |
| `FunctionRegistry.ts`   | ✅     | verbatim |
| `Resource.ts`           | ✅     | verbatim |
| `resolveDynamic.ts`     | ✅     | verbatim |
| `resolveFunctionCall.ts`| ✅     | verbatim |
| `payloadNormalizer.ts`  | ✅     | verbatim |
| `types.ts` / `utils.ts` | ✅     | verbatim |
| `functions/` (basic function impls) | ✅ | verbatim + Vue `isRef` unwrap for signal-returning impls |
| `snapshot/`             | ✅     | framework-agnostic, verbatim |

### Renderer (`a2ui/src/react` → `src/a2ui/vue`)

| Module              | Status | Notes |
| ------------------- | ------ | ----- |
| `A2UI.tsx`          | ✅     | `<A2UI>` Vue component; `renderEmpty`/`renderFallback`/`renderError`/`renderUnsupported`/`wrapSurface` become slots (`#empty`, `#fallback`, `#error`, `#unsupported`, `#surface`) with function-prop parity |
| `A2UIProvider.tsx`  | ✅     | provide/inject |
| `A2UIRenderer.tsx`  | ✅     | incl. `NodeRenderer` |
| `useDataBinding.ts` | ✅     | composable returning `computed` |
| `useResolvedProps`  | ✅     | computed + shallow-equal cache |
| `useAction.ts`      | ✅     | composable |
| `useChecks.ts`      | ✅     | composable |
| `useCatalog.ts`     | ✅     | composable |
| `FormContext.ts`    | ✅     | injection key |
| `defineCatalog.ts`  | ✅     | `CatalogComponent` = Vue component |

### Catalog components (`a2ui/src/catalog` → `src/a2ui/catalog`)

| Component       | Status | Notes |
| --------------- | ------ | ----- |
| Text            | ✅     | `markdown` variant uses `<x-markdown>` custom element (native-only upstream too) |
| Button          | ✅     | |
| Card            | ✅     | |
| CheckBox        | ✅     | |
| ChoicePicker    | ✅     | uses lynx-ui `Select`-family primitives → Vue reimpl |
| Column          | ✅     | |
| DateTimeInput   | ✅     | uses lynx-ui picker primitives → Vue reimpl |
| Divider         | ✅     | |
| Icon            | ✅     | material icons CSS |
| Image           | ✅     | |
| LazyComponent   | ⚠️     | ported; loads bundles default-exporting **Vue** components — upstream ReactLynx lazy bundles cannot run in a Vue tree (see Not ported notes) |
| LineChart       | ✅     | |
| List            | ✅     | |
| Loading         | ✅     | |
| Modal           | ✅     | uses lynx-ui dialog primitives → Vue reimpl |
| PieChart        | ✅     | |
| RadioGroup      | ✅     | uses lynx-ui radio primitives → Vue reimpl |
| Row             | ✅     | |
| Slider          | ✅     | Vue slider primitive: drag via touch events + SelectorQuery rect (upstream uses main-thread gestures) |
| Tabs            | ✅     | |
| TextField       | ✅     | uses lynx-ui `Input`/`TextArea` → Vue reimpl |
| `defineCatalog` / `mergeCatalogs` / `serializeCatalog` | ✅ | |
| catalog manifests (extractor JSON output) | ✅ | vendored from the published `@lynx-js/genui` dist into `src/a2ui/catalog/manifests.generated.ts`; `catalogManifests` is fully populated |
| styles (`a2ui/styles/**`) | ✅ | copied verbatim to `packages/genui/styles/a2ui` |

### A2UI prompt (`a2ui-prompt`)

| Module | Status | Notes |
| ------ | ------ | ----- |
| `buildA2UISystemPrompt` etc. | ✅ | copied verbatim (incl. `server/agent/a2ui-*` prompt/catalog/example modules it depends on) as `src/a2ui-prompt` |

## OpenUI

### Core (`openui/src/core` → `src/openui/core`)

| Module                | Status | Notes |
| --------------------- | ------ | ----- |
| `library.tsx`         | ✅     | `ComponentRenderer` = Vue component type |
| `context.tsx`         | ✅     | provide/inject + composables |
| `renderer.tsx`        | ✅     | `OpenUiRenderer` (runtime + parsed modes), `renderDeep` |
| `hooks/useOpenUIState.ts` | ✅ | central state composable |
| `hooks/useFormValidation.ts` | ✅ | |
| `hooks/useStateField.ts` | ✅  | |
| `runtime/reactive.ts` | ✅     | framework-agnostic (zod marking), verbatim |
| `utils.ts`            | ✅     | verbatim |
| `openui-prompt/`      | ✅     | framework-agnostic, verbatim |
| `renderer.css` + `styles/**` | ✅ | copied verbatim to `packages/genui/styles/openui` |

### Catalog components (`openui/src/catalog` → `src/openui/catalog`)

| Component    | Status | Component    | Status |
| ------------ | ------ | ------------ | ------ |
| Action       | ✅     | List         | ✅     |
| AudioPlayer  | ✅     | Loading      | ✅     |
| Button       | ✅     | Modal        | ✅     |
| Card         | ✅     | RadioGroup   | ✅     |
| CardHeader   | ✅     | Row          | ✅     |
| CheckBox     | ✅     | Separator    | ✅     |
| ChoicePicker | ✅     | Slider       | ✅     |
| Column       | ✅     | Stack        | ✅     |
| DateTimeInput| ✅     | Tabs         | ✅     |
| Divider      | ✅     | Tag          | ✅     |
| Icon         | ✅     | Text         | ✅     |
| Image        | ✅     | TextContent  | ✅     |
| (+ Buttons)  | ✅     | TextField    | ✅     |
|              |        | Video        | ✅     |

## Examples (upstream `playground/lynx-src` → `examples/genui`)

| Demo                        | Status | Notes |
| --------------------------- | ------ | ----- |
| A2UI demo app (`lynx-src/a2ui`) | ✅ | `examples/genui` entry `a2ui`; adds a standalone demo picker (upstream app is a headless preview driven by the React web playground); keeps `globalProps` contract (`messages`, `instant`, `speed`, `theme`, `demo`, `chromeless`) |
| OpenUI demo app (`lynx-src/openui`) | ✅ | `examples/genui` entry `openui`; standalone scenario picker + upstream `rawText`/`instant`/`speed`/`theme` globalProps |
| A2UI lazy component demo    | ⚠️     | demo listed; the upstream lazy bundle is a ReactLynx standalone bundle which cannot execute in a Vue tree — the Vue LazyComponent shows its fallback instead (see Not ported) |
| Mock data (`a2ui-gallery/*.json`, `basic/*.json`, `openui-scenarios.ts`, `io-mock/mockAgent.ts`) | ✅ | copied verbatim (imports re-pointed at `vue-lynx-genui`) |

## Tests (upstream `a2ui/test`, `openui` tests → `packages/genui/test`)

| Suite | Status |
| ----- | ------ |
| store: messageStore / processor / payloadNormalizer / resolveDynamic / functionRegistry / executeFunctionCall / createResource / basicFunctions / defineCatalogFunctions | ✅ 129 tests pass (`pnpm test:unit`) |
| components: catalog / choicePicker / dateTimeInput / slider / textField / formContext / useDataBinding / snapshot | ✅ included in the 129 |
| openui: library creation + parse + full dual-thread render tests (`pnpm test:dom`, 9 tests: A2UI surface render/update/actions, OpenUI static/streaming/$state/actions) | ✅ |

## Verification (Lynx for Web screenshot comparison)

| Item | Status | Notes |
| ---- | ------ | ----- |
| Reference build of upstream ReactLynx demos | ✅ | standalone rspeedy app building the **same lynx-stack checkout sources** that were ported (npm 0.0.6 is older than the checkout) |
| Vue examples web build | ✅ | `examples/genui` `.web.bundle`s |
| Playwright screenshot harness (`lynx-view` embedding) | ✅ | `@lynx-js/web-core` lynx-view page + pixelmatch diffing; same payload driven into both bundles via `globalProps` |
| Side-by-side comparisons per demo | ✅ | full matrix run 2026-07-11: **47 static demos** (43 A2UI + 4 OpenUI) — 45 at 0.00% pixel diff, worst 0.17% (`advanced-form-validator`, text antialiasing on validation copy) and 0.08% (`login-form`); **15/15 extended OpenUI playground scenarios** at 0.00% (incl. `Query()`/`Mutation()` runtime hydrated from a mock tool provider); **4/4 tap-interaction cases** ≤ 0.17% after driving identical tap sequences into both bundles. Report with tables + side-by-side screenshots published as a session artifact (screenshots not committed to the repo). |

## ❌ Not ported (with reasons)

| Upstream module | Reason |
| --------------- | ------ |
| `cli/` (`genui` CLI) | Build-time Node tooling that orchestrates the catalog extractor and prompt generation for **React TSX** sources; not Vue-specific value. Prompt generation is ported as library functions; extraction of Vue SFC/TS props schemas would be a new tool, not a port. Upstream CLI remains usable for schema/prompt artifacts. |
| `a2ui-catalog-extractor/` | Parses **React/TSX interfaces** (`@a2uiCatalog` JSDoc tags) with ts-morph to emit JSON manifests. The Vue port reuses the upstream-published manifests for built-in components; a Vue-aware extractor is out of scope (new tool, not a port). |
| `server/` | Framework-agnostic Node agent server (Anthropic/OpenAI streaming). No UI code; usable as-is from upstream — nothing Vue-specific to port. Examples use mock streams instead. |
| `ui-judge/` | Dev-only LLM screenshot-judging harness for upstream CI. Not part of the shipped library. |
| `playground/lynx-src/a2ui-lazy-component` + the `lazy-component` demo / `LazyComponent` catalog entry | Requires a separately-built Lynx **lazy bundle** (`experimental_isLazyBundle`) — a ReactLynx toolchain feature the Vue Lynx plugin does not implement. The `LazyComponent` catalog *component* itself is ported; only the playground demo that needs a real lazy bundle is omitted. |

## Playground (`playground/` → `examples/genui-playground` + website `/genui`)

The full IDE-style playground is adopted as `examples/genui-playground` and
embedded on the website at `/genui` (nav entry, `docs/genui.mdx`
full-bleed iframe; static build copied to `docs/public/genui-playground/`
by `website/scripts/prepare-playground.mjs`).

| Piece | Status | Notes |
| ----- | ------ | ----- |
| `playground/src` web shell (Create / Examples / Catalog / Bench, editor, phone preview, QR, playback) | ✅ copied as-is (React DOM) | Kept React deliberately: it is website chrome, not Lynx UI — the Vue Lynx website is already React (rspress), and rewriting ~40 shell components in Vue adds no user value. Decision recorded in `examples/genui-playground/README.md`. |
| `playground/lynx-src/{a2ui,openui}` preview apps | ✅ ported to Vue | Full playground protocol: `globalProps` boot, mock-agent streaming, playback mode (`A2UI_PLAYBACK_CONTROL`/`A2UI_PLAYBACK_PROGRESS`), `A2UI_REPLAY_MESSAGES`/`A2UI_LIVE_MESSAGES`/`A2UI_ACTION_RESPONSE`, `A2UI_PLAYBACK_SYNC`/`A2UI_USER_ACTION` bridge calls. |
| Website embed | ✅ | `/genui` + `/zh/genui` pages; verified in-browser (all tabs for both protocols, instant-example tiles, replay into preview, playback metrics FCP/FMP/TTI reporting, icon glyphs). |
| Shell divergences | — | Bundle filenames `*.web.bundle` (Vue plugin) instead of `*.web.js`; host page imports `material-icons.css` (shadow-root `@font-face` limitation below); dead `UsageSection.tsx` and rstest files dropped; `lazy-component` demo omitted (see ❌ table). |

## Host-framework fixes & limitations found during verification

- **vue-lynx core fix — layout-inert anchors** (`0b53124`): Vue renders
  fragment/v-if anchors and empty text vnodes as real elements; zero-size
  flex items still consume CSS `gap` slots, inflating every gap-based
  layout relative to ReactLynx (whose fragments are virtual). Anchors are
  now `display:none` views and empty text nodes stay hidden until they
  receive content.
- **vue-lynx core fix — canonical raw-text encoding** (`0b53124`):
  text content is now a `raw-text` child element (ReactLynx's encoding)
  instead of a `text` attribute, preserving embedded `\n` line breaks on
  Lynx for Web (`recs` demo went from 4.83% pixel diff to 0.00%).
- **Known limitation — `@font-face` in web bundles**: vue-lynx's rspeedy
  0.13 toolchain emits JSON-encoded `.web.bundle` styleInfo whose
  `@font-face` rules land in the lynx-view shadow root, where browsers
  ignore them (upstream's newer binary template encoding hoists fonts to
  the document). Until vue-lynx upgrades its template toolchain, web
  embedders should register icon fonts on the host page (the screenshot
  harness does exactly this); native Lynx is unaffected.

## Open questions / decisions log

- **2026-07-11** Signals: port keeps upstream code shape via a tiny
  `signals.ts` adapter over `@vue/reactivity` (`signal` → `shallowRef`,
  `effect` → reactivity `effect` returning disposer, `batch` → passthrough;
  Vue component updates are scheduler-batched anyway).
- **2026-07-11** Components authored as `h()` render functions in `.ts`
  (no SFCs) so the package builds with plain `tsc` like
  `packages/vue-lynx/internal`, stays diffable against upstream TSX, and
  needs no SFC compile step for consumers.
- **2026-07-11** `@lynx-js/lynx-ui` is React-only; the form-control
  primitives the catalogs use (Input, TextArea, Radio*, Slider*, Dialog*,
  Select*) will be reimplemented minimally in Vue inside the package.
