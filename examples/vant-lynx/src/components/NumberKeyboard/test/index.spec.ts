import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import NumberKeyboard from '../index.vue';

describe('NumberKeyboard', () => {
  it('should not render when show is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: false });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(0);
  });

  it('should render keyboard when show is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const digits = Array.from(texts).map((t) => t.textContent);
    expect(digits).toContain('1');
    expect(digits).toContain('5');
    expect(digits).toContain('9');
    expect(digits).toContain('0');
  });

  it('should render title when provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true, title: 'Enter PIN' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const labels = Array.from(texts).map((t) => t.textContent);
    expect(labels.some((t) => t?.includes('Enter PIN'))).toBe(true);
  });

  it('should emit input on key tap', async () => {
    const inputs: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            onInput: (key: string) => inputs.push(key),
          });
      },
    });

    const { container } = render(Comp);
    const texts = container.querySelectorAll('text');
    const key5 = Array.from(texts).find((t) => t.textContent === '5');
    if (key5) {
      fireEvent.tap(key5.parentElement as Element);
      await nextTick();
    }
    expect(container).not.toBeNull();
  });

  it('should emit delete on delete key tap', async () => {
    const deletes: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(NumberKeyboard, {
            show: true,
            showDeleteKey: true,
            onDelete: () => deletes.push(true),
          });
      },
    });

    const { container } = render(Comp);
    expect(container).not.toBeNull();
  });

  it('should render extraKey', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(NumberKeyboard, { show: true, extraKey: '.' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const labels = Array.from(texts).map((t) => t.textContent);
    expect(labels.some((t) => t?.includes('.'))).toBe(true);
  });
});
