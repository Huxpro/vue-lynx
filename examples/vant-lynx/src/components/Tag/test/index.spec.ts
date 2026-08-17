import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tag from '../index.vue';

describe('Tag', () => {
  it('should render tag with default type and BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, null, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    expect(view).not.toBeNull();
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag');
    expect(cls).toContain('van-tag--default');
  });

  it('should render tag with primary type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--primary');
  });

  it('should render tag with success type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'success' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--success');
  });

  it('should render tag with danger type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'danger' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--danger');
  });

  it('should render tag with warning type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'warning' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--warning');
  });

  it('should render plain tag with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { plain: true, type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--plain');
    expect(cls).toContain('van-tag--primary');
  });

  it('should render round tag with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { round: true, type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--round');
  });

  it('should render mark tag with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { mark: true, type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--mark');
  });

  it('should render medium size with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { size: 'medium', type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--medium');
  });

  it('should render large size with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { size: 'large', type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--large');
  });

  it('should emit close event when clicking the close icon', async () => {
    const onClose = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Tag, { closeable: true, onClose }, { default: () => 'Tag' });
      },
    });

    const { container } = render(Comp);
    // Find the close element by BEM class
    const closeEl = container.querySelector('.van-tag__close');
    expect(closeEl).not.toBeNull();
    fireEvent.tap(closeEl!);
    await nextTick();
    await nextTick();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should hide tag when the show prop is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { show: false }, { default: () => 'Tag' });
        },
      }),
    );
    const tag = container.querySelector('.van-tag');
    expect(tag).toBeNull();
  });

  it('should render closeable tag with close icon element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { closeable: true, type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const closeEl = container.querySelector('.van-tag__close');
    expect(closeEl).not.toBeNull();
  });

  it('should apply inline color style when color prop is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { color: '#7232dd' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('.van-tag');
    const style = view!.getAttribute('style') || '';
    // #7232dd = rgb(114, 50, 221) — Lynx runtime converts hex to rgb
    expect(style).toContain('114, 50, 221');
  });

  it('should apply plain style with color and textColor', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { plain: true, color: 'red', textColor: 'blue' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('.van-tag');
    const style = view!.getAttribute('style') || '';
    // Plain mode: color should be textColor (blue), borderColor should be color (red)
    expect(style).toContain('blue');
    expect(style).toContain('red');
  });

  it('should apply textColor on non-plain tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { color: '#ffe1e1', textColor: '#ad0000' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('.van-tag');
    const style = view!.getAttribute('style') || '';
    // #ad0000 = rgb(173, 0, 0), #ffe1e1 = rgb(255, 225, 225) — Lynx converts hex to rgb
    expect(style).toContain('173, 0, 0');
    expect(style).toContain('255, 225, 225');
  });

  it('should show tag by default (show defaults to true)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const tag = container.querySelector('.van-tag');
    expect(tag).not.toBeNull();
  });

  it('should render slot content as text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary' }, { default: () => 'Hello' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const found = Array.from(texts).find(t => t.textContent === 'Hello');
    expect(found).toBeTruthy();
  });

  it('should not have inline style when no color/textColor props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('.van-tag');
    const style = view!.getAttribute('style') || '';
    // No inline style when no color props
    expect(style).toBe('');
  });

  it('should combine multiple BEM modifiers', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'danger', plain: true, round: true, size: 'large' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('.van-tag');
    const cls = view!.getAttribute('class') || '';
    expect(cls).toContain('van-tag--danger');
    expect(cls).toContain('van-tag--plain');
    expect(cls).toContain('van-tag--round');
    expect(cls).toContain('van-tag--large');
  });
});
