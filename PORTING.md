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
| catalog manifests (extractor JSON output) | ⬜ | reuse upstream-published manifests (extractor not ported, see below) |
| styles (`a2ui/styles/**`) | ✅ | copied verbatim to `packages/genui/styles/a2ui` |

### A2UI prompt (`a2ui-prompt`)

| Module | Status | Notes |
| ------ | ------ | ----- |
| `buildA2UISystemPrompt` etc. | ⬜ | framework-agnostic, copy |

## OpenUI

### Core (`openui/src/core` → `src/openui/core`)

| Module                | Status | Notes |
| --------------------- | ------ | ----- |
| `library.tsx`         | ⬜     | `ComponentRenderer` = Vue component type |
| `context.tsx`         | ⬜     | provide/inject + composables |
| `renderer.tsx`        | ⬜     | `OpenUiRenderer` (runtime + parsed modes), `renderDeep` |
| `hooks/useOpenUIState.ts` | ⬜ | central state composable |
| `hooks/useFormValidation.ts` | ⬜ | |
| `hooks/useStateField.ts` | ⬜  | |
| `runtime/reactive.ts` | ⬜     | framework-agnostic (zod marking), verbatim |
| `utils.ts`            | ⬜     | verbatim |
| `openui-prompt/`      | ⬜     | framework-agnostic, verbatim |
| `renderer.css` + `styles/**` | ⬜ | copy verbatim |

### Catalog components (`openui/src/catalog` → `src/openui/catalog`)

| Component    | Status | Component    | Status |
| ------------ | ------ | ------------ | ------ |
| Action       | ⬜     | List         | ⬜     |
| AudioPlayer  | ⬜     | Loading      | ⬜     |
| Button       | ⬜     | Modal        | ⬜     |
| Card         | ⬜     | RadioGroup   | ⬜     |
| CardHeader   | ⬜     | Row          | ⬜     |
| CheckBox     | ⬜     | Separator    | ⬜     |
| ChoicePicker | ⬜     | Slider       | ⬜     |
| Column       | ⬜     | Stack        | ⬜     |
| DateTimeInput| ⬜     | Tabs         | ⬜     |
| Divider      | ⬜     | Tag          | ⬜     |
| Icon         | ⬜     | Text         | ⬜     |
| Image        | ⬜     | TextContent  | ⬜     |
|              |        | TextField    | ⬜     |
|              |        | Video        | ⬜     |

## Examples (upstream `playground/lynx-src` → `examples/genui`)

| Demo                        | Status | Notes |
| --------------------------- | ------ | ----- |
| A2UI demo app (`lynx-src/a2ui`) | ⬜ | gallery of mock A2UI streams |
| OpenUI demo app (`lynx-src/openui`) | ⬜ | mock OpenUI scenarios |
| A2UI lazy component demo    | ⬜     | depends on LazyComponent port |
| Mock data (`a2ui-gallery/*.json`, `basic/*.json`, `openui-scenarios.ts`, `io-mock/mockAgent.ts`) | ⬜ | copy verbatim |

## Tests (upstream `a2ui/test`, `openui` tests → `packages/genui/test`)

| Suite | Status |
| ----- | ------ |
| store: messageStore / processor / payloadNormalizer / resolveDynamic / functionRegistry / executeFunctionCall / createResource / basicFunctions / defineCatalogFunctions | ⬜ |
| components: catalog / choicePicker / dateTimeInput / slider / textField / formContext / useDataBinding / snapshot | ⬜ |
| openui: `playground/src/catalog/openui.test.ts` | ⬜ |

## Verification (Lynx for Web screenshot comparison)

| Item | Status | Notes |
| ---- | ------ | ----- |
| Reference build of upstream ReactLynx demos (npm `@lynx-js/genui`) | ⬜ | standalone rspeedy app in scratchpad |
| Vue examples web build | ⬜ | |
| Playwright screenshot harness (`lynx-view` embedding) | ⬜ | |
| Side-by-side comparisons per demo | ⬜ | artifacts kept under `plans/genui-screenshots/` (not committed) or artifact page |

## ❌ Not ported (with reasons)

| Upstream module | Reason |
| --------------- | ------ |
| `cli/` (`genui` CLI) | Build-time Node tooling that orchestrates the catalog extractor and prompt generation for **React TSX** sources; not Vue-specific value. Prompt generation is ported as library functions; extraction of Vue SFC/TS props schemas would be a new tool, not a port. Upstream CLI remains usable for schema/prompt artifacts. |
| `a2ui-catalog-extractor/` | Parses **React/TSX interfaces** (`@a2uiCatalog` JSDoc tags) with ts-morph to emit JSON manifests. The Vue port reuses the upstream-published manifests for built-in components; a Vue-aware extractor is out of scope (new tool, not a port). |
| `server/` | Framework-agnostic Node agent server (Anthropic/OpenAI streaming). No UI code; usable as-is from upstream — nothing Vue-specific to port. Examples use mock streams instead. |
| `ui-judge/` | Dev-only LLM screenshot-judging harness for upstream CI. Not part of the shipped library. |
| `playground/src` (web playground React DOM app) | A full React **web** (non-Lynx) IDE-style playground. Porting a React DOM app to Vue DOM is unrelated to Vue Lynx; the Lynx demos it hosts (`lynx-src/`) are ported as examples instead. |

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
