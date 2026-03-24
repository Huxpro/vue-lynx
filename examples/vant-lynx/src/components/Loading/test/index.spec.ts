import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Loading from '../index.vue';

describe('Loading', () => {
  it('should render circular loading by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading);
        },
      }),
    );
    expect(container.querySelector('.van-loading')).toBeTruthy();
    expect(container.querySelector('.van-loading--circular')).toBeTruthy();
    expect(container.querySelector('.van-loading__spinner--circular')).toBeTruthy();
    expect(container.querySelector('.van-loading__circular')).toBeTruthy();
  });

  it('should render spinner loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { type: 'spinner' });
        },
      }),
    );
    expect(container.querySelector('.van-loading--spinner')).toBeTruthy();
    expect(container.querySelector('.van-loading__spinner--spinner')).toBeTruthy();
    // Should render 12 lines
    const lines = container.querySelectorAll('.van-loading__line');
    expect(lines.length).toBe(12);
  });

  it('should change loading size when using size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { size: 20 });
        },
      }),
    );
    const spinner = container.querySelector('.van-loading__spinner');
    expect(spinner).toBeTruthy();
    const style = spinner!.getAttribute('style') || '';
    expect(style).toContain('width');
    expect(style).toContain('20px');
  });

  it('should change text font-size when using text-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { textSize: 20 }, { default: () => 'Text' });
        },
      }),
    );
    const text = container.querySelector('.van-loading__text');
    expect(text).toBeTruthy();
    const style = text!.getAttribute('style') || '';
    expect(style).toContain('font-size');
    expect(style).toContain('20px');
  });

  it('should change text color when using text-color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { textColor: 'red' },
            { default: () => 'Loading Text' },
          );
        },
      }),
    );
    const text = container.querySelector('.van-loading__text');
    expect(text).toBeTruthy();
    const style = text!.getAttribute('style') || '';
    expect(style).toContain('red');
  });

  it('should change text color when using color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { color: 'green' },
            { default: () => 'Loading Text' },
          );
        },
      }),
    );
    const text = container.querySelector('.van-loading__text');
    expect(text).toBeTruthy();
    const style = text!.getAttribute('style') || '';
    expect(style).toContain('green');
  });

  it('should change text color to textColor when using color & textColor prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { color: 'green', textColor: 'red' },
            { default: () => 'Loading Text' },
          );
        },
      }),
    );
    const text = container.querySelector('.van-loading__text');
    expect(text).toBeTruthy();
    const style = text!.getAttribute('style') || '';
    expect(style).toContain('red');
    expect(style).not.toContain('green');
  });

  it('should render vertical loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Loading,
            { vertical: true },
            { default: () => 'Loading...' },
          );
        },
      }),
    );
    expect(container.querySelector('.van-loading--vertical')).toBeTruthy();
  });

  it('should render icon slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, null, {
            icon: () => h('view', { class: 'custom-icon' }),
            default: () => 'Loading...',
          });
        },
      }),
    );
    expect(container.querySelector('.custom-icon')).toBeTruthy();
    // Should NOT render default spinner lines or circular view
    expect(container.querySelector('.van-loading__circular')).toBeFalsy();
    expect(container.querySelector('.van-loading__line')).toBeFalsy();
  });

  it('should change spinner color when using color prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { color: 'red' });
        },
      }),
    );
    const spinner = container.querySelector('.van-loading__spinner');
    expect(spinner).toBeTruthy();
    const style = spinner!.getAttribute('style') || '';
    expect(style).toContain('color');
    expect(style).toContain('red');
  });

  it('should not render text when no default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading);
        },
      }),
    );
    expect(container.querySelector('.van-loading__text')).toBeFalsy();
  });

  it('should accept string size with unit', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Loading, { size: '2rem' });
        },
      }),
    );
    const spinner = container.querySelector('.van-loading__spinner');
    expect(spinner).toBeTruthy();
    const style = spinner!.getAttribute('style') || '';
    expect(style).toContain('2rem');
  });
});
