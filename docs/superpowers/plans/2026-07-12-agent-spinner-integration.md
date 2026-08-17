# AI Chat Agent Spinner Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AI Chat waiting indicator with the approved `dots2` Vue Lynx spinner while preserving the original Nuxt chat's thinking-state timing and proving the behavior in the native Lynx renderer.

**Architecture:** Vendor only the upstream data definition, Vue composable, and native text renderer behind the existing `Indicator.vue` compatibility boundary. `ChatPage.vue` keeps its current submitted/empty-assistant-parts state machine, so the indicator still disappears on the first reasoning, tool, or text part. Web reduced-motion detection is isolated in the composable and native Lynx animates normally when that browser API is absent.

**Tech Stack:** Vue 3 / Vue Lynx SFCs, TypeScript, Vitest fake timers, Rspeedy, LynxExplorer.

---

## File map

- Create `examples/ai-chat/src/lib/agent-spinner.ts`: vendored spinner type, `dots2` data, and upstream provenance.
- Create `examples/ai-chat/src/composables/useSpinnerFrame.ts`: frame progression, reduced-motion detection, and lifecycle cleanup.
- Create `examples/ai-chat/src/components/chat/AgentSpinner.vue`: fixed-size native `<view>/<text>` renderer.
- Modify `examples/ai-chat/src/components/chat/Indicator.vue`: preserve the chat-facing component name while delegating rendering.
- Create `examples/ai-chat/tests/agent-spinner.test.ts`: data, timing, cleanup, reduced-motion, and compatibility-boundary tests.
- Modify `examples/ai-chat/PRD.md`: record the new approved indicator implementation accurately.

### Task 1: Lock the upstream data and lifecycle contract with failing tests

**Files:**
- Create: `examples/ai-chat/tests/agent-spinner.test.ts`

- [ ] **Step 1: Write the failing data and composable tests**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, type ComputedRef } from 'vue';

import { dots2 } from '../src/lib/agent-spinner';
import { useSpinnerFrame } from '../src/composables/useSpinnerFrame';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('agent spinner', () => {
  it('vendors the upstream dots2 definition exactly', () => {
    expect(dots2).toEqual({
      name: 'dots2',
      frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
      interval: 80,
      category: 'braille',
    });
  });

  it('advances in order and wraps', () => {
    vi.useFakeTimers();
    const scope = effectScope();
    let frame!: ComputedRef<string>;
    scope.run(() => {
      frame = useSpinnerFrame(dots2.frames, dots2.interval, false);
    });
    expect(frame.value).toBe('⣾');
    vi.advanceTimersByTime(80);
    expect(frame.value).toBe('⣽');
    vi.advanceTimersByTime(80 * 7);
    expect(frame.value).toBe('⣾');
    scope.stop();
  });

  it('clears the timer when its component scope is disposed', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const scope = effectScope();
    scope.run(() => useSpinnerFrame(dots2.frames, dots2.interval, false));
    scope.stop();
    expect(clearIntervalSpy).toHaveBeenCalledOnce();
  });

  it('uses a stable frame without scheduling motion when reduced motion is requested', () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const scope = effectScope();
    let frame!: ComputedRef<string>;
    scope.run(() => {
      frame = useSpinnerFrame(dots2.frames, dots2.interval, true);
    });
    vi.advanceTimersByTime(800);
    expect(frame.value).toBe('⣾');
    expect(setIntervalSpy).not.toHaveBeenCalled();
    scope.stop();
  });
});
```

- [ ] **Step 2: Run the test to verify the new modules are missing**

Run: `pnpm --filter @vue-lynx-example/ai-chat test -- agent-spinner.test.ts`

Expected: FAIL because `src/lib/agent-spinner.ts` and `src/composables/useSpinnerFrame.ts` do not exist.

### Task 2: Vendor the spinner definition and implement the composable

**Files:**
- Create: `examples/ai-chat/src/lib/agent-spinner.ts`
- Create: `examples/ai-chat/src/composables/useSpinnerFrame.ts`
- Test: `examples/ai-chat/tests/agent-spinner.test.ts`

- [ ] **Step 1: Add the exact upstream definition with provenance**

```ts
/**
 * Vendored from Huxpro/lynx-agent-spinners at commit
 * 45a6881a71a8d2467c88019a2ffebaa9dc970e15 (MIT).
 */
export interface SpinnerDefinition {
  readonly name: string;
  readonly frames: readonly string[];
  readonly interval: number;
  readonly category: 'braille' | 'ascii' | 'arrows' | 'emoji';
}

export const dots2: SpinnerDefinition = {
  name: 'dots2',
  frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  interval: 80,
  category: 'braille',
};
```

- [ ] **Step 2: Add frame progression and reduced-motion handling**

```ts
import { computed, onScopeDispose, ref, type ComputedRef } from 'vue-lynx';

interface MatchMediaResultLike {
  matches: boolean;
}

function prefersReducedMotion(): boolean {
  const matchMedia = (globalThis as {
    matchMedia?: (query: string) => MatchMediaResultLike;
  }).matchMedia;
  return matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function useSpinnerFrame(
  frames: readonly string[],
  interval: number,
  reducedMotion = prefersReducedMotion(),
): ComputedRef<string> {
  const index = ref(0);
  if (!reducedMotion && frames.length > 1) {
    const id = setInterval(() => {
      index.value = (index.value + 1) % frames.length;
    }, interval);
    onScopeDispose(() => clearInterval(id));
  }
  return computed(() => frames[index.value] ?? '');
}
```

- [ ] **Step 3: Run the focused tests**

Run: `pnpm --filter @vue-lynx-example/ai-chat test -- agent-spinner.test.ts`

Expected: PASS for definition, ordered progression, wrapping, cleanup, and reduced motion.

- [ ] **Step 4: Commit the tested data/composable slice**

```bash
git add examples/ai-chat/src/lib/agent-spinner.ts examples/ai-chat/src/composables/useSpinnerFrame.ts examples/ai-chat/tests/agent-spinner.test.ts
git commit -m "feat(ai-chat): vendor agent spinner runtime"
```

### Task 3: Replace the compatibility component without changing chat state

**Files:**
- Create: `examples/ai-chat/src/components/chat/AgentSpinner.vue`
- Modify: `examples/ai-chat/src/components/chat/Indicator.vue`
- Modify: `examples/ai-chat/tests/agent-spinner.test.ts`

- [ ] **Step 1: Add a failing source-contract test**

Append a test that reads the SFCs with `node:fs/promises` and proves that `Indicator.vue` delegates to `AgentSpinner`, while `AgentSpinner.vue` uses `dots2` and `useSpinnerFrame`. This is a source-boundary test because the example's Node Vitest harness intentionally has no DOM/native SFC mount environment.

```ts
it('keeps Indicator as a compatibility wrapper around AgentSpinner', async () => {
  const [indicator, spinner] = await Promise.all([
    readFile(new URL('../src/components/chat/Indicator.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/chat/AgentSpinner.vue', import.meta.url), 'utf8'),
  ]);
  expect(indicator).toContain("import AgentSpinner from './AgentSpinner.vue'");
  expect(indicator).toContain('<AgentSpinner />');
  expect(indicator).not.toContain('patterns');
  expect(spinner).toContain('useSpinnerFrame(dots2.frames, dots2.interval)');
  expect(spinner).toContain('width: 16px');
  expect(spinner).toContain('height: 16px');
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm --filter @vue-lynx-example/ai-chat test -- agent-spinner.test.ts`

Expected: FAIL because `AgentSpinner.vue` does not exist and `Indicator.vue` still contains `patterns`.

- [ ] **Step 3: Add the fixed-size native spinner component**

```vue
<script setup lang="ts">
import { useSpinnerFrame } from '../../composables/useSpinnerFrame';
import { dots2 } from '../../lib/agent-spinner';

const frame = useSpinnerFrame(dots2.frames, dots2.interval);
</script>

<template>
  <view class="agent-spinner shrink-0 flex items-center justify-center">
    <text class="agent-spinner-frame text-muted">{{ frame }}</text>
  </view>
</template>

<style>
.agent-spinner {
  width: 16px;
  height: 16px;
}
.agent-spinner-frame {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
}
</style>
```

- [ ] **Step 4: Reduce `Indicator.vue` to the compatibility wrapper**

```vue
<script setup lang="ts">
import AgentSpinner from './AgentSpinner.vue';
</script>

<template>
  <AgentSpinner />
</template>
```

- [ ] **Step 5: Run the focused test and type/build checks**

Run: `pnpm --filter @vue-lynx-example/ai-chat test -- agent-spinner.test.ts && pnpm --filter @vue-lynx-example/ai-chat build`

Expected: PASS and a successful Lynx production bundle.

- [ ] **Step 6: Commit the component integration**

```bash
git add examples/ai-chat/src/components/chat/AgentSpinner.vue examples/ai-chat/src/components/chat/Indicator.vue examples/ai-chat/tests/agent-spinner.test.ts
git commit -m "feat(ai-chat): use agent spinner while thinking"
```

### Task 4: Verify original thinking-state behavior and update project records

**Files:**
- Modify: `examples/ai-chat/tests/agent-spinner.test.ts`
- Modify: `examples/ai-chat/PRD.md`

- [ ] **Step 1: Add a source-contract test for the original state boundary**

```ts
it('shows waiting UI only until the assistant emits its first part', async () => {
  const chatPage = await readFile(
    new URL('../src/pages/ChatPage.vue', import.meta.url),
    'utf8',
  );
  expect(chatPage).toContain("status.value === 'submitted'");
  expect(chatPage).toContain("lastMessage.value.parts.length === 0");
  expect(chatPage).toContain('<Indicator />');
  expect(chatPage).toContain('Thinking...');
});
```

- [ ] **Step 2: Update F3.4 in the PRD**

Change the implementation note to state that the waiting row uses the vendored `dots2` spinner and keeps the original submitted-to-first-part lifetime plus the “Thinking…” shimmer.

- [ ] **Step 3: Run all example tests**

Run: `pnpm --filter @vue-lynx-example/ai-chat test`

Expected: all AI Chat tests PASS.

- [ ] **Step 4: Commit records and regression coverage**

```bash
git add examples/ai-chat/tests/agent-spinner.test.ts examples/ai-chat/PRD.md
git commit -m "test(ai-chat): lock thinking indicator behavior"
```

### Task 5: Full build and native-renderer verification

**Files:**
- Verify only; update code/tests if runtime evidence contradicts the design.

- [ ] **Step 1: Clear the example cache before runtime debugging**

Run: `rm -rf examples/ai-chat/node_modules/.cache`

Expected: the persistent example bundle cache is absent.

- [ ] **Step 2: Run repository-level static verification**

Run: `pnpm --filter @vue-lynx-example/ai-chat test && pnpm --filter @vue-lynx-example/ai-chat build && pnpm test && pnpm lint`

Expected: all commands exit 0. If the root scripts differ, inspect `package.json` and run the equivalent existing renderer/lint scripts explicitly.

- [ ] **Step 3: Start a clean AI Chat dev server**

Run: `pnpm --filter @vue-lynx-example/ai-chat dev`

Expected: Rspeedy prints the Web and Lynx bundle URLs without compilation errors.

- [ ] **Step 4: Restart LynxExplorer and load the Lynx bundle**

Use `agent-device`/`lynx-devtool` to terminate and relaunch LynxExplorer, then open the new `.lynx.bundle` URL. This clears stale native error toasts as required by `AGENTS.md`.

- [ ] **Step 5: Verify the submitted state on the native renderer**

Submit a prompt using the mock stream and capture evidence that:

1. a single-cell Braille frame appears immediately before “Thinking…”;
2. frames advance without horizontal label movement;
3. the row occupies the same chat position as the original indicator;
4. the indicator disappears on the first reasoning/text/tool part;
5. the existing collapsible reasoning row remains unchanged;
6. the hamburger menu still renders and spacing fixes from the branch remain intact.

- [ ] **Step 6: Run a web reduced-motion smoke check**

In a browser with `prefers-reduced-motion: reduce`, submit a prompt and verify a stable first frame is shown with no interval animation.

### Task 6: Establish the upstream npm migration path and publish the review branch

**Files:**
- External: create an issue in `Huxpro/lynx-agent-spinners`.
- External: update draft PR `Huxpro/vue-lynx#200`.

- [ ] **Step 1: Create the upstream packaging issue**

Create an issue titled `Package the core data and Vue Lynx spinner as consumable exports` proposing:

- dependency-free `lynx-agent-spinners/core` definitions;
- `lynx-agent-spinners/vue` with `vue`/`vue-lynx` peer dependencies;
- no Expo/React Native transitive dependencies for Vue consumers;
- built JavaScript, declarations, MIT license/provenance, and an external-consumer test;
- a migration note showing local `SpinnerDefinition`, `dots2`, and `useSpinnerFrame` imports being replaced mechanically.

- [ ] **Step 2: Re-run final verification from a clean worktree state**

Run: `git status --short && pnpm --filter @vue-lynx-example/ai-chat test && pnpm --filter @vue-lynx-example/ai-chat build`

Expected: only intentional committed changes and all commands exit 0.

- [ ] **Step 3: Push all commits**

Run: `git push origin codex/fix-pr197-parity`

Expected: remote branch advances to the verified local HEAD.

- [ ] **Step 4: Update draft PR #200**

Add the spinner integration, test/build results, native-renderer evidence, and upstream issue link to the PR description or a concise progress comment.
