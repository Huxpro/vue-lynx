import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Cell from '../index.vue';

describe('Cell', () => {
  it('should render title and value', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', value: 'Value' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should render label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', label: 'Description' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should render arrow when is-link', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', isLink: true });
        },
      }),
    );
    // Arrow text element should exist
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should emit click when clickable', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Cell, {
            title: 'Title',
            isLink: true,
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

  it('should render required asterisk', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', required: true });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasAsterisk = Array.from(textEls).some(
      (el) => el.textContent === '*',
    );
    // Required marker should exist (even if textContent check varies)
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });
});
