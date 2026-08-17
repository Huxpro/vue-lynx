# Chat Send Motion and Web Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a measured Native send animation, reliable Native composer clearing, and conventional bottom-follow behavior on Web.

**Architecture:** Put platform and motion arithmetic in `chat-viewport.ts`, keep renderer-owned input synchronization inside `PromptBox`, and let `ChatPage` orchestrate the resulting platform-specific behavior. Native preserves top anchoring; Web bypasses it and uses the existing scroll-view `scrollTo` UI method.

**Tech Stack:** Vue 3, Vue Lynx, Lynx UI methods, CSS keyframes, Vitest.

---

### Task 1: Platform and motion policy

**Files:**
- Modify: `examples/ai-chat/src/lib/chat-viewport.ts`
- Modify: `examples/ai-chat/tests/chat-viewport.test.ts`

- [x] **Step 1: Write failing policy tests**

Add assertions that `turnScrollMode('web')` returns `bottom`, Native returns `anchor`, and `calculateMessageLaunchDistance` returns a clamped positive distance from viewport, composer, keyboard, and bubble measurements.

- [x] **Step 2: Run the targeted test and verify RED**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- tests/chat-viewport.test.ts` and expect missing-export failures.

- [x] **Step 3: Implement the pure helpers**

Add typed `turnScrollMode(platform)` and `calculateMessageLaunchDistance(metrics)` exports. Clamp Native distance to 44–420 px and return zero for Web.

- [x] **Step 4: Run the targeted test and verify GREEN**

Run the same command and expect all viewport tests to pass.

### Task 2: Native composer reset

**Files:**
- Modify: `examples/ai-chat/src/components/chat/PromptBox.vue`
- Modify: `examples/ai-chat/src/pages/ChatPage.vue`
- Modify: `examples/ai-chat/tests/chat-motion.test.ts`

- [x] **Step 1: Write a failing reset wiring test**

Require `PromptBox` to import `setNativeInputValue` and watch a reset key after rendering. Require `handleSubmit` to clear `input.value` and increment that key.

- [x] **Step 2: Run the targeted test and verify RED**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- tests/chat-motion.test.ts` and expect the new reset assertions to fail.

- [x] **Step 3: Implement reset ownership**

Pass an incrementing reset key into `PromptBox`. A post-flush child watcher invokes `setNativeInputValue(inputRef.value, '')` only on Native, after the cleared model has committed.

- [x] **Step 4: Run the targeted test and verify GREEN**

Run the same command and expect all chat motion tests to pass.

### Task 3: Measured Native launch and Web bottom follow

**Files:**
- Modify: `examples/ai-chat/src/pages/ChatPage.vue`
- Modify: `examples/ai-chat/src/App.css`
- Modify: `examples/ai-chat/tests/chat-motion.test.ts`

- [x] **Step 1: Write failing orchestration and CSS tests**

Require Web turns to bypass `anchoredMessageId`, call `scrollToBottom`, and omit anchored spacer height. Require the user entrance to use `--user-message-launch-distance`, a 500 ms duration, and an assistant delay of at least 200 ms.

- [x] **Step 2: Run the targeted test and verify RED**

Run `pnpm --filter @vue-lynx-example/ai-chat test -- tests/chat-motion.test.ts` and expect the platform/motion assertions to fail.

- [x] **Step 3: Implement the orchestration**

Read `SystemInfo.platform`, calculate the measured Native launch style after message layout, preserve Native `scrollMessageToTop`, and route Web sends and streaming mutations through the observed `scroll-top` attribute. Pass no anchored turn height to Web spacer calculation.

- [x] **Step 4: Strengthen the signature animation**

Animate the complete user-message unit from the measured translation with a monotonic ease-out scale and opacity change over 500 ms. Do not overshoot the target. Delay assistant content 360 ms and keep reduced-motion overrides intact.

- [x] **Step 5: Run targeted tests and verify GREEN**

Run the viewport and chat-motion test files together and expect both suites to pass.

### Task 4: Full verification and publish

**Files:**
- Verify all scoped source, test, spec, and plan files.

- [x] **Step 1: Run automated verification**

Run the complete AI chat Vitest suite, lint, and a cache-clean production build.

- [x] **Step 2: Verify Web behavior**

Open the Web preview at a mobile viewport, use a long chat, send a message, and assert both the cleared composer and bottom-visible new message.

- [x] **Step 3: Verify Native behavior**

Open the fresh bundle in LynxExplorer on iPhone 17 iOS 26, establish the first turn, then send the second message from the bottom composer. Capture evidence that the complete message unit visibly launches and the Native textarea becomes empty.

- [x] **Step 4: Commit and push**

Stage only scoped files, commit once verification is green, push `codex/native-chat-ux`, and confirm the existing PR is updated.
