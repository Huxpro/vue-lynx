# PRD — Porting the Nuxt AI Chat Template to Vue Lynx

**Source:** [nuxt-ui-templates/chat](https://github.com/nuxt-ui-templates/chat) (live demo: <https://chat-template.nuxt.dev/>)
**Reference:** [nuxt-ui-templates/chat-vue](https://github.com/nuxt-ui-templates/chat-vue) (same app as a plain Vue SPA — useful for de-Nuxtification patterns)
**Target:** `examples/ai-chat` — a Vue Lynx example app, verified on Lynx for Web with screenshot comparisons against the original.

## Goal

Full feature parity with the Nuxt AI Chat template, except where a feature is impossible or unsuitable for Lynx — those are explicitly marked below with reasons. Companion doc: [PORTING.md](./PORTING.md) tracks what was reused vs rewritten.

## Architecture of the port

The original is a Nuxt 4 full-stack app: Nuxt UI components, AI SDK v5 (`@ai-sdk/vue` `useChat` + UI message streams), Nitro server API (chats/messages/votes CRUD + `streamText` AI endpoint), SQLite/Drizzle persistence, GitHub OAuth.

The port splits into:

- **Client** (`src/`): Vue Lynx app. Nuxt UI components don't run on Lynx (they render DOM/Reka UI) so every component is re-implemented with Lynx elements (`view`/`text`/`image`/`scroll-view`/`list`/`input`…) while keeping the original's visual design, data model (AI SDK `UIMessage` parts), and component/composables structure.
- **Server** (`server/`): a small standalone Node server that reimplements the original's Nitro API routes (same paths, same JSON shapes, same AI SDK UI-message-stream SSE protocol). It runs in **mock mode** by default (deterministic simulated streaming — text, reasoning, weather/chart/web-search tool calls) so the example works offline and screenshots are reproducible; with `AI_GATEWAY_API_KEY` it proxies real models like the original.
- **Chat transport**: `@ai-sdk/vue`'s `useChat` depends on browser APIs; replaced by a small `useChat` composable speaking the same UI-message-stream protocol over Lynx `fetch` (streaming reads on Lynx for Web; incremental polling fallback where `ReadableStream` is unavailable on native).

## Feature inventory & parity status

Legend: **Port** = same behavior re-implemented • **Adapt** = same intent, Lynx-appropriate mechanics • **Skip** = not ported (reason given). Status: ☐ todo / ☑ done.

### F1 — App shell & navigation

| # | Feature (original) | Decision | Status | Notes |
|---|---|---|---|---|
| F1.1 | Sidebar with Nuxt logo + "Chat" wordmark | Port | ☑ | Logo redrawn as an inline SVG string for Lynx's `<svg content>` element |
| F1.2a | Sidebar collapse/expand toggle | Port | ☑ | Toggle button; animated width |
| F1.2b | Sidebar drag-to-resize | **Skip** | — | Pointer-drag panel resizing is a desktop-web affordance; no drag-resize convention or cursor feedback on Lynx |
| F1.3 | "New chat" nav item | Port | ☑ | |
| F1.4 | "Search" nav item → command palette | Adapt | ☑ | Opens search overlay (F4.5); no ⌘K chord |
| F1.5 | History grouped by date (Today/Yesterday/Last week/Last month/per-month) | Port | ☑ | `useChats` grouping logic reused nearly verbatim |
| F1.6 | Per-chat hover dropdown (Rename/Delete) | Adapt | ☑ | No `:hover` on touch — actions revealed by ellipsis button per row |
| F1.7 | Sidebar footer: Login button / user menu | Adapt | ☑ | See F5 |
| F1.8 | Keyboard shortcuts (⌘O new chat, ⌘K search, kbd hints) | **Skip** | — | No hardware-keyboard/`defineShortcuts` equivalent in Lynx; touch-first UI. Kbd hint chips also skipped |
| F1.9 | Routing `/` ↔ `/chat/:id` | Adapt | ☑ | vue-router with `createMemoryHistory()` (Lynx has no History API) |
| F1.10 | Responsive layout (`lg:` breakpoint): full-bleed panel + hamburger + slide-over sidebar on mobile | Adapt | ☑ | No CSS media queries on Lynx — branches on `SystemInfo.pixelWidth/pixelRatio` at startup (rotation/resize re-detection out of scope); verified at 390×844 with comparison pairs |

### F2 — Home page

| # | Feature | Decision | Status | Notes |
|---|---|---|---|---|
| F2.1 | Time-of-day greeting + user first name | Port | ☑ | |
| F2.2 | Prompt textarea (auto-grow, submit) | Adapt | ☑ | Single-line Lynx `input` (the `textarea` tag is unmapped on the web platform); send via button or keyboard confirm |
| F2.3 | Quick-chat suggestion pills with brand icons | Port | ☑ | Icon glyphs vendored as inline SVG strings (no Iconify runtime) |
| F2.4 | Model select in prompt footer | Adapt | ☑ | Action-sheet style picker (no Reka select menu) |
| F2.5 | File upload button (auth-gated tooltip) | Adapt | ☑ | See F8 |
| F2.6 | Create chat (POST /api/chats) → navigate | Port | ☑ | |

### F3 — Chat page

| # | Feature | Decision | Status | Notes |
|---|---|---|---|---|
| F3.1 | Load chat by id; 404 "Chat not found" view | Port | ☑ | |
| F3.2 | Message list with auto-scroll while streaming | Adapt | ☑ | `scroll-view` + `scrollTo` on updates; pinned-to-bottom heuristic |
| F3.3 | User bubble vs assistant plain-text layout | Port | ☑ | |
| F3.4 | "Thinking…" indicator: agent spinner + text shimmer | Port | ☑ | Uses the vendored `dots2` Vue Lynx spinner while preserving the original submitted-to-first-assistant-part lifetime and “Thinking…” shimmer |
| F3.5 | Streaming AI responses (AI SDK UI message stream) | Adapt | ☑ | Custom `useChat` over the same protocol; true SSE streaming on Lynx for Web, incremental cursor polling selected before generation on native |
| F3.6 | Markdown rendering + streaming code highlighting (Comark/Shiki) | Adapt | ☑ | No DOM/HTML: custom markdown → Lynx-node renderer (headings, bold/italic/inline code, code blocks, lists, links, blockquote, hr, tables). Shiki dropped → lightweight token highlighter for code blocks |
| F3.7 | Reasoning part: collapsible "Thinking" section | Port | ☑ | |
| F3.8 | Weather tool card (gradient, current conditions, 5-day forecast) | Port | ☑ | Linear-gradient bg, lucide icons inlined |
| F3.9 | Line chart tool (nuxt-charts/Unovis, tooltip, legend, dot pattern) | Adapt | ☑ | Unovis is DOM-bound, so the chart is generated as an inline SVG string for Lynx's `<svg content>` element; hover tooltip → tap-a-column tooltip |
| F3.10 | Web search tool: "Searching the web…" + collapsible sources with favicons | Port | ☑ | Favicons via Google s2 favicon service (network image) |
| F3.11 | Assistant actions: copy / 👍 / 👎 / regenerate | Port / Adapt | ☑ | Copy adapts per platform (web clipboard; no-op toast on native — no clipboard module in explorer) |
| F3.12 | User actions: timestamp + edit | Port | ☑ | |
| F3.13 | Edit message → truncate history + resend | Port | ☑ | |
| F3.14 | Votes persisted, optimistic update + rollback | Port | ☑ | |
| F3.15 | Prompt error state; Stop / Reload buttons | Port | ☑ | |
| F3.16 | Sticky bottom prompt | Port | ☑ | Fixed footer outside scroll area (Lynx layout) |
| F3.17 | Auto-generated title appears after first response | Port | ☑ | |
| F3.18 | Share/visibility modal (private/public, copy link) | Port / Adapt | ☑ | Full modal; "copy link" copies demo URL (web clipboard; toast on native) |
| F3.19 | Auto-regenerate when arriving with 1 message | Port | ☑ | |
| F3.20 | Navbar chat-title dropdown (Rename/Delete) | Port | ☑ | |
| F3.21 | Read-only view for non-owner (shared chats) | Port | ☑ | Toggleable via visibility modal + mock session |
| F3.22 | Toast on stream error (parsed message) | Port | ☑ | |

### F4 — Global chrome & theming

| # | Feature | Decision | Status | Notes |
|---|---|---|---|---|
| F4.1 | Light/dark color-mode toggle | Adapt | ☑ | Theme state + CSS-variable-driven tokens; persisted through localStorage on web and the in-memory storage fallback on native |
| F4.2 | Design tokens: Public Sans, zinc neutrals, blue primary, radius, ring/borders | Port | ☑ | Token values copied from Nuxt UI theme output |
| F4.3 | Toasts (top-right) | Port | ☑ | Custom toaster overlay |
| F4.4 | Modals: Rename (input) + Delete confirm | Port | ☑ | Custom modal overlay |
| F4.5 | Command palette search (chats + "New chat") | Adapt | ☑ | Full-screen search overlay with fuzzy filter; no kbd navigation |
| F4.6 | User menu: avatar, theme color pickers (17 primary / 5 neutral), appearance, template links, docs links, logout | Port / Adapt | ☑ | Nested dropdown → sectioned sheet; external template/docs links **skipped** (no browser to open on native; noted inline) |
| F4.7 | Nuxt page-loading indicator bar | **Skip** | — | Memory-router navigations are synchronous; nothing to indicate |
| F4.8 | View Transitions (`view-transition-name: chat-prompt` morph) | **Skip** | — | View Transitions API is a browser feature; not in Lynx |
| F4.9 | Error page (`UError`, SEO meta) | Adapt | ☑ | In-app 404 view (F3.1); SEO/meta not applicable |

### F5 — Authentication

| # | Feature | Decision | Status | Notes |
|---|---|---|---|---|
| F5.1 | GitHub OAuth popup login (`nuxt-auth-utils`) | **Adapt (mock)** | ☑ | `window.open` popup + real OAuth secrets are impossible/unsuitable in a Lynx example. Server provides a mock session endpoint; "Login" signs in a demo user so all auth-gated UI (user menu, uploads, greeting name) stays exercised |
| F5.2 | Anonymous guest session (chats saved per session) | Port | ☑ | Server session id via header instead of cookie |
| F5.3 | Logout | Port | ☑ | |

### F6 — Persistence & data

| # | Feature | Decision | Status | Notes |
|---|---|---|---|---|
| F6.1 | Chats + messages CRUD (SQLite/Drizzle) | Adapt | ☑ | Example server keeps a JSON-file store (same schema shape); DB engine is server-internal, not user-visible |
| F6.2 | Votes table + GET/POST | Port | ☑ | |
| F6.3 | Title PATCH / visibility PATCH / chat DELETE / messages DELETE (edit & regenerate) | Port | ☑ | Same routes & payloads |
| F6.4 | Selected model persisted (cookie) | Adapt | ☑ | Persisted via the storage abstraction (localStorage on web; in-memory fallback on native) |
| F6.5 | Prefetch first 10 chats after load | **Skip** | — | Prefetch warms the browser HTTP cache; Lynx fetch has no HTTP cache to warm |
| F6.6 | CSRF protection (nuxt-csurf) | **Skip** | — | Cookie-session CSRF doesn't apply to the example's header-token sessions; server is a local demo |

### F7 — AI integration

| # | Feature | Decision | Status | Notes |
|---|---|---|---|---|
| F7.1 | AI SDK v5 UI-message-stream protocol (SSE parts: text/reasoning/tool/source) | Port | ☑ | Server emits the same chunk protocol; client parses it |
| F7.2 | 3 models via Vercel AI Gateway (Claude Haiku 4.5, Gemini 3 Flash, GPT-5 Nano) | Port | ☑ | Mock mode simulates per-model responses; real mode streams text/reasoning via the gateway with `AI_GATEWAY_API_KEY` (custom tools remain mock-only) |
| F7.3 | Thinking/reasoning streaming | Port | ☑ | |
| F7.4 | Provider web-search tool with sources | **Adapt (mock)** | ☑ | Mock mode emits provider-compatible search/tool/source parts; the zero-dependency real Gateway adapter streams text/reasoning only and does not expose provider-defined tools |
| F7.5 | Weather + chart custom tools (simulated data, 1.5s delay) | Port | ☑ | Same zod-ish schemas & fake data generators |
| F7.6 | `smoothStream` word-chunked streaming | Port | ☑ | Word-level chunking in mock stream |
| F7.7 | Stop / abort streaming (incl. server abort on disconnect) | Port | ☑ | SSE aborts on disconnect; native polling sends `DELETE /api/stream/:id` and cancels the server generation |
| F7.8 | Title generation via `gpt-4.1-nano` | Adapt | ☑ | Real Gateway mode uses `openai/gpt-4.1-nano`; offline/mock mode derives the same short plain title deterministically |
| F7.9 | System prompt rules (no-headings etc.), stopWhen 5 steps | Adapt | ☑ | Formatting/system rules are copied in real mode; mock scripts are finite, while the zero-dependency real adapter has no tool loop to apply `stopWhen` to |

### F8 — File attachments

| # | Feature | Decision | Status | Notes |
|---|---|---|---|---|
| F8.1 | Drag & drop upload + animated overlay (motion-v) | **Skip** | — | No drag-and-drop events or file-system drops in Lynx (touch surfaces) |
| F8.2 | File picker upload to blob storage | **Adapt (demo picker)** | ☑ | Lynx has no `<input type=file>`/picker API. Paperclip opens a sample-image picker (bundled demo images served by the example server) so chips/uploads/message-attachment UI stay exercised |
| F8.3 | File chips in prompt (status: uploading/error, remove) | Port | ☑ | |
| F8.4 | Attachments rendered on user messages | Port | ☑ | |
| F8.5 | Image zoom lightbox (Teleport + spring animation) | Adapt | ☑ | Fullscreen root overlay; Teleport and the spring transition are dropped |
| F8.6 | File-type icons (pdf/csv/etc.) | Port | ☑ | Media type/extension mapping selects document, spreadsheet, or generic file glyphs |

### F9 — Not applicable to a Lynx example

| # | Feature | Reason |
|---|---|---|
| F9.1 | SEO meta / OG images / favicon / `useHead` | No document head in Lynx |
| F9.2 | Nuxt DevTools, ESLint config, Renovate, CI, deploy-to-Vercel | Template repo infra, not app features |
| F9.3 | Turso/Vercel Blob production drivers | Hosting concerns; example server is local |
| F9.4 | OpenAPI route meta (`nitro.experimental.openAPI`) | Nitro-specific nicety |

## Verification plan — executed ✅

1. `pnpm dev:server` (mock mode) + `pnpm dev` → Lynx for Web bundle driven headlessly in Chromium (Playwright).
2. **Original captured from the live demo** (chat-template.nuxt.dev, real Nuxt app + real models), driven through a curl-backed request bridge (the sandbox's proxy resets Chromium's CONNECT).
3. Ten side-by-side pairs checked into [`screenshots/`](./screenshots/COMPARISON.md): home light/dark, weather tool, chart, markdown+code, search palette, web-search sources, share modal, model select, collapsed sidebar.
4. Additionally verified on Lynx for Web (not paired): login/session flows, attachments (picker → chip → message thumbnail → lightbox), votes (active state + persistence), rename modal, delete confirm + toast, message edit, theme picker application (primary/neutral swatches re-theme the app at runtime), stop/reload prompt states, 404 view.
5. Regression suite (`pnpm test` in this example): cross-session ownership, route teardown, SSE/native poll transport and cancellation, color-mode persistence, Markdown tables, real-mode title generation, fuzzy search, and file-type glyph mapping.

## Loop cadence

Every loop: implement → verify on Lynx for Web → update Status boxes here → update PORTING.md → commit to `claude/nuxt-chat-template-lynx-port-phig8v`. Final state: **65 features ported/adapted, 10 explicitly skipped with reasons** (see tables above).
