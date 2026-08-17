# AI Chat — Vue Lynx port of the Nuxt AI Chatbot template

A full-featured AI chatbot example for **Vue Lynx**, ported feature-by-feature from the official
[Nuxt AI Chatbot template](https://github.com/nuxt-ui-templates/chat) (Nuxt UI + AI SDK):
streaming responses with thinking/reasoning, markdown with highlighted code blocks and tables, weather/chart
tool-call cards, web-search sources, chat history with date grouping, rename/delete/share flows,
votes, message editing, model picker, runtime theme picker, light/dark mode, attachments, and a
command-palette search.

- [PRD.md](./PRD.md) — the complete feature inventory with port/adapt/skip status per feature
- [PORTING.md](./PORTING.md) — what was reused vs rewritten, and why
- [screenshots/](./screenshots) — Lynx for Web captures side-by-side with the original

## Running

Two processes: the Lynx app (rspeedy) and a small standalone API server that reimplements the
original's Nitro routes (chats/messages/votes CRUD + AI SDK UI-message-stream SSE).

```bash
pnpm install

# 1. API server on :3210 (offline deterministic mock AI by default)
pnpm dev:server

# 2. Lynx dev server on :3000
pnpm dev
```

Then open the printed **Web Preview** URL (`/__web_preview?casename=main.web.bundle`) in a
browser, or scan the QR code with LynxExplorer (edit `src/lib/config.ts` to point `API_BASE`
at your machine's LAN address for devices).

No server? No problem — the app probes for the API server on startup and falls back to an
**in-app demo backend** (same seeded history, same deterministic mock streams, in-memory only).
That's what powers the [website playground](https://vue.lynxjs.org/guide/ai-chat) and bundles
scanned straight off it.

### Real models

The mock server answers offline with deterministic streams (including simulated weather/chart/
web-search tool calls). To chat with real models through the
[Vercel AI Gateway](https://vercel.com/docs/ai-gateway) — the same gateway the original uses:

```bash
AI_GATEWAY_API_KEY=... pnpm dev:server
```

Text and reasoning stream from the selected model (Claude Haiku 4.5, Gemini 3 Flash, GPT-5 Nano);
first-turn titles use GPT-4.1 Nano, while provider/custom tool-call cards remain mock-only in the
zero-dependency Gateway adapter.

### Useful env vars

| Var | Effect |
| --- | ------ |
| `AI_GATEWAY_API_KEY` | Stream real model responses via the Vercel AI Gateway |
| `FAST_MOCK=1` | Instant mock streams (useful for tests/screenshots) |
| `PORT` | API server port (default 3210) |
| `AI_CHAT_DATA_DIR` | Override the JSON store directory (used by isolated tests) |

### Regression tests

```bash
pnpm test
```

The suite covers server ownership and stream cancellation, native polling versus web SSE,
route teardown, persisted color mode, Markdown tables, Gateway title generation, fuzzy search,
and file-type icon mapping.
