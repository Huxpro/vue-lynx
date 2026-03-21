import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Signature from '../index.vue';

describe('Signature', () => {
  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, {});
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render placeholder text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, {});
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Sign here');
  });

  it('should render clear button with custom text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { clearButtonText: 'Reset' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Reset');
  });

  it('should render confirm button with custom text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, { confirmButtonText: 'Done' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Done');
  });

  it('should render default button texts', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Signature, {});
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Clear');
    expect(textContents).toContain('Confirm');
  });
});
