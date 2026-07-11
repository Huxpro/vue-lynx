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
| Chat state | `@ai-sdk/vue` `useChat` + `DefaultChatTransport` | Custom `useChat` composable speaking the same UI-message-stream SSE protocol | **Rewritten (protocol reused)** — the AI SDK client assumes browser `fetch`/`ReadableStream`/`TextDecoderStream` |
| Message model | AI SDK `UIMessage` with typed parts (text/reasoning/tool-*/source-url/file) | Same shapes, local TS types | **Reused (types re-declared)** |
| Markdown | Comark + Shiki (HTML output, streaming highlight) | Custom markdown → Lynx-element renderer + tiny code tokenizer | **Rewritten** — HTML output can't be displayed; no `v-html` on Lynx |
| Charts | nuxt-charts (Unovis, SVG) | Custom `view`-based line chart | **Rewritten** — no SVG/canvas elements |
| Icons | Iconify (`i-lucide-*`, `i-simple-icons-*`, `i-logos-*`) CSS masks | Same glyphs exported to inline base64 data-URI images at build time | **Adapted** — no CSS mask/iconify runtime |
| Animations | motion-v (springs), CSS transitions, View Transitions API | Lynx CSS transitions/animations; View Transitions dropped | **Partially rewritten / dropped** |
| Composables (`useChats` grouping, `useModels`, `useChatActions` flows, greeting logic, `getMergedParts`) | Plain Vue + date-fns | Same code, `useCookie`→storage shim, `$fetch`→`fetch` wrapper, modals via custom overlay | **Mostly reused** — this is framework-agnostic logic |
| Server API (chats/messages/votes/title/visibility CRUD) | Nitro `defineEventHandler` + Drizzle/SQLite | Standalone Node (h3) server, same routes/payloads, JSON-file store | **Rewritten thin, shapes reused** |
| AI endpoint | AI SDK `streamText` + gateway + provider tools, `smoothStream`, `stopWhen`, UI-message-stream response | Same in "real" mode; deterministic mock stream generator by default (offline + reproducible screenshots) | **Reused in real mode / mock added** |
| Custom tools (weather, chart) | `tool()` + zod, simulated data | Same logic in mock server | **Reused (ported to plain TS)** |
| Auth | GitHub OAuth via nuxt-auth-utils (popup + cookie session) | Mock session endpoint (demo user), header-token session | **Rewritten (mocked)** — OAuth popups/secrets unsuitable for a Lynx example |
| File uploads | NuxtHub Blob + drag&drop + `<input type=file>` | Demo-image picker (bundled samples), same chip/preview/message UI | **Adapted** — no file picker/DnD in Lynx |
| Persistence of prefs (model, theme) | Cookies | Storage abstraction (web localStorage / in-memory fallback) | **Rewritten** |
| Styling | Tailwind v4 + Nuxt UI theme CSS vars | (decision pending first build: repo has a tailwind preset for Lynx — evaluate `examples/tailwindcss` conventions; otherwise plain CSS with copied token values) | TBD this loop |

## Decision log

- **2026-07-11** Chose `nuxt-ui-templates/chat` (canonical Nuxt template) as the source of truth; `chat-vue` consulted for de-Nuxtified patterns (shared composables, Nitro-external server, session endpoint).
- **2026-07-11** Server strategy: mock-first (deterministic, offline, screenshot-stable), real AI Gateway passthrough behind `AI_GATEWAY_API_KEY` — mirrors the original's "works on Vercel, key locally" spirit without shipping secrets.
- **2026-07-11** Auth strategy: mock demo-user login to keep every auth-gated surface (user menu, uploads, owner-only actions, greeting) testable in screenshots.
