import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Signature from '../index.vue';

describe('Signature', () => {
  it('should render signature pad', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with custom clear button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { clearButtonText: 'Reset' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasReset = Array.from(textEls).some((t) => t.textContent === 'Reset');
    expect(hasReset).toBe(true);
  });

  it('should render with custom confirm button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { confirmButtonText: 'Done' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDone = Array.from(textEls).some((t) => t.textContent === 'Done');
    expect(hasDone).toBe(true);
  });

  it('should render with custom pen color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { penColor: '#ff0000' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render default button texts', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasClear = Array.from(textEls).some((t) => t.textContent === 'Clear');
    const hasConfirm = Array.from(textEls).some((t) => t.textContent === 'Confirm');
    expect(hasClear).toBe(true);
    expect(hasConfirm).toBe(true);
  });
});
