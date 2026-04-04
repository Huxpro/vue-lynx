/**
 * v-model tests — verify that vModelText directive works on native <input>
 * and <textarea> elements through the dual-thread pipeline.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  nextTick,
  withDirectives,
  vModelText,
} from 'vue-lynx';
import { render, fireEvent } from '../index.js';

describe('v-model', () => {
  it('binds input value via v-model', async () => {
    const text = ref('');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;
    fireEvent.input(input, { detail: { value: 'hello' } });
    await nextTick();
    await nextTick();

    expect(text.value).toBe('hello');
  });

  it('pushes value from BG to MT when ref changes', async () => {
    const text = ref('initial');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;

    // Initial value pushed to MT via mounted hook
    await nextTick();
    await nextTick();
    expect(input.getAttribute('value')).toBe('initial');

    // Update ref — should push new value to MT
    text.value = 'updated';
    await nextTick();
    await nextTick();

    expect(input.getAttribute('value')).toBe('updated');
  });

  it('applies .trim modifier', async () => {
    const text = ref('');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value, '', { trim: true }]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;
    fireEvent.input(input, { detail: { value: '  hello  ' } });
    await nextTick();
    await nextTick();

    expect(text.value).toBe('hello');
  });

  it('applies .number modifier', async () => {
    const val = ref<number | string>('');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: number | string) => {
                val.value = v;
              },
            }),
            [[vModelText, val.value, '', { number: true }]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;
    fireEvent.input(input, { detail: { value: '42' } });
    await nextTick();
    await nextTick();

    expect(val.value).toBe(42);
    expect(typeof val.value).toBe('number');
  });

  it('applies .lazy modifier (listens to confirm instead of input)', async () => {
    const text = ref('');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value, '', { lazy: true }]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;

    // input event should NOT update with .lazy
    fireEvent.input(input, { detail: { value: 'ignored' } });
    await nextTick();
    await nextTick();
    expect(text.value).toBe('');

    // confirm event SHOULD update
    fireEvent.confirm(input, { detail: { value: 'confirmed' } });
    await nextTick();
    await nextTick();
    expect(text.value).toBe('confirmed');
  });

  it('works on textarea', async () => {
    const text = ref('');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('textarea', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value]],
          );
      },
    });

    const { container } = render(Comp);
    const textarea = container.querySelector('textarea')!;
    fireEvent.input(textarea, { detail: { value: 'multiline text' } });
    await nextTick();
    await nextTick();

    expect(text.value).toBe('multiline text');
  });

  it('cleans up on unmount without errors', async () => {
    const text = ref('test');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value]],
          );
      },
    });

    const { unmount } = render(Comp);
    // Should not throw
    expect(() => unmount()).not.toThrow();
  });

  it('applies combined .trim.number modifiers', async () => {
    const val = ref<number | string>('');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: number | string) => {
                val.value = v;
              },
            }),
            [[vModelText, val.value, '', { trim: true, number: true }]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;
    fireEvent.input(input, { detail: { value: ' 42 ' } });
    await nextTick();
    await nextTick();

    expect(val.value).toBe(42);
    expect(typeof val.value).toBe('number');
  });

  it('handles null initial value without crash', async () => {
    const val = ref<string | null>(null);
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                val.value = v;
              },
            }),
            [[vModelText, val.value]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;

    // Mounted hook should coerce null to ''
    await nextTick();
    await nextTick();
    expect(input.getAttribute('value')).toBe('');
  });

  it('filters events with isComposing flag', async () => {
    const text = ref('');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;

    // isComposing events should be ignored
    fireEvent.input(input, { detail: { value: 'partial', isComposing: true } });
    await nextTick();
    await nextTick();
    expect(text.value).toBe('');

    // Non-composing event should go through
    fireEvent.input(input, { detail: { value: 'final' } });
    await nextTick();
    await nextTick();
    expect(text.value).toBe('final');
  });

  it('does not crash when onUpdate:modelValue is missing', async () => {
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {}),
            [[vModelText, 'test']],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;

    // Should not throw even without onUpdate:modelValue handler
    fireEvent.input(input, { detail: { value: 'hello' } });
    await nextTick();
    await nextTick();
  });

  it('coexists with user @input handler on the same element', async () => {
    const text = ref('');
    const inputSpy = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
              onInput: inputSpy,
            }),
            [[vModelText, text.value]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;
    fireEvent.input(input, { detail: { value: 'hello' } });
    await nextTick();
    await nextTick();

    // Both v-model AND user @input should fire
    expect(text.value).toBe('hello');
    expect(inputSpy).toHaveBeenCalledTimes(1);
  });

  it('propagates final value after rapid consecutive updates', async () => {
    const text = ref('a');
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(
            h('input', {
              'onUpdate:modelValue': (v: string) => {
                text.value = v;
              },
            }),
            [[vModelText, text.value]],
          );
      },
    });

    const { container } = render(Comp);
    const input = container.querySelector('input')!;

    // Rapid updates before tick
    text.value = 'b';
    text.value = 'c';
    text.value = 'final';
    await nextTick();
    await nextTick();

    expect(input.getAttribute('value')).toBe('final');
  });
});
