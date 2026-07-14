import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { bindKeyboardAvoidance } from '../src/composables/useKeyboardAvoidance';
import { setNativeInputValue } from '../src/composables/useNativeInputValue';

describe('native keyboard avoidance', () => {
  it('moves the composer by the keyboard height and restores it on close', () => {
    let listener: ((status: unknown, height: unknown) => void) | undefined;
    const emitter = {
      addListener: vi.fn(
        (_name: string, callback: (status: unknown, height: unknown) => void) => {
          listener = callback;
        },
      ),
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

  it('ignores invalid keyboard heights', () => {
    let listener: ((status: unknown, height: unknown) => void) | undefined;
    const emitter = {
      addListener: vi.fn(
        (_name: string, callback: (status: unknown, height: unknown) => void) => {
          listener = callback;
        },
      ),
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

  it('anchors the chat composer to the bottom before translating it above the keyboard', async () => {
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
    expect(source).toMatch(/\.chat-container\s*{[^}]*padding-bottom:\s*128px/);
  });
});

describe('native drawer motion', () => {
  it('animates the persistent backdrop and panel with native-safe style updates', async () => {
    const source = await readFile(path.resolve(import.meta.dirname, '../src/App.vue'), 'utf8');

    expect(source).toMatch(/\.drawer-panel\s*{[^}]*transition:\s*transform 240ms/);
    expect(source).toMatch(/\.drawer-backdrop\s*{[^}]*transition:\s*opacity 240ms/);
    expect(source).toContain("opacity: sidebarOpen ? '1' : '0'");
  });

  it('mounts the native backdrop only while open and keeps the moving surface stable', async () => {
    const source = await readFile(path.resolve(import.meta.dirname, '../src/App.vue'), 'utf8');

    expect(source).toContain('v-if="isMobile && sidebarOpen"');
    expect(source).toContain('class="absolute inset-0 drawer-backdrop"');
    expect(source).toContain('@tap="handleSidebarShowChange(false)"');
    expect(source).toContain(':event-through="false"');
    expect(source).toMatch(/v-if="isMobile"\s+class="absolute top-0 bottom-0 left-0/);
    expect(source).toContain("transform: sidebarOpen ? 'translateX(0px)' : 'translateX(-288px)'");
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

  it('syncs the editor value after its native input is mounted', async () => {
    const source = await readFile(
      path.resolve(import.meta.dirname, '../src/components/chat/message/MessageEdit.vue'),
      'utf8',
    );

    expect(source).toContain('v-model="editingText"');
    expect(source).toContain('ref="inputRef"');
    expect(source).toContain('useNativeInputValue(inputRef, () => editingText.value)');
  });
});
