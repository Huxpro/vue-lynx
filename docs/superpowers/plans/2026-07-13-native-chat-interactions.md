# Native Chat Interaction Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the native composer above the keyboard, animate the mobile drawer, and preserve text when entering message-edit mode.

**Architecture:** Add a focused keyboard-avoidance composable that translates an absolute bottom dock from Lynx global keyboard events. Use Vue Lynx transitions for drawer motion and initialize the native editor with its `setValue` UI method after mount while retaining `v-model` for later updates.

**Tech Stack:** Vue 3, Vue Lynx, Lynx GlobalEventEmitter and SelectorQuery, CSS transitions, Vitest.

---

### Task 1: Keyboard avoidance

**Files:**
- Create: `examples/ai-chat/src/composables/useKeyboardAvoidance.ts`
- Modify: `examples/ai-chat/src/pages/ChatPage.vue`
- Test: `examples/ai-chat/tests/native-interactions.test.ts`

- [x] **Step 1: Write the failing keyboard event test**

Test a fake `GlobalEventEmitter` and native target: `on, 320` must call `setNativeProps` with `translateY(-320px)`, `off` must restore `translateY(0px)`, and cleanup must remove the same listener.

- [x] **Step 2: Run the test and verify RED**

Run: `pnpm --filter @vue-lynx-example/ai-chat test -- tests/native-interactions.test.ts`

Expected: FAIL because `useKeyboardAvoidance.ts` does not exist.

- [x] **Step 3: Implement the minimal composable and attach it to the composer**

Expose a testable `bindKeyboardAvoidance(emitter, getTarget)` helper, subscribe on mount, remove on unmount, and assign a `ShadowElement` template ref to the prompt container.

- [x] **Step 4: Run the test and verify GREEN**

Run the same targeted Vitest command and expect the keyboard tests to pass.

- [x] **Step 5: Anchor the composer before translating it**

Wrap the centered prompt in a full-width `position: absolute; bottom: 0` dock, make the chat page relative, and reserve 128 px at the bottom of the scroll content.

### Task 2: Drawer motion

**Files:**
- Modify: `examples/ai-chat/src/App.vue`
- Test: `examples/ai-chat/tests/native-interactions.test.ts`

- [x] **Step 1: Add a failing drawer transition test**

Require separate `drawer-backdrop` and `drawer-panel` transitions with explicit enter and leave durations and transform/opacity CSS.

- [x] **Step 2: Run the test and verify RED**

Expected: FAIL because the current drawer is conditionally inserted without transitions.

- [x] **Step 3: Add minimal transform and opacity transitions**

Wrap the backdrop and panel in Vue Lynx `<Transition>` components. Use a 240 ms enter and 180 ms exit with an ease-out-quart curve, animating only transform and opacity.

- [x] **Step 4: Run the test and verify GREEN**

Run the targeted test and expect the drawer assertions to pass.

### Task 3: Native edit initial value

**Files:**
- Create: `examples/ai-chat/src/composables/useNativeInputValue.ts`
- Modify: `examples/ai-chat/src/components/chat/message/MessageEdit.vue`
- Test: `examples/ai-chat/tests/native-interactions.test.ts`

- [x] **Step 1: Add a failing edit-input regression test**

Require `v-model="editingText"` on the raw native input and reject the old `:value` plus manual `@input` path.

- [x] **Step 2: Run the test and verify RED**

Expected: FAIL because the edit input currently uses `:value="editingText"`.

- [x] **Step 3: Switch the native edit input to `v-model`**

Remove the redundant input handler so Vue Lynx's native directive owns subsequent synchronization.

- [x] **Step 4: Run the test and verify GREEN**

Run the targeted test and expect all native interaction tests to pass.

- [x] **Step 5: Add the post-mount native initialization required by iOS**

After `nextTick`, invoke the native input's documented `setValue` UI method with the original message. Keep `v-model` for subsequent user input.

### Task 4: Full verification and publish

**Files:**
- Verify all changed source, tests, spec, and plan files.

- [x] **Step 1: Run complete automated verification**

Run the AI chat test suite, `pnpm lint`, and a cache-clean Web/Lynx build.

- [x] **Step 2: Verify in Simulator**

Load the new Lynx bundle in the official LynxExplorer, open the keyboard from the main composer, open/close the drawer, and enter edit mode on an existing message.

- [ ] **Step 3: Commit and push**

Stage only the scoped files, commit with a terse AI-chat interaction message, push PR 200's branch, wait for Vercel, and re-check the deployed native bundle.
