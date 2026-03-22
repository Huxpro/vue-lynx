import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Pagination from '../index.vue';

// Helper to find all text elements and their content
function getTexts(container: any): string[] {
  return Array.from(container.querySelectorAll('text')).map(
    (t: any) => t.textContent || '',
  );
}

// Helper to find view containing text
function findButtonByText(container: any, text: string): any {
  const textEls = Array.from(container.querySelectorAll('text')) as any[];
  const el = textEls.find((t) => t.textContent === text);
  return el?.parentElement;
}

// Helper to find page buttons (items between prev and next)
function findPageButtons(container: any): any[] {
  const allViews = Array.from(container.querySelectorAll('view')) as any[];
  // Page buttons have minWidth style
  return allViews.filter((v: any) => {
    const style = v.getAttribute('style') || '';
    return style.includes('min-width');
  });
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
    const updates: number[] = [];
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
              updates.push(val);
            },
          });
      },
    });

    const { container } = render(Comp);

    // Click page 3
    const page3Btn = findButtonByText(container, '3');
    expect(page3Btn).toBeTruthy();
    fireEvent.tap(page3Btn);
    await nextTick();
    expect(changes).toEqual([3]);

    // Click prev (now on page 3, should go to 2)
    const prevBtn = findButtonByText(container, 'Prev');
    expect(prevBtn).toBeTruthy();
    fireEvent.tap(prevBtn);
    await nextTick();
    expect(changes).toEqual([3, 2]);

    // Click next (now on page 2, should go to 3)
    const nextBtn = findButtonByText(container, 'Next');
    expect(nextBtn).toBeTruthy();
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
    const texts = getTexts(container);
    expect(texts).not.toContain('Prev');
    expect(texts).not.toContain('Next');
  });

  // Additional tests for full coverage

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
    const prevBtn = findButtonByText(container, 'Prev');
    expect(prevBtn).toBeTruthy();
    fireEvent.tap(prevBtn);
    await nextTick();
    expect(changes.length).toBe(0);
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
    const nextBtn = findButtonByText(container, 'Next');
    expect(nextBtn).toBeTruthy();
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

  it('should emit change when page number is tapped', async () => {
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
    const page3Btn = findButtonByText(container, '3');
    expect(page3Btn).toBeTruthy();
    fireEvent.tap(page3Btn);
    await nextTick();
    expect(updates).toContain(3);
  });

  it('should clamp modelValue to valid range', async () => {
    const updates: number[] = [];
    const { container } = render(
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
    // watchEffect should clamp 100 -> 5
    expect(updates).toContain(5);
  });

  it('should support forceEllipses with navigable ellipsis items', () => {
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
    // Should have ellipsis indicators
    const ellipsisCount = texts.filter((t) => t === '...').length;
    expect(ellipsisCount).toBe(2); // before and after
    // Should have page numbers around current
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
});
