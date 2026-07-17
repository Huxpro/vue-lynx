import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { bindKeyboardAvoidance } from '../src/composables/useKeyboardAvoidance';
import {
  createNativeInputValueSync,
  setNativeInputValue,
} from '../src/composables/useNativeInputValue';
import { inputEventValue } from '../src/lib/input-event';

describe('cross-platform text input', () => {
  it('reads both Lynx detail values and Web DOM target values', () => {
    expect(inputEventValue({ detail: { value: 'native' } })).toBe('native');
    expect(inputEventValue({ target: { value: 'web' } })).toBe('web');
    expect(inputEventValue({ detail: 'legacy' })).toBe('legacy');
  });
});

describe('native keyboard avoidance', () => {
  it('does not subscribe to the native keyboard emitter in Lynx Web', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/composables/useKeyboardAvoidance.ts'),
      'utf8',
    );

    expect(source).toMatch(/SystemInfo\?\.platform\s*===\s*['"]web['"]/);
    expect(source).toMatch(/if \(isWeb\) return;/);
  });

  it('moves the composer by the keyboard height and restores it on close', () => {
    let listener: ((status: unknown, height: unknown) => void) | undefined;
    const emitter = {
      addListener: vi.fn((_name: string, callback: (status: unknown, height: unknown) => void) => {
        listener = callback;
      }),
      removeListener: vi.fn(),
    };
    const exec = vi.fn();
    const setNativeProps = vi.fn(() => ({ exec }));

    const cleanup = bindKeyboardAvoidance(emitter, () => ({ setNativeProps }));

    expect(emitter.addListener).toHaveBeenCalledWith('keyboardstatuschanged', listener);

    listener?.('on', 320);
    expect(setNativeProps).toHaveBeenLastCalledWith({
      transform: 'translateY(-320px)',
      transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
    });
    expect(exec).toHaveBeenCalledTimes(1);

    listener?.('off', 320);
    expect(setNativeProps).toHaveBeenLastCalledWith({
      transform: 'translateY(0px)',
      transition: 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)',
    });
    expect(exec).toHaveBeenCalledTimes(2);

    cleanup();
    expect(emitter.removeListener).toHaveBeenCalledWith('keyboardstatuschanged', listener);
  });

  it('reports keyboard obstruction changes so the message viewport can follow selectively', () => {
    let listener: ((status: unknown, height: unknown) => void) | undefined;
    const emitter = {
      addListener: vi.fn((_name: string, callback: (status: unknown, height: unknown) => void) => {
        listener = callback;
      }),
      removeListener: vi.fn(),
    };
    const onHeightChange = vi.fn();

    bindKeyboardAvoidance(
      emitter,
      () => ({ setNativeProps: () => ({ exec: vi.fn() }) }),
      onHeightChange,
    );

    listener?.('on', 320);
    listener?.('off', 320);

    expect(onHeightChange).toHaveBeenNthCalledWith(1, 320, 0);
    expect(onHeightChange).toHaveBeenNthCalledWith(2, 0, 320);
  });

  it('ignores invalid keyboard heights', () => {
    let listener: ((status: unknown, height: unknown) => void) | undefined;
    const emitter = {
      addListener: vi.fn((_name: string, callback: (status: unknown, height: unknown) => void) => {
        listener = callback;
      }),
      removeListener: vi.fn(),
    };
    const setNativeProps = vi.fn(() => ({ exec: vi.fn() }));

    bindKeyboardAvoidance(emitter, () => ({ setNativeProps }));
    listener?.('on', 'not-a-height');

    expect(setNativeProps).toHaveBeenLastCalledWith({
      transform: 'translateY(0px)',
      transition: 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)',
    });
  });

  it('coordinates measured composer and scroll geometry instead of fixed padding', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/pages/ChatPage.vue'),
      'utf8',
    );

    expect(source).toContain('class="flex-1 flex flex-col min-w-0 min-h-0 chat-page"');
    expect(source).toContain('ref="promptRef"');
    expect(source).toContain('class="prompt-dock"');
    expect(source).toMatch(/\.chat-page\s*{[^}]*position:\s*relative/);
    expect(source).toMatch(/\.prompt-dock\s*{[^}]*position:\s*absolute/);
    expect(source).toMatch(/\.prompt-dock\s*{[^}]*bottom:\s*0/);
    expect(source).toContain('@layoutchange="handleComposerLayout"');
    expect(source).toContain('@layoutchange="handleViewportLayout"');
    expect(source).toMatch(/ref="promptRef"[\s\S]*?:flatten="false"/);
    expect(source).toMatch(/:id="`chat-message-\$\{message\.id\}`"[\s\S]*?:flatten="false"/);
    expect(source).toContain('@scroll="handleScroll"');
    expect(source).toContain('@contentsizechanged="handleContentSizeChanged"');
    expect(source).toContain('class="chat-bottom-spacer"');
    expect(source).not.toMatch(/\.chat-container\s*{[^}]*padding-bottom:\s*128px/);
  });

  it('uses a multiline composer whose mirror drives its native and web height', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/components/chat/PromptBox.vue'),
      'utf8',
    );

    expect(source).toContain('<textarea');
    expect(source).toContain('<x-textarea');
    expect(source).toMatch(/\.SystemInfo\s*\?\.platform === ["']web["']/);
    expect(source).toContain('class="prompt-input-mirror');
    expect(source).toContain(':maxlines="5"');
    expect(source).toMatch(/\.prompt-input-stack\s*{[^}]*position:\s*relative/);
    expect(source).toMatch(/\.prompt-input-web\s*{[^}]*position:\s*absolute/);
    expect(source).toMatch(/\.prompt-input\s*{[^}]*box-sizing:\s*border-box/);
  });
});

describe('native drawer motion', () => {
  it('keeps the mobile navbar below the iOS full-screen safe area', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/components/Navbar.vue'),
      'utf8',
    );

    expect(source).toContain("SystemInfo?.platform === 'iOS'");
    expect(source).toContain('safeAreaTop');
    expect(source).toContain("hostProps?.fullscreen === true || hostProps?.fullscreen === 'true'");
    expect(source).toContain('paddingTop: isMobile.value && safeAreaTop > 0');
    expect(source).toContain("height: isMobile.value ? `${48 + safeAreaTop}px` : '48px'");
    expect(source).toContain(':style="navbarStyle"');
  });

  it('animates the persistent backdrop and panel with direct native style updates', async () => {
    const source = await readFile(path.resolve(import.meta.dirname, '../src/App.vue'), 'utf8');

    expect(source).toContain("const drawerRef = useTemplateRef<ShadowElement>('drawerRef')");
    expect(source).toMatch(/drawerRef\.value\s*\?\.setNativeProps\(\{/);
    expect(source).toContain("transform: open ? 'translateX(0px)' : 'translateX(-288px)'");
    expect(source).toContain("transition: reducedMotion.value ? 'none' : `transform 240ms ${DRAWER_EASING}`");
    expect(source).toContain('ref="drawerRef"');
    expect(source).toMatch(/\.drawer-backdrop\s*{[^}]*transition:\s*opacity 240ms/);
    expect(source).toContain("opacity: sidebarOpen ? '1' : '0'");
  });

  it('mounts the native backdrop only while open and keeps the moving surface stable', async () => {
    const source = await readFile(path.resolve(import.meta.dirname, '../src/App.vue'), 'utf8');

    expect(source).toContain('v-if="isMobile && sidebarOpen"');
    expect(source).toContain('class="absolute inset-0 drawer-backdrop"');
    expect(source).toContain('@tap="handleSidebarShowChange(false)"');
    expect(source).toContain(':event-through="false"');
    expect(source).toMatch(
      /v-if="isMobile"[\s\S]*?ref="drawerRef"[\s\S]*?class="absolute top-0 bottom-0 left-0/,
    );
    expect(source).toContain("transform: 'translateX(-288px)'");
    expect(source).not.toContain("transform: sidebarOpen ? 'translateX(0px)' : 'translateX(-288px)'");
    expect(source).not.toContain('drawer-layer');
    expect(source).not.toContain('<Transition name="drawer-panel"');
  });

  it('keeps the drawer close control below the iOS status area', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/components/Sidebar.vue'),
      'utf8',
    );
    expect(source).toContain("const drawerTopPadding = isIOS ? '60px' : '16px'");
    expect(source).toContain('paddingTop: drawer ? drawerTopPadding : undefined');
    expect(source).toContain('accessibility-label="Close navigation"');
  });
});

describe('native message editing', () => {
  it('writes the initial text through the native input setValue UI method', () => {
    const exec = vi.fn();
    const invoke = vi.fn(() => ({ exec }));

    setNativeInputValue({ invoke }, 'Why use Nuxt UI?');

    expect(invoke).toHaveBeenCalledWith({
      method: 'setValue',
      params: { value: 'Why use Nuxt UI?' },
    });
    expect(exec).toHaveBeenCalledOnce();
  });

  it('waits for native layout availability and only initializes once', () => {
    const exec = vi.fn();
    const invoke = vi.fn(() => ({ exec }));
    const target: { value: { invoke: typeof invoke } | null } = { value: null };
    const sync = createNativeInputValueSync(target, () => 'Why use Nuxt UI?');

    sync();
    expect(invoke).not.toHaveBeenCalled();

    target.value = { invoke };
    sync();
    sync();

    expect(invoke).toHaveBeenCalledOnce();
    expect(exec).toHaveBeenCalledOnce();
  });

  it('syncs the editor value after its native input is mounted', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/components/chat/message/MessageEdit.vue'),
      'utf8',
    );

    expect(source).toContain('v-model="editingText"');
    expect(source).toContain('ref="inputRef"');
    expect(source).toContain(
      'const syncInitialValue = useNativeInputValue(inputRef, () => editingText.value)',
    );
    expect(source).toContain('@layoutchange="syncInitialValue"');
  });
});
