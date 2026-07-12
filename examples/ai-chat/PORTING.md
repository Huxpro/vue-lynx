# PORTING.md — Nuxt AI Chat → Vue Lynx

Tracks what was **reused** from the original [nuxt-ui-templates/chat](https://github.com/nuxt-ui-templates/chat) (and its SPA sibling [chat-vue](https://github.com/nuxt-ui-templates/chat-vue)) versus **rewritten** for Lynx, and why. Feature-level parity status lives in [PRD.md](./PRD.md); this doc is about *how* each layer was ported.

## Ground rules discovered up front

Why a straight copy is impossible:

1. **No DOM.** Lynx renders native elements (`view`, `text`, `image`, `scroll-view`, `list`, `input`, …), not HTML. Nuxt UI v4 renders HTML through Reka UI primitives (portals, popovers, focus traps) — none of that runs on Lynx. Every `U*` component used by the template must be re-implemented.
2. **No Nuxt.** No auto-imports, no Nitro server in-process, no `useFetch`/`useCookie`/`useAppConfig`/`useOverlay`. Vue 3 itself (Composition API, SFCs, vue-router with memory history, reactivity) works unchanged on Vue Lynx — that's the part we keep.
3. **Dual-thread model.** Vue runs on the background thread; layout/PAPI on the main thread. Browser globals (`window`, `document`, `crypto`, `URL`, `localStorage`) can't be assumed.
4. **The server half must exist somewhere.** The original's Nitro routes + AI SDK `streamText` move to a small standalone Node server, kept API-compatible.

## Layer-by-layer

| Layer | Original | Port | Verdict |
|---|---|---|---|
| Framework | Nuxt 4 (Vue 3) | Vue Lynx (Vue 3) | **Reused** — Vue 3 semantics are the whole point of the port |
| Routing | Nuxt pages (vue-router web history) | vue-router `createMemoryHistory` | **Reused with config change** |
| UI kit | @nuxt/ui v4 (`UDashboard*`, `UChat*`, `UButton`, `UModal`, …) | Hand-built Lynx components mirroring Nuxt UI's rendered look (tokens copied from its theme) | **Rewritten** — DOM-only |
| Chat state | `@ai-sdk/vue` `useChat` + `DefaultChatTransport` | Custom `useChat` composable speaking the same UI-message-stream protocol: SSE on web, cursor polling + explicit cancellation on native | **Rewritten (protocol reused)** — the AI SDK client assumes browser streaming primitives |
| Message model | AI SDK `UIMessage` with typed parts (text/reasoning/tool-*/source-url/file) | Same shapes, local TS types | **Reused (types re-declared)** |
| Markdown | Comark + Shiki (HTML output, streaming highlight) | Custom markdown → Lynx-element renderer (including pipe tables) + tiny code tokenizer | **Rewritten** — HTML output can't be displayed; no `v-html` on Lynx |
| Charts | nuxt-charts (Unovis, SVG) | Line chart generated as an inline SVG string for Lynx's native `<svg>` element; hover tooltip becomes tap-a-column | **Rewritten** — no DOM/Unovis; SVG string generation instead |
| Icons | Iconify (`i-lucide-*`, `i-simple-icons-*`, `i-logos-*`) CSS masks | Same glyphs vendored as inline SVG strings (lucide-static / simple-icons / iconify logos) rendered with `<svg content>`; colors baked per theme | **Adapted** — no CSS mask/iconify runtime, no `currentColor` |
| Animations | motion-v (springs), CSS transitions, View Transitions API | Lynx CSS transitions/animations; View Transitions dropped | **Partially rewritten / dropped** |
| Composables (`useChats` grouping, `useModels`, `useChatActions` flows, greeting logic, `getMergedParts`) | Plain Vue + date-fns | Same code, `useCookie`→storage shim, `$fetch`→`fetch` wrapper, modals via custom overlay | **Mostly reused** — this is framework-agnostic logic |
| Server API (chats/messages/votes/title/visibility CRUD) | Nitro `defineEventHandler` + Drizzle/SQLite | Standalone zero-dependency `node:http` server, same routes/payloads, JSON-file store | **Rewritten thin, shapes reused** |
| AI endpoint | AI SDK `streamText` + gateway + provider/custom tools, `smoothStream`, `stopWhen`, UI-message-stream response | Zero-dependency OpenAI-compatible Gateway adapter for real text/reasoning + `gpt-4.1-nano` titles; deterministic tool-capable mock stream by default | **Protocol adapted / mock added** — provider-defined tools and the multi-step tool loop remain mock-only |
| Serverless demo | n/a (Nitro is always present in a Nuxt app) | In-app fallback backend (`lib/local-backend.ts`): when the API server is unreachable (website `<Go>` playground, LynxExplorer scans, `pnpm dev` without the server) the same seeded data + mock streams run in-memory via `shared/mock-ai.mjs` | **Added** — needed because a Lynx bundle can travel without its server |
| Custom tools (weather, chart) | `tool()` + zod, simulated data | Same logic in mock server | **Reused (ported to plain TS)** |
| Auth | GitHub OAuth via nuxt-auth-utils (popup + cookie session) | Mock session endpoint (demo user), header-token session | **Rewritten (mocked)** — OAuth popups/secrets unsuitable for a Lynx example |
| File uploads | NuxtHub Blob + drag&drop + `<input type=file>` | Demo-image picker (bundled samples), same chip/preview/message UI | **Adapted** — no file picker/DnD in Lynx |
| Persistence of prefs (model, theme) | Cookies | Storage abstraction (web localStorage / in-memory fallback) | **Rewritten** |
| Styling | Tailwind v4 + Nuxt UI theme CSS vars | Tailwind v3 + `@lynx-js/tailwind-preset`, with Nuxt UI's semantic tokens (`text-muted`, `bg-elevated`, `border-default`, …) recreated as `--ui-*` CSS variables + custom utilities, so ported markup keeps its class vocabulary | **Adapted** — original classes mostly survive |

## Decision log

- **2026-07-11** Chose `nuxt-ui-templates/chat` (canonical Nuxt template) as the source of truth; `chat-vue` consulted for de-Nuxtified patterns (shared composables, Nitro-external server, session endpoint).
- **2026-07-11** Server strategy: mock-first (deterministic, offline, screenshot-stable), real AI Gateway passthrough behind `AI_GATEWAY_API_KEY` — mirrors the original's "works on Vercel, key locally" spirit without shipping secrets.
- **2026-07-11** Auth strategy: mock demo-user login to keep every auth-gated surface (user menu, uploads, owner-only actions, greeting) testable in screenshots.
- **2026-07-12** Native streaming strategy: choose poll mode before the generation POST, consume cursor events incrementally, and cancel active server streams explicitly on Stop/unmount.
- **2026-07-12** Parity hardening: enforce globally unique chat ids, remount chat state on route-param navigation, persist color mode, render Markdown tables, and add an example-local regression suite.


## Platform learnings (found while porting, verified on Lynx for Web)

1. **`<textarea>` is unmapped on the web platform.** `LYNX_TAG_TO_HTML_TAG_MAP` in
   `@lynx-js/web-core` has `input` → `x-input` but no `textarea` entry, so `<textarea>` falls
   through as a raw, unwired HTML element. The prompt uses a single-line `<input>` instead
   (PRD F2.2).
2. **`justify-*` utilities are missing from `@lynx-js/tailwind-preset`** (`justifyContent`
   isn't in its core-plugin list, though `alignItems`/`gap`/`grid*` are). Declared manually in
   `App.css`.
3. **SFC `<style>` blocks are scoped per component** through Lynx's `cssId` mechanism even
   without the `scoped` attribute — a class defined in one component's style block does not
   apply to elements of another component. Cross-component classes live in the globally
   imported `App.css`.
4. **Translucent backgrounds don't composite over sibling content** in the Lynx web preview
   (opaque backgrounds paint; `rgba(...)`/alpha-gradient backgrounds on an overlay don't, in
   both headless and headed Chromium, while the same markup outside `lynx-view` paints fine).
   Modal backdrops are approximated by fading the app content (`opacity: 0.4`) behind the
   overlay instead.
5. **`<svg content="...">` renders through a blob-URL `<img>`** (web-elements `XSvg`), so
   `currentColor` never inherits — icon/logo/chart colors are baked into the SVG strings from
   the reactive theme (`useTheme().toneColor`).
6. **Streaming state must mutate reactive proxies, not raw objects.** Pushing a raw object into
   a `ref([])` and then mutating the raw reference bypasses Vue's property-level dependency
   tracking (components freeze mid-stream). `useChat` pushes then reads back
   `messages.value[i]` and mutates the returned proxy.
7. **Cross-origin assets need `Cross-Origin-Resource-Policy: cross-origin`** — the web preview
   page sets `COEP: require-corp`.
8. **Element methods** (`scrollTo` on `scroll-view`) go through template refs:
   `ref.invoke({ method, params }).exec()`, after `await nextTick()` so the main thread has
   applied pending ops.
9. **No viewport media queries.** Responsive behavior (the original's `lg:` breakpoint) is
   re-created by reading the `SystemInfo` global (`pixelWidth / pixelRatio` = logical width —
   web-core populates it from `screen.availWidth * devicePixelRatio`) and branching the layout
   in code (`useViewport`). Detection is startup-only in this example.
10. **Flex `gap` counts zero-size placeholder siblings.** Vue's `v-if`/`v-else-if` chains and
    `v-for` fragments leave empty placeholder nodes (`<text>`/comment anchors) in the DOM. On
    Lynx's web platform these are flex children, so a container's `gap` adds spacing around each
    one — a markdown block list with 5-branch `v-if` chains between items ends up with 2-3× the
    intended spacing. Fix: wrap each item in a single `<view>` (confining its internal chain)
    and space with per-item `margin-top` keyed on the loop index (`bi > 0`), not container
    `gap` (which would still space around the `v-for` anchors). See `MarkdownView.vue` /
    `MessageContent.vue`.
11. **`fetch` must be `globalThis.fetch`** — the web platform's runtime wrapper shadows the
   `fetch` binding with an undefined parameter (known repo convention, applies here too).
12. **Choose the stream transport before sending a mutating request.** A non-streaming native
    `fetch` buffers an SSE response, so probing with a normal generation POST either loses
    incremental rendering or risks a second generation. Native now starts `?mode=poll` directly.
13. **Vue Router reuses route components when only params change.** The root keys `RouterView`
    by `route.fullPath`, and `ChatPage` aborts its stream on unmount, so `/chat/a` → `/chat/b`
    cannot retain or mutate the first chat's state.
