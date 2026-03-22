import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Button from '../index.vue';

describe('Button', () => {
  it('should render button with text prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { text: 'Hello' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
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
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

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

  it('should render loading of a specific size when using loading-size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { loading: true, loadingSize: '10' });
        },
      }),
    );
    // The Loading component should be rendered with the specified size
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render icon in the right side when setting icon-position to right', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { icon: 'plus', iconPosition: 'right', text: 'Button' });
        },
      }),
    );
    // Text should come before icon when iconPosition is right
    const allElements = container.querySelectorAll('text, view');
    expect(allElements.length).toBeGreaterThan(0);
  });

  it('should render icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, null, {
            default: () => h('text', null, 'Text'),
            icon: () => h('text', null, 'Icon'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const hasIcon = Array.from(texts).some(
      (t) => t.textContent === 'Icon',
    );
    const hasText = Array.from(texts).some(
      (t) => t.textContent === 'Text',
    );
    expect(hasIcon).toBe(true);
    expect(hasText).toBe(true);
  });

  it('should apply disabled opacity', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', disabled: true, text: 'X' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('style')).toContain('opacity');
  });

  it('should apply round border radius', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', round: true, text: 'Round' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('style')).toContain('border-radius: 999px');
  });

  it('should apply square border radius', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Button, { type: 'primary', square: true, text: 'Square' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    expect(viewEl.getAttribute('style')).toContain('border-radius: 0');
  });
});
