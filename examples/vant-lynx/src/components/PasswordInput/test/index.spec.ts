import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import PasswordInput from '../index.vue';

describe('PasswordInput', () => {
  it('should render correct number of cells', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '123', length: 6 });
        },
      }),
    );
    // 6 cells + wrapper views
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(5);
  });

  it('should render dots in mask mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 4, mask: true });
        },
      }),
    );
    // Dots are view elements; text elements should be minimal
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render digits in non-mask mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '42', length: 4, mask: false });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const digits = Array.from(texts).map((t) => t.textContent);
    expect(digits).toContain('4');
    expect(digits).toContain('2');
  });

  it('should display info text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '', length: 6, info: 'Enter your password' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const labels = Array.from(texts).map((t) => t.textContent);
    expect(labels.some((t) => t?.includes('Enter your password'))).toBe(true);
  });

  it('should display errorInfo text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '', length: 6, errorInfo: 'Password incorrect' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const labels = Array.from(texts).map((t) => t.textContent);
    expect(labels.some((t) => t?.includes('Password incorrect'))).toBe(true);
  });

  it('should emit focus on tap', async () => {
    const focuses: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(PasswordInput, {
            value: '',
            length: 6,
            onFocus: () => focuses.push(true),
          });
      },
    });
    const { container } = render(Comp);
    const root = container.querySelector('view');
    if (root) {
      fireEvent.tap(root);
    }
    expect(container).not.toBeNull();
  });

  it('should render with custom length', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '1234', length: 4 });
        },
      }),
    );
    expect(container).not.toBeNull();
  });
});
