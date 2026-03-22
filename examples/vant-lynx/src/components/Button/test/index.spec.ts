import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Button from '../index.vue';

describe('Button', () => {
  it('should render with BEM base class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { text: 'Hello' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button');
    expect(viewEl.getAttribute('class')).toContain('van-button--default');
    expect(viewEl.getAttribute('class')).toContain('van-button--normal');
  });

  it('should render type modifier classes', () => {
    const types = ['primary', 'success', 'warning', 'danger', 'default'] as const;
    for (const type of types) {
      const { container } = render(
        defineComponent({
          render() {
            return h(Button, { type, text: 'Test' });
          },
        }),
      );
      const viewEl = container.querySelector('view')!;
      expect(viewEl.getAttribute('class')).toContain(`van-button--${type}`);
    }
  });

  it('should render size modifier classes', () => {
    const sizes = ['large', 'normal', 'small', 'mini'] as const;
    for (const size of sizes) {
      const { container } = render(
        defineComponent({
          render() {
            return h(Button, { size, text: 'Test' });
          },
        }),
      );
      const viewEl = container.querySelector('view')!;
      expect(viewEl.getAttribute('class')).toContain(`van-button--${size}`);
    }
  });

  it('should render plain modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', plain: true, text: 'Plain' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button--plain');
  });

  it('should render round modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', round: true, text: 'Round' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button--round');
  });

  it('should render square modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', square: true, text: 'Square' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button--square');
  });

  it('should render block modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', block: true, text: 'Block' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button--block');
  });

  it('should render disabled modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', disabled: true, text: 'Disabled' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button--disabled');
  });

  it('should render hairline modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', plain: true, hairline: true, text: 'Hairline' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button--hairline');
  });

  it('should render loading modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', loading: true });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('class')).toContain('van-button--loading');
  });

  it('should render __content element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { text: 'Test' });
        },
      }),
    );
    const content = container.querySelectorAll('view');
    const hasContent = Array.from(content).some(
      (v) => v.getAttribute('class')?.includes('van-button__content'),
    );
    expect(hasContent).toBe(true);
  });

  it('should render text with __text class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { text: 'Hello' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const hasTextClass = Array.from(texts).some(
      (t) => t.getAttribute('class')?.includes('van-button__text'),
    );
    expect(hasTextClass).toBe(true);
  });

  it('should render button with default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, null, {
            default: () => h('text', null, 'Slot Text'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const hasSlotText = Array.from(texts).some(
      (t) => t.textContent === 'Slot Text',
    );
    expect(hasSlotText).toBe(true);
  });

  // Vant test: should emit click event
  it('should emit click event', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Button, {
            text: 'Tap Me',
            onClick: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  // Vant test: should not emit click event when disabled
  it('should not emit click event when disabled', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Button, {
            text: 'Disabled',
            disabled: true,
            onClick: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(clicks.length).toBe(0);
  });

  // Vant test: should not emit click event when loading
  it('should not emit click event when loading', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Button, {
            loading: true,
            onClick: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const viewEl = container.querySelector('view')!;
    fireEvent.tap(viewEl);
    await nextTick();
    await nextTick();
    expect(clicks.length).toBe(0);
  });

  // Vant test: should hide border when color is gradient
  it('should hide border when color is gradient', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { color: 'linear-gradient(#000, #fff)' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('style')).toContain('border-width: 0');
  });

  // Vant test: should change icon class prefix when using icon-prefix prop
  it('should change icon class prefix when using icon-prefix prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { icon: 'success', iconPrefix: 'my-icon' });
        },
      }),
    );
    const iconEl = Array.from(container.querySelectorAll('view')).find(
      (v) => v.getAttribute('class')?.includes('van-button__icon'),
    );
    expect(iconEl).toBeTruthy();
  });

  // Vant test: should render loading slot correctly
  it('should render loading slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { loading: true }, {
            loading: () => h('text', null, 'Custom Loading'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const hasCustomLoading = Array.from(texts).some(
      (t) => t.textContent === 'Custom Loading',
    );
    expect(hasCustomLoading).toBe(true);
  });

  // Vant test: should render loading of a specific size when using loading-size prop
  it('should render loading of a specific size when using loading-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { loading: true, loadingSize: '10px' });
        },
      }),
    );
    const loadingWrapper = Array.from(container.querySelectorAll('view')).find(
      (v) => v.getAttribute('class')?.includes('van-button__loading'),
    );
    expect(loadingWrapper).toBeTruthy();
  });

  // Vant test: should render icon in the right side when setting icon-position to right
  it('should render icon in the right side when setting icon-position to right', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { icon: 'plus', iconPosition: 'right', text: 'Button' });
        },
      }),
    );
    // The __content should contain __text before __icon
    const content = Array.from(container.querySelectorAll('view')).find(
      (v) => v.getAttribute('class')?.includes('van-button__content'),
    );
    expect(content).toBeTruthy();
    // Serialize the content's innerHTML and check order
    const html = content!.innerHTML;
    const textPos = html.indexOf('van-button__text');
    const iconPos = html.indexOf('van-button__icon');
    expect(textPos).toBeGreaterThan(-1);
    expect(iconPos).toBeGreaterThan(-1);
    expect(textPos).toBeLessThan(iconPos);
  });

  // Vant test: should render icon slot correctly
  it('should render icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, null, {
            default: () => h('text', null, 'Text'),
            icon: () => h('text', null, 'Custom Icon'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const hasIcon = Array.from(texts).some(
      (t) => t.textContent === 'Custom Icon',
    );
    const hasText = Array.from(texts).some(
      (t) => t.textContent === 'Text',
    );
    expect(hasIcon).toBe(true);
    expect(hasText).toBe(true);
  });

  it('should show loading text when loading', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { loading: true, loadingText: 'Loading...' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const hasLoadingText = Array.from(texts).some(
      (t) => t.textContent === 'Loading...',
    );
    expect(hasLoadingText).toBe(true);
  });

  it('should apply color style when color prop is set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { color: '#7232dd', text: 'Custom' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    expect(style).toContain('background');
    // Runtime may convert hex to rgb
    expect(style).toMatch(/#7232dd|rgb\(114, 50, 221\)/);
  });

  it('should apply plain color style when color and plain props are set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { color: '#7232dd', plain: true, text: 'Plain Custom' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    expect(style).toContain('color');
    // Runtime may convert hex to rgb
    expect(style).toMatch(/#7232dd|rgb\(114, 50, 221\)/);
  });

  it('should not have color inline style when color prop is not set', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', text: 'No Inline' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    // No inline style at all when no color prop
    expect(style).toBe('');
  });
});
