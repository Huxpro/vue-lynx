import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Divider from '../index.vue';

describe('Divider', () => {
  it('should render divider with default props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // container > wrapper view > left line view
    expect(views.length).toBeGreaterThanOrEqual(2);
  });

  it('should render divider with text slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, null, {
            default: () => h('text', null, 'Text'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const found = Array.from(textEls).some(
      (el) => el.textContent === 'Text',
    );
    expect(found).toBe(true);
    // When slot has content: left line + right line = at least 3 views
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThanOrEqual(3);
  });

  it('should render dashed divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { dashed: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // The line view should have dashed border style
    const lineView = views[1];
    const style = lineView?.getAttribute('style') || '';
    expect(style).toContain('dashed');
  });

  it('should render hairline divider by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const lineView = views[1];
    const style = lineView?.getAttribute('style') || '';
    expect(style).toContain('0.5px');
  });

  it('should render non-hairline divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { hairline: false });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const lineView = views[1];
    const style = lineView?.getAttribute('style') || '';
    expect(style).toContain('1px');
    expect(style).not.toContain('0.5px');
  });

  it('should render vertical divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true });
        },
      }),
    );
    const wrapper = container.querySelectorAll('view')[0];
    const style = wrapper?.getAttribute('style') || '';
    expect(style).toContain('inline-flex');
  });

  it('should not render slot content in vertical mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true }, {
            default: () => h('text', null, 'Text'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const found = Array.from(textEls).some(
      (el) => el.textContent === 'Text',
    );
    expect(found).toBe(false);
  });

  it('should render content-position left', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Divider,
            { contentPosition: 'left' },
            { default: () => h('text', null, 'Left') },
          );
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // Left line should have flex: 1 (smaller)
    const leftLine = views[1];
    const leftStyle = leftLine?.getAttribute('style') || '';
    expect(leftStyle).toContain('flex: 1');
  });

  it('should render content-position right', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Divider,
            { contentPosition: 'right' },
            { default: () => h('text', null, 'Right') },
          );
        },
      }),
    );
    const views = container.querySelectorAll('view');
    // Right line should have flex: 1 (smaller)
    const rightLine = views[2];
    const rightStyle = rightLine?.getAttribute('style') || '';
    expect(rightStyle).toContain('flex: 1');
  });

  it('should render content-position center by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Divider,
            {},
            { default: () => h('text', null, 'Center') },
          );
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const leftLine = views[1];
    const rightLine = views[2];
    const leftStyle = leftLine?.getAttribute('style') || '';
    const rightStyle = rightLine?.getAttribute('style') || '';
    // Both should have flex: 10 (equal)
    expect(leftStyle).toContain('flex: 10');
    expect(rightStyle).toContain('flex: 10');
  });

  it('should render vertical dashed divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true, dashed: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const lineView = views[1];
    const style = lineView?.getAttribute('style') || '';
    expect(style).toContain('dashed');
    expect(style).toContain('border-left');
  });

  it('should render vertical non-hairline divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true, hairline: false });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    const lineView = views[1];
    const style = lineView?.getAttribute('style') || '';
    expect(style).toContain('1px');
  });
});
