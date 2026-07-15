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
    expect(chatPage).toContain('calculateMessageLaunchDistance');
    expect(chatPage).toContain("'--user-message-launch-distance'");
    expect(chatPage).toContain("'user-message-enter'");
    expect(chatPage).toContain("'assistant-turn-enter'");
    expect(chatPage).toMatch(/beginAnchoredTurn\([^)]*,\s*true\)/);
    expect(chatPage).toMatch(/beginAnchoredTurn\([^)]*,\s*false\)/);
    expect(chatPage).toMatch(
      /v-for="message in messages"[\s\S]*?:style="userMessageLaunchStyle\(message\.id\)"[\s\S]*?@layoutchange/,
    );
    expect(css).toMatch(
      /\.user-message-enter\s*{[^}]*500ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/s,
    );
    expect(css).toContain('var(--user-message-launch-distance)');
    expect(css).toMatch(/\.assistant-turn-enter\s*{[^}]*240ms[^}]*360ms/s);
    expect(css).not.toMatch(/@keyframes user-message-enter[\s\S]*?70%/);
    expect(css).not.toMatch(/@keyframes user-message-enter[\s\S]*?86%/);
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
