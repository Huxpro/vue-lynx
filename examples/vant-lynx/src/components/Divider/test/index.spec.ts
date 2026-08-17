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
    const root = container.querySelector('.van-divider');
    expect(root).toBeTruthy();
    expect(root?.classList.contains('van-divider--hairline')).toBe(true);
  });

  it('should render left line element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider);
        },
      }),
    );
    const leftLine = container.querySelector('.van-divider__line--left');
    expect(leftLine).toBeTruthy();
  });

  it('should not render right line without content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider);
        },
      }),
    );
    const rightLine = container.querySelector('.van-divider__line--right:not(.van-divider__line--left)');
    // When no content, right line is not rendered (only left line via v-if="hasContent")
    const lines = container.querySelectorAll('.van-divider__line');
    expect(lines.length).toBe(1);
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
    // With content: both left and right lines rendered
    const lines = container.querySelectorAll('.van-divider__line');
    expect(lines.length).toBe(2);
  });

  it('should apply content-center class when has content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, null, {
            default: () => h('text', null, 'Text'),
          });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--content-center')).toBe(true);
  });

  it('should render dashed divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { dashed: true });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--dashed')).toBe(true);
  });

  it('should render hairline divider by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider);
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--hairline')).toBe(true);
  });

  it('should render non-hairline divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { hairline: false });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--hairline')).toBe(false);
  });

  it('should render vertical divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--vertical')).toBe(true);
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

  it('should not apply content class in vertical mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true }, {
            default: () => h('text', null, 'Text'),
          });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--content-center')).toBe(false);
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
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--content-left')).toBe(true);
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
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--content-right')).toBe(true);
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
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--content-center')).toBe(true);
  });

  it('should render vertical dashed divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true, dashed: true });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--vertical')).toBe(true);
    expect(root?.classList.contains('van-divider--dashed')).toBe(true);
  });

  it('should render vertical hairline divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--vertical')).toBe(true);
    expect(root?.classList.contains('van-divider--hairline')).toBe(true);
  });

  it('should render vertical non-hairline divider', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true, hairline: false });
        },
      }),
    );
    const root = container.querySelector('.van-divider');
    expect(root?.classList.contains('van-divider--vertical')).toBe(true);
    expect(root?.classList.contains('van-divider--hairline')).toBe(false);
  });

  it('should only render one line in vertical mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Divider, { vertical: true });
        },
      }),
    );
    const lines = container.querySelectorAll('.van-divider__line');
    expect(lines.length).toBe(1);
  });
});
