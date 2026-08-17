# AI Chat Parity Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all five PR review findings and close or accurately document adjacent AI Chat parity gaps with executable regression coverage.

**Architecture:** Add an example-local Vitest suite, isolate transport decisions and Markdown parsing as pure code, verify the Node server through real HTTP, and force route-scoped state to be recreated on parameter navigation. Preserve the zero-runtime-dependency/offline architecture while making the PRD evidence-based.

**Tech Stack:** Vue Lynx, Vue Router, TypeScript, Node `http`, Vitest 3, jsdom, pnpm.

---

### Task 1: Establish the example-local regression harness

**Files:**
- Modify: `examples/ai-chat/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `examples/ai-chat/vitest.config.ts`
- Create: `examples/ai-chat/tests/setup.ts`

- [ ] **Step 1: Add a deliberately failing smoke test**

Create `examples/ai-chat/tests/harness.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('ai-chat test harness', () => {
  it('runs the example-local suite', () => {
    expect('harness').toBe('ready');
  });
});
```

Before dependencies/config exist, run `pnpm --filter @vue-lynx-example/ai-chat test`. Expected: failure because the script or Vitest binary is unavailable.

- [ ] **Step 2: Add test dependencies and configuration**

Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts. Add `vitest`, `jsdom`, `@lynx-js/testing-environment`, and `vue-lynx-testing-library` as dev dependencies using existing workspace-compatible versions. Configure jsdom, globals, the Vue Lynx source aliases used by `packages/testing-library/vitest.config.ts`, and `tests/setup.ts`.

- [ ] **Step 3: Install and verify the harness**

Run `pnpm install --frozen-lockfile=false`, then `pnpm --filter @vue-lynx-example/ai-chat test`. Expected: one passing smoke test with no warnings.

### Task 2: Enforce globally unique chat IDs

**Files:**
- Create: `examples/ai-chat/tests/server-ownership.test.ts`
- Modify: `examples/ai-chat/server/index.mjs:394-416`
- Modify: `examples/ai-chat/src/lib/local-backend.ts:97-116`

- [ ] **Step 1: Write failing server collision tests**

Spawn `server/index.mjs` with a temporary `PORT` and isolated `AI_CHAT_DATA_DIR`. Use real fetch requests with `x-session-id` headers to assert:

```ts
expect(first.status).toBe(200);
expect(collision.status).toBe(409);
expect(await victimChat(victimId)).not.toBeNull();
expect(await attackerDelete(victimId)).toMatchObject({ status: 404 });
expect(await victimChat(victimId)).not.toBeNull();
```

Run only this file. Expected: collision currently returns 200 and attacker deletion removes the victim chat.

- [ ] **Step 2: Add server uniqueness enforcement**

Before inserting a chat:

```js
if (db.chats.some((chat) => chat.id === id)) {
  return json(res, 409, { message: 'Chat id already exists' });
}
```

Allow `AI_CHAT_DATA_DIR` to override `.data` so tests never touch developer state.

- [ ] **Step 3: Mirror the rule in the local backend**

Before `chats.push(chat)`:

```ts
if (chats.some((existing) => existing.id === chat.id)) {
  throw Object.assign(new Error('Chat id already exists'), { status: 409 });
}
```

- [ ] **Step 4: Verify collision tests pass**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- server-ownership.test.ts`. Expected: all server ownership tests pass.

### Task 3: Recreate chat-scoped state on route changes

**Files:**
- Create: `examples/ai-chat/tests/route-lifecycle.test.ts`
- Modify: `examples/ai-chat/src/App.vue:39-63`
- Modify: `examples/ai-chat/src/pages/ChatPage.vue:1-150`

- [ ] **Step 1: Write a failing parameter-navigation test**

Mount a memory router whose `/chat/:id` component increments mount/unmount counters and is rendered through the same keyed `RouterView` shape as `App.vue`. Navigate `/chat/one` then `/chat/two` and assert:

```ts
expect(mounts).toEqual(['one', 'two']);
expect(unmounts).toEqual(['one']);
```

Also add a source-level page assertion that `ChatPage` stops an active stream during unmount. Run the test and observe the current unkeyed view fail to remount.

- [ ] **Step 2: Key the routed page and stop generation on teardown**

Use:

```vue
<RouterView :key="$route.fullPath" />
```

and in `ChatPage.vue`:

```ts
onUnmounted(stop);
```

- [ ] **Step 3: Verify route lifecycle test passes**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- route-lifecycle.test.ts`. Expected: parameter navigation remounts the page and teardown abort is registered.

### Task 4: Select native polling before generation starts

**Files:**
- Create: `examples/ai-chat/src/lib/stream-transport.ts`
- Create: `examples/ai-chat/tests/stream.test.ts`
- Modify: `examples/ai-chat/src/lib/stream.ts`

- [ ] **Step 1: Write failing transport tests**

Inject a fake fetch implementation and assert native mode makes exactly one generation POST to `?mode=poll`, polls cursor responses in order, and emits each event. Assert web mode makes exactly one generation POST without poll mode and consumes a streaming body. Assert non-OK poll start/read responses throw the server message.

```ts
expect(generationUrls).toEqual(['/api/chats/id?mode=poll']);
expect(chunks.map((chunk) => chunk.type)).toEqual(['start', 'text-start', 'text-delta', 'finish']);
```

Run the tests. Expected: the native test sees a normal SSE POST before polling or buffers the entire response.

- [ ] **Step 2: Add a pure transport selector**

Implement:

```ts
export type StreamTransport = 'sse' | 'poll';

export function selectStreamTransport(env: {
  nativeLynx: boolean;
  standardStreamingFetch?: boolean;
}): StreamTransport {
  return env.nativeLynx && !env.standardStreamingFetch ? 'poll' : 'sse';
}
```

Allow tests to provide a transport/fetch override through optional internal request fields without changing call sites.

- [ ] **Step 3: Split SSE and poll execution paths**

For poll mode, issue only `POST path?mode=poll`, validate `{ streamId }`, then poll until `done`. For SSE, require `response.body.getReader`; if absent, throw a clear configuration error instead of issuing the generation twice. Check every HTTP response with the existing JSON error parser.

- [ ] **Step 4: Verify transport tests pass**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- stream.test.ts`. Expected: all transport, error, and abort tests pass.

### Task 5: Persist and validate color mode

**Files:**
- Create: `examples/ai-chat/tests/color-mode.test.ts`
- Modify: `examples/ai-chat/src/composables/useColorMode.ts`

- [ ] **Step 1: Write failing persistence tests**

With jsdom `localStorage`, reset modules, set `ai-chat:color-mode=dark`, import the composable, and assert `colorMode.value === 'dark'`. Toggle, await Vue's next tick, reset modules, and assert the re-imported mode is `light`. Add an invalid-value case that falls back to `light`.

Run the file. Expected: stored dark mode is ignored.

- [ ] **Step 2: Implement storage-backed state**

Import `watch`, `getItem`, and `setItem`; validate the stored value through:

```ts
function initialColorMode(): ColorMode {
  return getItem('ai-chat:color-mode') === 'dark' ? 'dark' : 'light';
}
```

Watch the shared ref and persist every change.

- [ ] **Step 3: Verify color-mode tests pass**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- color-mode.test.ts`. Expected: initialization, toggle persistence, and invalid fallback pass.

### Task 6: Parse and render Markdown tables

**Files:**
- Create: `examples/ai-chat/tests/markdown.test.ts`
- Modify: `examples/ai-chat/src/lib/markdown.ts`
- Modify: `examples/ai-chat/src/components/chat/MarkdownView.vue`
- Modify: `examples/ai-chat/src/App.css`

- [ ] **Step 1: Write failing parser tests**

Cover:

```md
| Name | Score | Notes |
| :--- | ---: | :---: |
| **Ada** | 10 | `great` |
| Grace | 9 | escaped \| pipe |
```

Assert a `table` block, three alignments, inline tokens, normalized row width, and escaped pipe text. Add malformed delimiter and streaming-incomplete cases that remain paragraphs. Run the test and observe the current single paragraph result.

- [ ] **Step 2: Implement table AST and parser**

Add:

```ts
export type TableAlignment = 'left' | 'center' | 'right' | null;

| {
    type: 'table';
    headers: InlineToken[][];
    rows: InlineToken[][][];
    alignments: TableAlignment[];
  }
```

Implement escaped-pipe-aware cell splitting, delimiter validation, alignment extraction, and row normalization before ordinary paragraph handling.

- [ ] **Step 3: Render tables with native nodes**

Add a `block.type === 'table'` branch containing a horizontal `scroll-view`, header/body rows, bordered cells, inline-token rendering, and alignment styles. Add shared table sizing/border classes to `App.css`.

- [ ] **Step 4: Verify parser and component tests**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- markdown.test.ts`. Expected: all parser cases pass and rendered table text/cell structure is present.

### Task 7: Audit and correct remaining parity claims

**Files:**
- Modify: `examples/ai-chat/PRD.md`
- Modify: `examples/ai-chat/PORTING.md`
- Modify: `examples/ai-chat/README.md`
- Modify: `website/docs/guide/ai-chat.mdx`
- Modify: `website/docs/zh/guide/ai-chat.mdx`

- [ ] **Step 1: Build a checked-row evidence matrix**

For every `☑` row, record its implementation file and test/manual evidence. Explicitly revisit F3.5, F3.6, F3.9, F4.1, F6.4, F7.2, F7.4, F7.7, F7.8, and F7.9 because their current prose conflicts with inspected code.

- [ ] **Step 2: Close the adjacent transport and lifecycle gaps**

Add tests proving poll start/read errors surface through `useChat`, aborting stops further polling, and unmounting `ChatPage` aborts its active generation. Implement those behaviors if the tests fail. Keep provider tools, OAuth, browser tabs, and native clipboard explicitly documented as unsupported host integrations instead of fabricating them.

- [ ] **Step 3: Correct documentation**

Describe the inline SVG chart actually used, the native poll transport, persisted web preferences with native in-memory fallback, implemented Markdown tables, mock-only tools, deterministic title generation, and real-mode limitations consistently in English and Chinese.

- [ ] **Step 4: Verify documentation consistency**

Run targeted `rg` checks for stale contradictory phrases and `pnpm check-links`. Expected: no stale claims and no broken links.

### Task 8: Full completion audit

**Files:**
- Delete if no longer useful: `issue_comments.json`
- Delete if no longer useful: `issue_comments_with_accuracy.json`

- [ ] **Step 1: Run focused regression suite**

Run `pnpm --filter @vue-lynx-example/ai-chat test`. Expected: all new tests pass with no warnings.

- [ ] **Step 2: Run build and repository verification**

Run:

```bash
rm -rf examples/ai-chat/node_modules/.cache
pnpm --filter @vue-lynx-example/ai-chat build
pnpm lint
pnpm test
pnpm test:upstream
pnpm check-links
git diff --check
```

Expected: every command exits zero. If a repository-wide failure is unrelated, record the exact pre-existing failure and still run the narrowest authoritative affected suite.

- [ ] **Step 3: Repeat the live ownership reproduction**

Run the two-session collision flow against a fresh temporary data directory. Expected: attacker creation returns 409, attacker deletion returns 404, and victim GET still returns the chat.

- [ ] **Step 4: Audit the design requirements against evidence**

Map every design verification item to fresh command output or inspected rendered behavior. Keep the goal active if any item lacks evidence.
