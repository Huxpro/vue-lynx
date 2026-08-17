import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Pagination from '../index.vue';

describe('Pagination', () => {
  it('should render pagination in multi mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, pageCount: 5 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render pagination in simple mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, pageCount: 5, mode: 'simple' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasIndicator = Array.from(textEls).some((t) =>
      t.textContent?.includes('1/5'),
    );
    expect(hasIndicator).toBe(true);
  });

  it('should render prev and next buttons', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, pageCount: 5 });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasPrev = Array.from(textEls).some((t) => t.textContent === 'Prev');
    const hasNext = Array.from(textEls).some((t) => t.textContent === 'Next');
    expect(hasPrev).toBe(true);
    expect(hasNext).toBe(true);
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
    const textEls = container.querySelectorAll('text');
    const hasPrev = Array.from(textEls).some((t) => t.textContent === 'Previous');
    const hasNext = Array.from(textEls).some((t) => t.textContent === 'Following');
    expect(hasPrev).toBe(true);
    expect(hasNext).toBe(true);
  });

  it('should render page numbers in multi mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Pagination, { modelValue: 1, pageCount: 5, mode: 'multi' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const has1 = Array.from(textEls).some((t) => t.textContent === '1');
    const has5 = Array.from(textEls).some((t) => t.textContent === '5');
    expect(has1).toBe(true);
    expect(has5).toBe(true);
  });

  it('should emit change when next is tapped', async () => {
    const changes: number[] = [];
    const updates: number[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Pagination, {
            modelValue: 1,
            pageCount: 5,
            onChange: (val: number) => changes.push(val),
            'onUpdate:modelValue': (val: number) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const nextBtn = Array.from(textEls).find((t) => t.textContent === 'Next');
    if (nextBtn && nextBtn.parentElement) {
      fireEvent.tap(nextBtn.parentElement);
      await nextTick();
      expect(updates).toContain(2);
      expect(changes).toContain(2);
    }
  });

  it('should not emit when prev is disabled on page 1', async () => {
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
    const textEls = container.querySelectorAll('text');
    const prevBtn = Array.from(textEls).find((t) => t.textContent === 'Prev');
    if (prevBtn && prevBtn.parentElement) {
      fireEvent.tap(prevBtn.parentElement);
      await nextTick();
      expect(changes.length).toBe(0);
    }
  });

  it('should not emit when next is disabled on last page', async () => {
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
    const textEls = container.querySelectorAll('text');
    const nextBtn = Array.from(textEls).find((t) => t.textContent === 'Next');
    if (nextBtn && nextBtn.parentElement) {
      fireEvent.tap(nextBtn.parentElement);
      await nextTick();
      expect(changes.length).toBe(0);
    }
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
    const textEls = container.querySelectorAll('text');
    const hasIndicator = Array.from(textEls).some((t) =>
      t.textContent?.includes('1/5'),
    );
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
    const textEls = container.querySelectorAll('text');
    const page3 = Array.from(textEls).find((t) => t.textContent === '3');
    if (page3 && page3.parentElement) {
      fireEvent.tap(page3.parentElement);
      await nextTick();
      expect(updates).toContain(3);
    }
  });
});
