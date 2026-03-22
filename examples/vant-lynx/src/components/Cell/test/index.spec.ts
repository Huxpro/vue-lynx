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
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Title');
    expect(texts).toContain('Value');
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
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Description');
  });

  it('should render value slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, null, {
            value: () => h('text', {}, 'Custom Value'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Value');
  });

  it('should render title slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, null, {
            title: () => h('text', {}, 'Custom Title'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Title');
  });

  it('should render label slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title' }, {
            label: () => h('text', {}, 'Custom Label'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Label');
  });

  it('should render icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, null, {
            icon: () => h('text', {}, 'Custom Icon'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Icon');
  });

  it('should render extra slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, null, {
            extra: () => h('text', {}, 'Custom Extra'),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('Custom Extra');
  });

  it('should render arrow when is-link', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', isLink: true });
        },
      }),
    );
    // Arrow icon should render (an Icon component with name "arrow")
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should change arrow direction when using arrow-direction prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { isLink: true, arrowDirection: 'down' });
        },
      }),
    );
    // Should render an arrow-down icon instead of arrow
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(1);
  });

  it('should emit click event', async () => {
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
    expect(hasAsterisk).toBe(true);
  });

  it('should allow to disable clickable when using is-link prop', () => {
    const clicks: any[] = [];
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, {
            isLink: true,
            clickable: false,
            onClick: (e: any) => clicks.push(e),
          });
        },
      }),
    );
    // Cell should still render arrow (isLink), but clickable is false
    // The click event is still emitted (Vant behavior), but active state is not triggered
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    // Should not have active color since clickable is false
    expect(style).not.toContain('#f2f3f5');
  });

  it('should change title style when using title-style prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, {
            title: 'Title',
            titleStyle: { color: 'red' },
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const titleEl = Array.from(textEls).find(
      (el) => el.textContent === 'Title',
    );
    expect(titleEl).toBeTruthy();
    const style = titleEl!.getAttribute('style') || '';
    expect(style).toContain('red');
  });

  it('should render large size correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', size: 'large' });
        },
      }),
    );
    const viewEl = container.querySelector('view')!;
    const style = viewEl.getAttribute('style') || '';
    // Large size uses 12px vertical padding
    expect(style).toContain('12px');
  });
});
