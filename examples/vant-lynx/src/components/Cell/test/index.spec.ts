import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Cell from '../index.vue';

describe('Cell', () => {
  it('should render default classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title' });
        },
      }),
    );
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell')).toBe(true);
  });

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
    // Label should have BEM class
    const labelEl = container.querySelector('.van-cell__label');
    expect(labelEl).toBeTruthy();
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
    // Title wrapper should have BEM class
    const titleEl = container.querySelector('.van-cell__title');
    expect(titleEl).toBeTruthy();
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
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell--clickable')).toBe(true);
    // Should render right-icon wrapper
    const rightIcon = container.querySelector('.van-cell__right-icon');
    expect(rightIcon).toBeTruthy();
  });

  it('should change arrow direction when using arrow-direction prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { isLink: true, arrowDirection: 'down' });
        },
      }),
    );
    // Should render the right-icon container
    const rightIcon = container.querySelector('.van-cell__right-icon');
    expect(rightIcon).toBeTruthy();
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
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell--required')).toBe(true);
    const textEls = container.querySelectorAll('text');
    const hasAsterisk = Array.from(textEls).some(
      (el) => el.textContent === '*',
    );
    expect(hasAsterisk).toBe(true);
  });

  it('should allow to disable clickable when using is-link prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, {
            isLink: true,
            clickable: false,
          });
        },
      }),
    );
    const cell = container.firstElementChild!;
    // isLink still renders arrow, but clickable class should not be present
    expect(cell.classList.contains('van-cell--clickable')).toBe(false);
    // Arrow should still render
    const rightIcon = container.querySelector('.van-cell__right-icon');
    expect(rightIcon).toBeTruthy();
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
    const titleEl = container.querySelector('.van-cell__title');
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
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell--large')).toBe(true);
  });

  it('should render borderless correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', border: false });
        },
      }),
    );
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell--borderless')).toBe(true);
  });

  it('should render center correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', center: true, label: 'Label' });
        },
      }),
    );
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell--center')).toBe(true);
  });

  it('should render left icon using icon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { title: 'Title', icon: 'location-o' });
        },
      }),
    );
    const leftIcon = container.querySelector('.van-cell__left-icon');
    expect(leftIcon).toBeTruthy();
  });

  it('should render value--alone class when no title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Cell, { value: 'Content' });
        },
      }),
    );
    const valueEl = container.querySelector('.van-cell__value--alone');
    expect(valueEl).toBeTruthy();
  });
});
