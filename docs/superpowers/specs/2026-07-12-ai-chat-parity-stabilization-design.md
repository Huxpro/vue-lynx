# AI Chat Parity Stabilization Design

## Objective

Bring the `examples/ai-chat` application as close as practical to the Nuxt AI Chat template's behavior while preserving the Vue Lynx example's offline-first, zero-runtime-dependency architecture. Resolve every high-confidence review finding, add durable regression coverage, and make the PRD accurately distinguish implemented parity from genuine platform adaptations.

## Scope

This pass covers five confirmed gaps and a bounded audit of adjacent PRD claims:

1. Prevent cross-session chat ID collisions and destructive ownership bypasses.
2. Reload all chat-scoped state when navigating between `/chat/:id` routes.
3. Provide incremental native streaming through an explicit polling transport without issuing duplicate generation requests.
4. Persist light/dark mode using the existing storage abstraction.
5. Parse and render GitHub-style pipe tables with native Lynx nodes.
6. Check every completed PRD row against the implementation and either close concrete gaps in the touched subsystems or correct claims that describe behavior the example cannot provide.

The pass does not replace the custom Lynx UI with Nuxt UI, add browser-only APIs to native Lynx, or introduce the Vercel AI SDK as a runtime dependency. Those changes would defeat the example's purpose and offline behavior.

## Architecture

### Regression test boundary

Add an example-local Vitest configuration and tests under `examples/ai-chat/tests`. Pure modules such as Markdown parsing, transport selection, and storage-backed state are tested directly. Server ownership behavior is tested through a spawned server process and real HTTP requests so the test covers routing, persistence, and destructive operations together. Route behavior is tested through Vue Router plus a small routed component or by extracting the chat-load lifecycle into a directly testable unit if the custom renderer makes full page mounting impractical.

### Chat identity and ownership

Client-provided IDs remain supported because the home page creates an ID before navigation, but the server must enforce global uniqueness. `POST /api/chats` returns HTTP 409 for an existing ID. The in-app fallback mirrors this rule. Message and vote operations remain keyed by chat ID, which becomes safe once that ID is globally unique. Server tests cover same-session and cross-session collisions and prove that one session cannot delete another session's chat.

### Route lifecycle

Chat page instances must not retain state across parameter-only navigation. `App.vue` keys `RouterView` by the current full path, forcing `ChatPage` to unmount, abort its active stream, and recreate all chat-scoped composables for the new ID. `ChatPage` also stops generation during unmount so a replaced page cannot keep mutating shared state.

### Streaming transport

Transport is selected before the generation POST:

- Web or explicitly enabled standard streaming fetch uses the SSE endpoint and `ReadableStream` reader.
- Native/non-streaming fetch starts generation once with `?mode=poll`, then polls `/api/stream/:id` incrementally.
- The poll start response and each poll response are checked for HTTP errors.
- Abort stops polling immediately and requests server cancellation where feasible.

The selection logic is isolated in a pure helper so native, web, and override cases are deterministic in tests. The in-app fallback continues to stream locally without HTTP.

### Persistent color mode

`useColorMode` initializes from `lib/storage.ts`, validates stored values, and watches changes back into storage. A storage test seam allows tests to reset or substitute storage without exposing production-only component APIs. Web persists through `localStorage`; native retains the documented in-memory fallback unless a host storage module is available.

### Markdown tables

Extend the Markdown AST with a table block containing aligned headers and rows. The parser recognizes a header row only when followed by a valid delimiter row, supports optional outer pipes, escaped pipes, inline tokens in cells, and left/center/right alignment markers. Streaming or malformed tables degrade to paragraphs rather than disappearing. `MarkdownView.vue` renders a horizontally scrollable native table approximation with fixed cell padding, header emphasis, borders, and per-column alignment.

### Parity documentation

After behavior is verified, update `PRD.md`, `PORTING.md`, the example README, and website guides to describe the actual transport, persistence, Markdown table support, chart implementation, real-AI limitations, and platform adaptations. A completed checkbox must correspond to implementation plus evidence; otherwise it is marked adapted, partial, or skipped with a reason.

## Error handling

- Duplicate chat IDs return a structured 409 response and never mutate storage.
- Poll start/read failures surface the server message through the existing chat error state.
- Route changes abort the prior stream and ignore stale load results.
- Invalid persisted color-mode values fall back to `light`.
- Malformed Markdown tables fall back to ordinary paragraph rendering.

## Verification

Completion requires all of the following:

1. New regression tests are observed failing on the PR head before production edits.
2. The same regression tests pass after each minimal fix.
3. Existing repository tests, lint, and the AI chat build pass from a clean dependency installation.
4. A live server integration test proves cross-session collision attempts return 409 and the victim chat remains.
5. Transport tests prove native chooses one poll-mode POST and emits incremental chunks, while web chooses one SSE POST.
6. Markdown tests cover aligned tables, inline formatting, escaped pipes, and malformed fallback.
7. A route test proves changing only `:id` loads the second chat and no mutations target the first.
8. The final PRD audit contains no checked claim contradicted by inspected code or test evidence.

## Non-goals and residual platform limitations

Native Lynx still cannot provide browser tabs, browser clipboard, drag-and-drop uploads, browser history, DOM-based Shiki/Comark rendering, or Nuxt's OAuth popup without host integrations. These remain explicit adaptations rather than silently simulated parity. The goal is honest functional parity within the Lynx runtime, not browser API emulation.
