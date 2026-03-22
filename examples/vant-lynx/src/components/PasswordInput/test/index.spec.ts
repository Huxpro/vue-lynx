import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import PasswordInput from '../index.vue';

describe('PasswordInput', () => {
  it('should emit focus event when security is tapped', async () => {
    const onFocus = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { onFocus });
        },
      }),
    );
    const root = container.querySelector('.van-password-input');
    expect(root).not.toBeNull();
    await fireEvent.tap(root!);
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('should render error info correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { errorInfo: 'error!' });
        },
      }),
    );
    const errorEl = container.querySelector('.van-password-input__error-info');
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toBe('error!');
  });

  it('should render info text correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { info: 'Some info' });
        },
      }),
    );
    const infoEl = container.querySelector('.van-password-input__info');
    expect(infoEl).not.toBeNull();
    expect(infoEl!.textContent).toBe('Some info');
  });

  it('should render correct number of items based on length', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '123', length: 6 });
        },
      }),
    );
    const items = container.querySelectorAll('.van-password-input__item');
    expect(items.length).toBe(6);
  });

  it('should render custom length', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 4 });
        },
      }),
    );
    const items = container.querySelectorAll('.van-password-input__item');
    expect(items.length).toBe(4);
  });

  it('should render dots in mask mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 4, mask: true });
        },
      }),
    );
    const dots = container.querySelectorAll('.van-password-input__dot');
    expect(dots.length).toBe(2);
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
    const visibleTexts = Array.from(texts).filter(t => t.textContent);
    const digits = visibleTexts.map(t => t.textContent);
    expect(digits).toContain('4');
    expect(digits).toContain('2');
  });

  it('should not render dots for empty chars in mask mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '1', length: 4, mask: true });
        },
      }),
    );
    const dots = container.querySelectorAll('.van-password-input__dot');
    expect(dots.length).toBe(1);
  });

  it('should render cursor when focused', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 6, focused: true });
        },
      }),
    );
    const cursor = container.querySelector('.van-password-input__cursor');
    expect(cursor).not.toBeNull();
    // Cursor should be in the 3rd cell (index 2)
    const items = container.querySelectorAll('.van-password-input__item');
    const focusedItem = items[2];
    expect(focusedItem.classList.contains('van-password-input__item--focus')).toBe(true);
  });

  it('should not render cursor when not focused', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 6, focused: false });
        },
      }),
    );
    const cursor = container.querySelector('.van-password-input__cursor');
    expect(cursor).toBeNull();
  });

  it('should render bordered security without gutter', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 4 });
        },
      }),
    );
    const security = container.querySelector('.van-password-input__security--bordered');
    expect(security).not.toBeNull();
  });

  it('should render gutter security with gutter prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 4, gutter: 10 });
        },
      }),
    );
    const security = container.querySelector('.van-password-input__security--gutter');
    expect(security).not.toBeNull();
  });

  it('should apply gutter class when gutter is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '12', length: 4, gutter: 10 });
        },
      }),
    );
    const gutter = container.querySelector('.van-password-input__security--gutter');
    expect(gutter).not.toBeNull();
    const bordered = container.querySelector('.van-password-input__security--bordered');
    expect(bordered).toBeNull();
  });

  it('should prioritize errorInfo over info', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, {
            info: 'Some info',
            errorInfo: 'Error occurred',
          });
        },
      }),
    );
    const errorEl = container.querySelector('.van-password-input__error-info');
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toBe('Error occurred');
    const infoEl = container.querySelector('.van-password-input__info');
    expect(infoEl).toBeNull();
  });

  it('should have BEM root class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput, { value: '' });
        },
      }),
    );
    expect(container.querySelector('.van-password-input')).not.toBeNull();
    expect(container.querySelector('.van-password-input__security')).not.toBeNull();
  });

  it('should render with default props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PasswordInput);
        },
      }),
    );
    const items = container.querySelectorAll('.van-password-input__item');
    expect(items.length).toBe(6); // default length is 6
  });
});
