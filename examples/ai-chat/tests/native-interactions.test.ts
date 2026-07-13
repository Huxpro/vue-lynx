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
  it('animates the backdrop and panel with explicit native-safe transitions', async () => {
    const source = await readFile(path.resolve(import.meta.dirname, '../src/App.vue'), 'utf8');

    expect(source).toContain(
      '<Transition name="drawer-backdrop" :duration="{ enter: 240, leave: 180 }">',
    );
    expect(source).toContain(
      '<Transition name="drawer-panel" :duration="{ enter: 240, leave: 180 }">',
    );
    expect(source).toMatch(/\.drawer-panel-enter-from[\s\S]*translateX\(-100%\)/);
    expect(source).toMatch(/\.drawer-backdrop-enter-from[\s\S]*opacity:\s*0/);
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
