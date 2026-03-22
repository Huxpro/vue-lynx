import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Icon from '../index.vue';

// Ported from Vant's packages/vant/src/icon/test/index.spec.ts
// 9 test cases matching Vant's test suite

describe('Icon', () => {
  it('should render icon with builtin icon name correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success' });
        },
      }),
    );
    // Should have van-icon and van-icon-success classes
    const iconEl = container.querySelector('.van-icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl!.classList.contains('van-icon-success')).toBe(true);
    // Should render icon font character in a text element
    const textEl = iconEl!.querySelector('.van-icon__font');
    expect(textEl).toBeTruthy();
    expect(textEl!.textContent).toBe('\ue728');
  });

  it('should render icon with url name correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'https://example.com/icon.png' });
        },
      }),
    );
    const iconEl = container.querySelector('.van-icon');
    expect(iconEl).toBeTruthy();
    // Image icons should NOT have van-icon-{name} class
    const images = iconEl!.querySelectorAll('image');
    expect(images.length).toBe(1);
    expect(images[0].getAttribute('src')).toBe('https://example.com/icon.png');
    // Should have van-icon__image class
    expect(images[0].classList.contains('van-icon__image')).toBe(true);
  });

  it('should render icon with local image correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: '/assets/icon.jpg' });
        },
      }),
    );
    const images = container.querySelectorAll('image');
    expect(images.length).toBe(1);
    expect(images[0].getAttribute('src')).toBe('/assets/icon.jpg');
  });

  it('should render default slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Icon,
            { name: 'success' },
            {
              default: () => h('text', {}, 'Default Slot'),
            },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find(
      (t) => t.textContent === 'Default Slot',
    );
    expect(slotText).toBeTruthy();
  });

  it('should accept tag prop for API compatibility', () => {
    // In Lynx, tag prop is accepted but doesn't change rendered element
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { tag: 'div', name: 'success' });
        },
      }),
    );
    // Component should render without errors
    const iconEl = container.querySelector('.van-icon');
    expect(iconEl).toBeTruthy();
  });

  it('should render dot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success', dot: true });
        },
      }),
    );
    // Badge should render a dot
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render badge correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success', badge: '1' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const badgeText = Array.from(textEls).find((t) => t.textContent === '1');
    expect(badgeText).toBeTruthy();
  });

  it('should change icon size when using size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success', size: 20 });
        },
      }),
    );
    const iconEl = container.querySelector('.van-icon');
    expect(iconEl).toBeTruthy();
    const style = iconEl!.getAttribute('style') || '';
    expect(style).toContain('font-size');
    expect(style).toContain('20px');
  });

  it('should render badge-props prop correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, {
            name: 'success',
            badge: 1,
            badgeProps: {
              color: 'blue',
            },
          });
        },
      }),
    );
    // Badge content should be rendered
    const textEls = container.querySelectorAll('text');
    const badgeText = Array.from(textEls).find((t) => t.textContent === '1');
    expect(badgeText).toBeTruthy();
  });

  // Additional tests for icon font rendering
  it('should render icon font character for known icons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'arrow' });
        },
      }),
    );
    const fontEl = container.querySelector('.van-icon__font');
    expect(fontEl).toBeTruthy();
    expect(fontEl!.textContent).toBe('\ue660');
  });

  it('should apply color prop as inline style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success', color: '#1989fa' });
        },
      }),
    );
    const iconEl = container.querySelector('.van-icon');
    const style = iconEl!.getAttribute('style') || '';
    expect(style).toContain('color');
    // Testing env may convert hex to rgb
    expect(
      style.includes('#1989fa') || style.includes('rgb(25, 137, 250)'),
    ).toBe(true);
  });

  it('should apply classPrefix prop correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success', classPrefix: 'my-icon' });
        },
      }),
    );
    const iconEl = container.querySelector('.my-icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl!.classList.contains('my-icon-success')).toBe(true);
  });
});
