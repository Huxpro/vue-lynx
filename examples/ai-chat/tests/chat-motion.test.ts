import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const source = (relativePath: string) =>
  readFile(path.resolve(import.meta.dirname, '..', relativePath), 'utf8').catch(() => '');

describe('native-first chat motion', () => {
  it('orchestrates a newly submitted user bubble before the assistant reveal', async () => {
    const chatPage = await source('src/pages/ChatPage.vue');
    const css = await source('src/App.css');

    expect(chatPage).toContain('animatedUserMessageId');
    expect(chatPage).toContain('pendingAnimatedUserMessageId');
    expect(chatPage).toContain('stagedUserMessageId');
    expect(chatPage).toContain('calculateMessageLaunchDistance');
    expect(chatPage).toContain('translateY(${userMessageLaunchDistance.value}px) scale(0.95)');
    expect(chatPage).toContain("'user-message-enter'");
    expect(chatPage).toContain("'user-message-enter-web'");
    expect(chatPage).toContain("'user-message-staged'");
    expect(chatPage).toContain("'assistant-turn-enter'");
    expect(chatPage).toMatch(/beginAnchoredTurn\([^)]*,\s*true\)/);
    expect(chatPage).toMatch(/beginAnchoredTurn\([^)]*,\s*false\)/);
    expect(chatPage).toMatch(
      /v-for="message in messages"[\s\S]*?:style="userMessageLaunchStyle\(message\.id\)"[\s\S]*?@layoutchange/,
    );
    expect(css).toMatch(/\.user-message-pending,[\s\S]*?\.user-message-enter\s*\{[^}]*transition:/s);
    expect(css).toContain('transform 500ms cubic-bezier(0.22, 1, 0.36, 1)');
    expect(css).toMatch(/\.user-message-staged\s*\{[^}]*opacity:\s*0\.5/s);
    expect(css).toMatch(
      /\.user-message-enter\s*\{[^}]*opacity:\s*1[^}]*transform:\s*translateY\(0px\) scale\(1\)/s,
    );
    expect(css).toMatch(/\.assistant-turn-enter\s*{[^}]*240ms[^}]*360ms/s);
    expect(css).not.toMatch(/@keyframes user-message-enter\s*\{/);
    expect(css).toMatch(
      /\.user-message-enter-web\s*\{[^}]*animation:\s*user-message-enter-web 500ms/s,
    );
    expect(css).toContain('@keyframes user-message-enter-web');
  });

  it('falls back to bottom-follow scrolling for Web turns', async () => {
    const chatPage = await source('src/pages/ChatPage.vue');

    expect(chatPage).toContain('turnScrollMode');
    expect(chatPage).toContain('nextWebBottomOffset');
    expect(chatPage).toContain("turnMode === 'bottom'");
    expect(chatPage).toMatch(/turnMode === 'bottom'[\s\S]*?anchoredMessageId\.value = null/);
    expect(chatPage).toMatch(/turnMode === 'bottom'[\s\S]*?webScrollOffset\.value/);
    expect(chatPage).toMatch(/watch\(\s*messages,[\s\S]*?scrollToBottom\(\)/);
    expect(chatPage).toContain("{ deep: true, flush: 'post' }");
    expect(chatPage).toContain(':scroll-top="webScrollOffset"');
    expect(chatPage).toMatch(
      /anchoredTurnHeight:\s*turnMode === 'anchor'[\s\S]*?anchoredTurnHeight\.value[\s\S]*?: undefined/,
    );
  });

  it('aligns the Native turn before starting the bubble animation', async () => {
    const chatPage = await source('src/pages/ChatPage.vue');
    const layoutHandler = chatPage.match(
      /function handleMessageLayout[\s\S]*?\n}\n\n\/\/ The title/,
    )?.[0];

    expect(chatPage).toMatch(
      /scrollIntoViewOptions:\s*\{[\s\S]*?block:\s*'start'[\s\S]*?behavior:\s*'none'/,
    );
    expect(chatPage).not.toMatch(
      /scrollIntoViewOptions:\s*\{[\s\S]*?behavior:\s*'smooth'/,
    );
    expect(chatPage).toContain('setTimeout(commitAlignment, 17)');
    expect(chatPage).toContain('setTimeout(stageAlignedAnimation, 34)');
    expect(chatPage).toContain('setTimeout(beginAlignedAnimation, 17)');
    expect(chatPage).toMatch(/if \(!animateUser\) void scrollMessageToTop\(message\.id\)/);
    expect(layoutHandler).toBeDefined();
    expect(layoutHandler).toMatch(/invokeScrollMessageToTop\(messageId\)/);
    expect(layoutHandler).toMatch(
      /const commitAlignment[\s\S]*?invokeScrollMessageToTop\(messageId\);\s*setTimeout\(stageAlignedAnimation, 34\)/,
    );
    expect(chatPage).toContain('const ALIGNMENT_SCROLL_RESERVE = 28 / 3');
    expect(chatPage).toMatch(
      /calculateBottomSpacer\([\s\S]*?\) \+ alignmentScrollReserve\.value/,
    );
  });

  it('keeps previous turns out of the reset frame until the new bubble takes over', async () => {
    const chatPage = await source('src/pages/ChatPage.vue');
    const css = await source('src/App.css');

    expect(chatPage).toContain('isEarlierMessageDuringHandoff');
    expect(chatPage).toContain("'turn-handoff-hidden'");
    expect(css).toMatch(/\.turn-handoff-hidden\s*\{[^}]*opacity:\s*0/s);
    expect(css).toMatch(/\.turn-handoff-hidden\s*\{[^}]*transition:\s*none/s);
  });

  it('keeps the pending assistant and bubble on their handoff start frames', async () => {
    const chatPage = await source('src/pages/ChatPage.vue');
    const css = await source('src/App.css');

    expect(chatPage).toContain('assistantTurnEntranceClass');
    expect(chatPage).toContain(':class="assistantTurnEntranceClass"');
    expect(chatPage).toMatch(
      /pendingAnimatedUserMessageId\.value\s*\?\s*'turn-handoff-hidden'/,
    );
    expect(chatPage).toMatch(
      /stagedUserMessageId\.value = messageId;\s*setTimeout\(beginAlignedAnimation, 17\)/,
    );
    expect(css).toMatch(/\.user-message-staged\s*\{[^}]*opacity:\s*0\.5/s);
  });

  it('reveals streamed semantic blocks without replaying loaded history', async () => {
    const markdown = await source('src/components/chat/MarkdownView.vue');
    const content = await source('src/components/chat/message/MessageContent.vue');

    expect(markdown).toContain("streaming ? 'stream-block-enter' : ''");
    expect(markdown).toContain('streamBlockStyle(bi)');
    expect(content).toContain('message-part-enter');
    expect(content).toContain('isTextUIPart(part)');
  });

  it('runs touch feedback synchronously on the main thread', async () => {
    const pressable = await source('src/components/ui/MotionPressable.vue');
    const button = await source('src/components/ui/UButton.vue');
    const actions = await source('src/components/chat/message/MessageActions.vue');
    const navbar = await source('src/components/Navbar.vue');

    expect(pressable).toContain("'main thread'");
    expect(pressable).toContain('main-thread-bindtouchstart');
    expect(pressable).toContain('main-thread-bindtouchend');
    expect(pressable).toContain(
      ':main-thread-bindtouchstart="props.disabled ? undefined : pressIn"',
    );
    expect(pressable).toContain('prefersReducedMotion');
    expect(pressable).toContain("setStyleProperty?.('transition', 'none')");
    expect(pressable).toContain("setStyleProperty?.('transform'");
    expect(button).toContain('<MotionPressable');
    expect(actions).toContain('<MotionPressable');
    expect(navbar).toContain('<MotionPressable');
    expect(navbar).toContain('accessibility-label="Open navigation"');
  });

  it('morphs the composer action and offers an inline retry on failure', async () => {
    const prompt = await source('src/components/chat/PromptBox.vue');
    const chatPage = await source('src/pages/ChatPage.vue');

    expect(prompt).toContain(':key="submitState"');
    expect(prompt).toContain('submit-icon-enter');
    expect(chatPage).toContain('generation-error');
    expect(chatPage).toContain('Retry');
    expect(prompt).not.toContain('v-if="error"');
    expect(chatPage).not.toContain(':error="error?.message"');
  });

  it('uses the full-screen host safe-area inset instead of a device constant', async () => {
    const navbar = await source('src/components/Navbar.vue');

    expect(navbar).toContain('safeAreaTop');
    expect(navbar).toContain('fullscreen');
    expect(navbar).not.toContain("paddingTop: isMobile.value && isIOS ? '48px'");
  });

  it('dismisses the keyboard from a user drag without disabling Web scrolling', async () => {
    const prompt = await source('src/components/chat/PromptBox.vue');
    const chatPage = await source('src/pages/ChatPage.vue');

    expect(prompt).toContain('defineExpose({ blur: blurInput, focus: focusInput })');
    expect(chatPage).toContain('@touchstart="handleScrollTouchStart"');
    expect(chatPage).toContain('promptBoxRef.value?.blur()');
    expect(chatPage).toContain(':bounces="false"');
    expect(chatPage).toContain(':scroll-bar-enable="false"');
  });

  it('clears both Vue and the Native textarea value after accepting a send', async () => {
    const prompt = await source('src/components/chat/PromptBox.vue');
    const chatPage = await source('src/pages/ChatPage.vue');

    expect(prompt).toContain("import { setNativeInputValue } from '../../composables/useNativeInputValue'");
    expect(prompt).toContain('resetKey?: number');
    expect(prompt).toMatch(/watch\(\s*\(\) => props\.resetKey/);
    expect(prompt).toContain("{ flush: 'post' }");
    expect(prompt).toContain("setNativeInputValue(inputRef.value, '')");
    expect(prompt).toContain('defineExpose({ blur: blurInput, focus: focusInput })');
    expect(chatPage).toContain('const inputResetKey = ref(0)');
    expect(chatPage).toMatch(/input\.value = '';\s*inputResetKey\.value \+= 1;/);
    expect(chatPage).toContain(':reset-key="inputResetKey"');
  });

  it('provides reduced-motion fallbacks for every chat entrance animation', async () => {
    const css = await source('src/App.css');
    const app = await source('src/App.vue');
    const reducedMotion = await source('src/composables/useReducedMotion.ts');

    expect(css).toContain('.motion-reduced');
    expect(app).toContain('useReducedMotion');
    expect(app).toContain("reducedMotion.value ? 'motion-reduced' : ''");
    expect(reducedMotion).toContain('prefersReducedMotion');
    expect(reducedMotion).toContain("matchMedia?.('(prefers-reduced-motion: reduce)')");
    expect(css).toContain('.user-message-enter');
    expect(css).toContain('.assistant-turn-enter');
    expect(css).toContain('.stream-block-enter');
    expect(css).toContain('.message-part-enter');
    expect(css).toContain('.submit-icon-enter');
  });
});
