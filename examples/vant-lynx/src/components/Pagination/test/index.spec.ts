import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Pagination from '../index.vue';

function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

describe('Pagination', () => {
  // Vant test: should render prev-text, next-text slot correctly
  it('should render prev-text, next-text slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Pagination,
            { totalItems: 50, showPageSize: 5 },
            {
              'prev-text': () => h('text', null, 'Custom PrevText'),
              'next-text': () => h('text', null, 'Custom NextText'),
            },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Custom PrevText');
    expect(texts).toContain('Custom NextText');
  });

  // Vant test: should render page slot correctly
  it('should render page slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Pagination,
            { totalItems: 50, showPageSize: 5, modelValue: 1 },
            {
              page: ({ text }: { text: any }) =>
                h('text', null, `foo ${text}`),
            },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('foo 1');
    expect(texts).toContain('foo 2');
    expect(texts).toContain('foo 3');
  });

  // Vant test: should emit change event after the page is changed
  it('should emit change event after the page is changed', async () => {
    const changes: number[] = [];
    const currentValue = ref(1);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Pagination, {
            modelValue: currentValue.value,
            totalItems: 50,
            onChange: (val: number) => changes.push(val),
            'onUpdate:modelValue': (val: number) => {
              currentValue.value = val;
            },
          });
      },
    });

    const { container } = render(Comp);

    // Click page 3
    const pageItems = container.querySelectorAll('.van-pagination__item--page');
    fireEvent.tap(pageItems[2]);
    await nextTick();
    expect(changes).toEqual([3]);

    // Click prev (now on page 3, should go to 2)
    const prevBtn = container.querySelector('.van-pagination__item--prev');
    fireEvent.tap(prevBtn);
    await nextTick();
    expect(changes).toEqual([3, 2]);

    // Click next (now on page 2, should go to 3)
    const nextBtn = container.querySelector('.van-pagination__item--next');
    fireEvent.tap(nextBtn);
    await nextTick();
    expect(changes).toEqual([3, 2, 3]);
  });

  // Vant test: should allow to hide prev button and next button
  it('should allow to hide prev button and next button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, {
            totalItems: 50,
            showPageSize: 5,
            showPrevButton: false,
            showNextButton: false,
          });
        },
      }),
    );
    expect(container.querySelector('.van-pagination__item--prev')).toBeFalsy();
    expect(container.querySelector('.van-pagination__item--next')).toBeFalsy();
  });

  // Additional tests for full coverage

  it('should render BEM classes correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, pageCount: 5 });
        },
      }),
    );
    expect(container.querySelector('.van-pagination')).toBeTruthy();
    expect(container.querySelector('.van-pagination__items')).toBeTruthy();
    expect(container.querySelector('.van-pagination__item--prev')).toBeTruthy();
    expect(container.querySelector('.van-pagination__item--next')).toBeTruthy();
    expect(container.querySelectorAll('.van-pagination__item--page').length).toBe(5);
  });

  it('should render pagination in multi mode by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, pageCount: 5 });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('1');
    expect(texts).toContain('5');
    expect(texts).toContain('Prev');
    expect(texts).toContain('Next');
  });

  it('should render pagination in simple mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, {
            modelValue: 1,
            pageCount: 5,
            mode: 'simple',
          });
        },
      }),
    );
    expect(container.querySelector('.van-pagination__page-desc')).toBeTruthy();
    expect(container.querySelector('.van-pagination__item--page')).toBeFalsy();
    expect(container.querySelector('.van-pagination__item--border')).toBeTruthy();
    const texts = getTexts(container);
    const hasIndicator = texts.some((t) => t.includes('1/5'));
    expect(hasIndicator).toBe(true);
  });

  it('should render custom prev and next text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, {
            modelValue: 1,
            pageCount: 5,
            prevText: 'Previous',
            nextText: 'Following',
          });
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Previous');
    expect(texts).toContain('Following');
  });

  it('should not emit when prev is tapped on page 1', async () => {
    const changes: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Pagination, {
            modelValue: 1,
            pageCount: 5,
            onChange: (val: number) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const prevBtn = container.querySelector('.van-pagination__item--prev');
    fireEvent.tap(prevBtn);
    await nextTick();
    expect(changes.length).toBe(0);
  });

  it('should mark prev as disabled on page 1', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, pageCount: 5 });
        },
      }),
    );
    const prev = container.querySelector('.van-pagination__item--prev');
    expect(prev.className).toContain('van-pagination__item--disabled');
  });

  it('should mark next as disabled on last page', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 5, pageCount: 5 });
        },
      }),
    );
    const next = container.querySelector('.van-pagination__item--next');
    expect(next.className).toContain('van-pagination__item--disabled');
  });

  it('should not emit when next is tapped on last page', async () => {
    const changes: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Pagination, {
            modelValue: 5,
            pageCount: 5,
            onChange: (val: number) => changes.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const nextBtn = container.querySelector('.van-pagination__item--next');
    fireEvent.tap(nextBtn);
    await nextTick();
    expect(changes.length).toBe(0);
  });

  it('should calculate page count from totalItems and itemsPerPage', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, {
            modelValue: 1,
            totalItems: 50,
            itemsPerPage: 10,
            mode: 'simple',
          });
        },
      }),
    );
    const texts = getTexts(container);
    const hasIndicator = texts.some((t) => t.includes('1/5'));
    expect(hasIndicator).toBe(true);
  });

  it('should mark active page with active class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 3, pageCount: 5 });
        },
      }),
    );
    const activeItem = container.querySelector('.van-pagination__item--active');
    expect(activeItem).toBeTruthy();
    const texts = Array.from(activeItem.querySelectorAll('text')).map(
      (t: any) => t.textContent,
    );
    expect(texts).toContain('3');
  });

  it('should clamp modelValue to valid range', async () => {
    const updates: number[] = [];
    render(
      defineComponent({
        setup() {
          return () =>
            h(Pagination, {
              modelValue: 100,
              pageCount: 5,
              'onUpdate:modelValue': (val: number) => updates.push(val),
            });
        },
      }),
    );
    await nextTick();
    expect(updates).toContain(5);
  });

  it('should support forceEllipses', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, {
            modelValue: 5,
            pageCount: 12,
            showPageSize: 3,
            forceEllipses: true,
          });
        },
      }),
    );
    const texts = getTexts(container);
    const ellipsisCount = texts.filter((t) => t === '...').length;
    expect(ellipsisCount).toBe(2);
    expect(texts).toContain('4');
    expect(texts).toContain('5');
    expect(texts).toContain('6');
  });

  it('should support Numeric type props (string values)', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, {
            modelValue: 1,
            totalItems: '50',
            itemsPerPage: '10',
            mode: 'simple',
          });
        },
      }),
    );
    const texts = getTexts(container);
    const hasIndicator = texts.some((t) => t.includes('1/5'));
    expect(hasIndicator).toBe(true);
  });

  it('should render pageDesc slot in simple mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Pagination,
            { modelValue: 3, pageCount: 10, mode: 'simple' },
            {
              pageDesc: () => h('text', null, 'Page 3 of 10'),
            },
          );
        },
      }),
    );
    const texts = getTexts(container);
    expect(texts).toContain('Page 3 of 10');
  });

  it('should default to page count of 1 when no items/count given', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, mode: 'simple' });
        },
      }),
    );
    const texts = getTexts(container);
    const hasIndicator = texts.some((t) => t.includes('1/1'));
    expect(hasIndicator).toBe(true);
  });

  it('should emit update:modelValue when page is tapped', async () => {
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Pagination, {
            modelValue: 1,
            pageCount: 5,
            'onUpdate:modelValue': (val: number) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const page3 = container.querySelectorAll('.van-pagination__item--page')[2];
    fireEvent.tap(page3);
    await nextTick();
    expect(updates).toContain(3);
  });
});
