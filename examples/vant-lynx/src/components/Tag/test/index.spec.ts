import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Tag from '../index.vue';

describe('Tag', () => {
  it('should render tag with default type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, null, {
            default: () => 'Tag',
          });
        },
      }),
    );
    const view = container.querySelector('view');
    expect(view).not.toBeNull();
    // Default type renders gray background (rgb(150, 151, 153) = #969799)
    const style = view!.getAttribute('style') || '';
    expect(style).toContain('background-color');
    expect(style).toContain('150, 151, 153');
  });

  it('should render tag with different types', () => {
    const types = ['primary', 'success', 'danger', 'warning'] as const;
    // Hex colors get converted to rgb by Lynx
    const rgbColors = [
      '25, 137, 250',   // #1989fa
      '7, 193, 96',     // #07c160
      '238, 10, 36',    // #ee0a24
      '255, 151, 106',  // #ff976a
    ];

    types.forEach((type, idx) => {
      const { container } = render(
        defineComponent({
          render() {
            return h(Tag, { type }, { default: () => 'Tag' });
          },
        }),
      );
      const view = container.querySelector('view');
      const style = view!.getAttribute('style') || '';
      expect(style).toContain(rgbColors[idx]);
    });
  });

  it('should emit close event when clicking the close icon', async () => {
    const onClose = vi.fn();
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Tag, {
            closeable: true,
            onClose,
          }, { default: () => 'Tag' });
      },
    });

    const { container } = render(Comp);
    // Structure: view(tag) > [text(content), view(closeWrapper) > view(icon) > text(×)]
    // Find the close wrapper - it's the view with marginLeft style
    const allViews = container.querySelectorAll('view');
    let closeWrapper: Element | null = null;
    for (const v of Array.from(allViews)) {
      const s = v.getAttribute('style') || '';
      if (s.includes('margin-left')) {
        closeWrapper = v;
        break;
      }
    }
    if (closeWrapper) {
      fireEvent.tap(closeWrapper);
      await nextTick();
      await nextTick();
    }
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
    const views = container.querySelectorAll('view');
    expect(views.length).toBe(0);
  });

  it('should render plain tag with correct styles', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, {
            plain: true,
            color: 'red',
            textColor: 'blue',
          }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const style = view!.getAttribute('style') || '';
    // Plain mode: background should be white (rgb(255, 255, 255)), border color should be red
    expect(style).toContain('255, 255, 255');
    expect(style).toContain('red');
    // Text color should be blue
    const texts = container.querySelectorAll('text');
    const hasBlueText = Array.from(texts).some(t => {
      const s = t.getAttribute('style') || '';
      return s.includes('blue');
    });
    expect(hasBlueText).toBe(true);
  });

  it('should render round tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', round: true }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const style = view!.getAttribute('style') || '';
    expect(style).toContain('999px');
  });

  it('should render mark tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', mark: true }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const style = view!.getAttribute('style') || '';
    // Mark: left radius 0, right radius 999px
    expect(style).toContain('999px');
    expect(style).toContain('0px');
  });

  it('should render medium size', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', size: 'medium' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const style = view!.getAttribute('style') || '';
    // Medium padding: 2px top/bottom, 6px left/right
    expect(style).toContain('6px');
  });

  it('should render large size with larger font', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary', size: 'large' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const style = view!.getAttribute('style') || '';
    // Large padding: 4px top/bottom, 8px left/right
    expect(style).toContain('8px');
    // Large uses radius 4px
    expect(style).toContain('border-top-left-radius: 4px');
    // Text should have 14px font
    const texts = container.querySelectorAll('text');
    const hasLargeFont = Array.from(texts).some(t => {
      const s = t.getAttribute('style') || '';
      return s.includes('font-size: 14px');
    });
    expect(hasLargeFont).toBe(true);
  });

  it('should render with custom color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { color: '#7232dd' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    const style = view!.getAttribute('style') || '';
    // #7232dd = rgb(114, 50, 221)
    expect(style).toContain('114, 50, 221');
  });

  it('should render with custom textColor', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { color: '#ffe1e1', textColor: '#ad0000' }, { default: () => 'Tag' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    // #ad0000 = rgb(173, 0, 0)
    const hasCustomText = Array.from(texts).some(t => {
      const s = t.getAttribute('style') || '';
      return s.includes('173, 0, 0');
    });
    expect(hasCustomText).toBe(true);
  });

  it('should show tag by default (show defaults to true)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    const view = container.querySelector('view');
    expect(view).not.toBeNull();
  });

  it('should render closeable tag with close icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Tag, { closeable: true, type: 'primary' }, { default: () => 'Tag' });
        },
      }),
    );
    // Should have more than one view (tag wrapper + close icon wrapper)
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(1);
  });
});
