import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Icon from '../index.vue';

describe('Icon', () => {
  it('should render icon with builtin icon name correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'success' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
    // 'success' maps to unicode checkmark
    const iconText = Array.from(textEls).find((t) => t.textContent === '\u2713');
    expect(iconText).toBeTruthy();
  });

  it('should render icon with url name correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { name: 'https://example.com/icon.png' });
        },
      }),
    );
    const images = container.querySelectorAll('image');
    expect(images.length).toBe(1);
    expect(images[0].getAttribute('src')).toBe('https://example.com/icon.png');
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
          return h(Icon, { name: 'success' }, {
            default: () => h('text', {}, 'Default Slot'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const slotText = Array.from(textEls).find((t) => t.textContent === 'Default Slot');
    expect(slotText).toBeTruthy();
  });

  it('should accept tag prop for API compatibility', () => {
    // In Lynx, tag prop is accepted but doesn't change rendered element
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { tag: 'div' });
        },
      }),
    );
    expect(container).not.toBeNull();
  });

  it('should render dot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { dot: true });
        },
      }),
    );
    // Badge renders a dot view when dot is true
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });

  it('should render badge correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, { badge: '1' });
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
    const textEls = container.querySelectorAll('text');
    const iconText = Array.from(textEls).find((t) => t.textContent === '\u2713');
    expect(iconText).toBeTruthy();
    // fontSize should be set to 20px
    const style = iconText!.getAttribute('style') || '';
    expect(style).toContain('20px');
  });

  it('should render badge-props prop correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Icon, {
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
});
