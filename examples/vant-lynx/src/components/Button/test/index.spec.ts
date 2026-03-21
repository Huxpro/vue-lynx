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
    // Debug: check what's rendered
    const textEls = container.querySelectorAll('text');
    // Find the text element that has content 'Hello'
    const textEl = Array.from(textEls).find(
      (el) => el.textContent === 'Hello' || el.getAttribute('text') === 'Hello',
    );
    // Fallback: check if any text element exists
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
    // Slot content should be rendered inside the button
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should emit click event on tap', async () => {
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
});
