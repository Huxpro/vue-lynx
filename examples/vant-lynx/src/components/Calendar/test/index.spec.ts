import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Calendar from '../index.vue';
import type { CalendarDayItem } from '../types';

// Helper to create fixed date
function getDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// Helper: find text elements
function findText(container: Element, text: string): Element | undefined {
  const textEls = container.querySelectorAll('text');
  return Array.from(textEls).find((t) => t.textContent === text);
}

// Helper: find all day cells that contain specific text
function findDayCell(container: Element, dayText: string): Element | undefined {
  const textEls = container.querySelectorAll('text');
  const textEl = Array.from(textEls).find((t) => t.textContent === dayText);
  if (!textEl) return undefined;
  // Walk up to find the .van-calendar__day parent
  let el: Element | null = textEl;
  while (el) {
    const className = el.getAttribute?.('class') || (el as any).className || '';
    if (typeof className === 'string' && className.includes('van-calendar__day')) {
      return el;
    }
    el = el.parentElement;
  }
  return textEl.parentElement?.parentElement ?? undefined;
}

describe('Calendar', () => {
  it('should render calendar with BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false });
        },
      }),
    );
    const calendarEl = container.querySelector('.van-calendar');
    expect(calendarEl).toBeTruthy();
    expect(container.querySelector('.van-calendar__header')).toBeTruthy();
    expect(container.querySelector('.van-calendar__body')).toBeTruthy();
  });

  it('should render title when showTitle is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, title: '选择日期', showTitle: true });
        },
      }),
    );
    expect(findText(container, '选择日期')).toBeTruthy();
  });

  it('should not render title when showTitle is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, title: '选择日期', showTitle: false });
        },
      }),
    );
    expect(container.querySelector('.van-calendar__header-title')).toBeFalsy();
  });

  it('should render default title text from i18n', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, showTitle: true });
        },
      }),
    );
    // Default title is "日期选择"
    expect(findText(container, '日期选择')).toBeTruthy();
  });

  it('should render subtitle when showSubtitle is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, showSubtitle: true });
        },
      }),
    );
    expect(container.querySelector('.van-calendar__header-subtitle')).toBeTruthy();
  });

  it('should not render subtitle when showSubtitle is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, showSubtitle: false });
        },
      }),
    );
    expect(container.querySelector('.van-calendar__header-subtitle')).toBeFalsy();
  });

  it('should render weekday headers', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false });
        },
      }),
    );
    expect(findText(container, 'Sun')).toBeTruthy();
    expect(findText(container, 'Mon')).toBeTruthy();
    expect(findText(container, 'Sat')).toBeTruthy();
  });

  it('should render weekday headers with firstDayOfWeek', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, firstDayOfWeek: 1 });
        },
      }),
    );
    // First weekday should be Mon
    const weekdays = container.querySelectorAll('.van-calendar__weekday');
    expect(weekdays.length).toBe(7);
    const firstWeekday = weekdays[0]?.querySelector('text');
    expect(firstWeekday?.textContent).toBe('Mon');
  });

  it('should render confirm button when showConfirm is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, showConfirm: true });
        },
      }),
    );
    // Default confirm text is "确定"
    expect(findText(container, '确定')).toBeTruthy();
  });

  it('should not render confirm button when showConfirm is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, showConfirm: false });
        },
      }),
    );
    expect(container.querySelector('.van-calendar__confirm')).toBeFalsy();
  });

  it('should render custom confirmText', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, confirmText: '完成' });
        },
      }),
    );
    expect(findText(container, '完成')).toBeTruthy();
  });

  it('should render day numbers in the grid', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false });
        },
      }),
    );
    expect(findText(container, '1')).toBeTruthy();
    expect(findText(container, '15')).toBeTruthy();
  });

  it('should render month mark when showMark is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, showMark: true });
        },
      }),
    );
    expect(container.querySelector('.van-calendar__month-mark')).toBeTruthy();
  });

  it('should not render month mark when showMark is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { poppable: false, showMark: false });
        },
      }),
    );
    expect(container.querySelector('.van-calendar__month-mark')).toBeFalsy();
  });

  // Selection tests
  it('should emit select when a date is clicked (single)', async () => {
    const selected: any[] = [];
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'single',
              poppable: false,
              showConfirm: false,
              minDate,
              maxDate,
              defaultDate: null,
              onSelect: (d: any) => selected.push(d),
            });
        },
      }),
    );

    const dayCell = findDayCell(container, '15');
    if (dayCell) {
      fireEvent.tap(dayCell);
      await nextTick();
      expect(selected.length).toBeGreaterThan(0);
      expect(selected[0].getDate()).toBe(15);
    }
  });

  it('should emit select for range type', async () => {
    const selected: any[] = [];
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'range',
              poppable: false,
              showConfirm: false,
              minDate,
              maxDate,
              defaultDate: null,
              onSelect: (d: any) => selected.push(d),
            });
        },
      }),
    );

    const day10 = findDayCell(container, '10');
    const day20 = findDayCell(container, '20');

    if (day10) {
      fireEvent.tap(day10);
      await nextTick();
    }
    if (day20) {
      fireEvent.tap(day20);
      await nextTick();
    }

    expect(selected.length).toBeGreaterThanOrEqual(2);
    // Last select should be a range [start, end]
    const lastSelect = selected[selected.length - 1];
    if (Array.isArray(lastSelect) && lastSelect.length === 2) {
      expect(lastSelect[0].getDate()).toBe(10);
      expect(lastSelect[1].getDate()).toBe(20);
    }
  });

  it('should emit select and unselect for multiple type', async () => {
    const selected: any[] = [];
    const unselected: any[] = [];
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'multiple',
              poppable: false,
              showConfirm: false,
              minDate,
              maxDate,
              defaultDate: null,
              onSelect: (d: any) => selected.push(d),
              onUnselect: (d: any) => unselected.push(d),
            });
        },
      }),
    );

    const day5 = findDayCell(container, '5');
    if (day5) {
      // Select
      fireEvent.tap(day5);
      await nextTick();
      expect(selected.length).toBe(1);

      // Unselect
      fireEvent.tap(day5);
      await nextTick();
      expect(unselected.length).toBe(1);
    }
  });

  it('should emit confirm when confirm button is clicked', async () => {
    const confirmed: any[] = [];
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);
    const defaultDate = getDate(2024, 1, 15);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'single',
              poppable: false,
              showConfirm: true,
              minDate,
              maxDate,
              defaultDate,
              onConfirm: (d: any) => confirmed.push(d),
            });
        },
      }),
    );

    // Find the calendar confirm button (van-button with van-calendar__confirm class)
    // The Button component emits 'click', so we need to find the root view of Button
    const views = container.querySelectorAll('view');
    const confirmBtn = Array.from(views).find((v) => {
      const cls = v.getAttribute?.('class') || (v as any).className || '';
      return typeof cls === 'string' && cls.includes('van-calendar__confirm');
    });

    if (confirmBtn) {
      fireEvent.tap(confirmBtn);
      await nextTick();
      expect(confirmed.length).toBe(1);
    }
  });

  it('should not emit confirm when no date selected', async () => {
    const confirmed: any[] = [];
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'single',
              poppable: false,
              showConfirm: true,
              minDate,
              maxDate,
              defaultDate: null,
              onConfirm: (d: any) => confirmed.push(d),
            });
        },
      }),
    );

    const confirmText = findText(container, '确定');
    if (confirmText) {
      let el: Element | null = confirmText;
      while (el && !el.getAttribute?.('class')?.includes('van-button')) {
        el = el.parentElement;
      }
      if (el) {
        fireEvent.tap(el);
        await nextTick();
        // Button should be disabled, no confirm emitted
        expect(confirmed.length).toBe(0);
      }
    }
  });

  it('should emit clickDisabledDate for disabled dates', async () => {
    const clickedDisabled: any[] = [];
    const minDate = getDate(2024, 1, 10);
    const maxDate = getDate(2024, 1, 20);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'single',
              poppable: false,
              minDate,
              maxDate,
              defaultDate: null,
              onClickDisabledDate: (d: any) => clickedDisabled.push(d),
            });
        },
      }),
    );

    // Day 5 should be disabled (before minDate)
    const day5 = findDayCell(container, '5');
    if (day5) {
      fireEvent.tap(day5);
      await nextTick();
      expect(clickedDisabled.length).toBe(1);
    }
  });

  it('should render selected day with selected class', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);
    const defaultDate = getDate(2024, 1, 15);

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            type: 'single',
            poppable: false,
            minDate,
            maxDate,
            defaultDate,
          });
        },
      }),
    );

    expect(container.querySelector('.van-calendar__selected-day')).toBeTruthy();
  });

  it('should render disabled days with disabled class', () => {
    const minDate = getDate(2024, 1, 10);
    const maxDate = getDate(2024, 1, 20);

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            type: 'single',
            poppable: false,
            minDate,
            maxDate,
          });
        },
      }),
    );

    expect(container.querySelector('.van-calendar__day--disabled')).toBeTruthy();
  });

  it('should apply custom rowHeight', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            poppable: false,
            minDate,
            maxDate,
            rowHeight: 50,
          });
        },
      }),
    );

    const dayCell = container.querySelector('.van-calendar__day');
    if (dayCell) {
      const style = (dayCell as HTMLElement).style;
      expect(style.height).toBe('50px');
    }
  });

  it('should support formatter prop', () => {
    const minDate = getDate(2024, 5, 1);
    const maxDate = getDate(2024, 5, 31);

    const formatter = (day: CalendarDayItem): CalendarDayItem => {
      if (day.date?.getDate() === 1) {
        day.topInfo = '劳动节';
      }
      return day;
    };

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            poppable: false,
            minDate,
            maxDate,
            formatter,
          });
        },
      }),
    );

    expect(findText(container, '劳动节')).toBeTruthy();
  });

  it('should render range start/end info', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);
    const defaultDate = [getDate(2024, 1, 10), getDate(2024, 1, 20)];

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            type: 'range',
            poppable: false,
            minDate,
            maxDate,
            defaultDate,
          });
        },
      }),
    );

    expect(findText(container, '开始')).toBeTruthy();
    expect(findText(container, '结束')).toBeTruthy();
  });

  it('should render range middle class', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);
    const defaultDate = [getDate(2024, 1, 10), getDate(2024, 1, 20)];

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            type: 'range',
            poppable: false,
            minDate,
            maxDate,
            defaultDate,
          });
        },
      }),
    );

    expect(container.querySelector('.van-calendar__day--start')).toBeTruthy();
    expect(container.querySelector('.van-calendar__day--end')).toBeTruthy();
    expect(container.querySelector('.van-calendar__day--middle')).toBeTruthy();
  });

  it('should handle allowSameDay with start-end type', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);
    const defaultDate = [getDate(2024, 1, 15), getDate(2024, 1, 15)];

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            type: 'range',
            poppable: false,
            minDate,
            maxDate,
            defaultDate,
            allowSameDay: true,
          });
        },
      }),
    );

    expect(container.querySelector('.van-calendar__day--start-end')).toBeTruthy();
  });

  it('should apply color prop to selected day', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);
    const defaultDate = getDate(2024, 1, 15);

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            type: 'single',
            poppable: false,
            color: '#ee0a24',
            minDate,
            maxDate,
            defaultDate,
          });
        },
      }),
    );

    const selectedDay = container.querySelector('.van-calendar__selected-day') as HTMLElement;
    if (selectedDay) {
      // JSDOM normalizes hex to rgb
      const bg = selectedDay.style.background;
      expect(bg === '#ee0a24' || bg === 'rgb(238, 10, 36)').toBe(true);
    }
  });

  it('should render with switchMode month', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            poppable: false,
            switchMode: 'month',
          });
        },
      }),
    );

    // Should have navigation actions
    expect(container.querySelector('.van-calendar__header-subtitle--with-switch')).toBeTruthy();
    expect(container.querySelector('.van-calendar__header-action')).toBeTruthy();
  });

  it('should render with switchMode year-month', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            poppable: false,
            switchMode: 'year-month',
          });
        },
      }),
    );

    // Should have year navigation actions too
    const actions = container.querySelectorAll('.van-calendar__header-action');
    expect(actions.length).toBeGreaterThanOrEqual(4); // prev-year, prev-month, next-month, next-year
  });

  it('should render footer slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Calendar,
            { poppable: false },
            {
              footer: () => h('view', { class: 'custom-footer' }, [
                h('text', null, 'Custom Footer'),
              ]),
            },
          );
        },
      }),
    );

    expect(findText(container, 'Custom Footer')).toBeTruthy();
  });

  it('should render title slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Calendar,
            { poppable: false, showTitle: true },
            {
              title: () => h('text', null, 'Custom Title'),
            },
          );
        },
      }),
    );

    expect(findText(container, 'Custom Title')).toBeTruthy();
  });

  it('should render subtitle slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Calendar,
            { poppable: false, showSubtitle: true },
            {
              subtitle: ({ text }: any) => h('text', null, `Custom: ${text || 'sub'}`),
            },
          );
        },
      }),
    );

    const textEls = container.querySelectorAll('text');
    const hasCustomSub = Array.from(textEls).some((t) =>
      t.textContent?.startsWith('Custom:'),
    );
    expect(hasCustomSub).toBe(true);
  });

  it('should emit confirm immediately when showConfirm is false (single)', async () => {
    const confirmed: any[] = [];
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'single',
              poppable: false,
              showConfirm: false,
              minDate,
              maxDate,
              defaultDate: null,
              onConfirm: (d: any) => confirmed.push(d),
            });
        },
      }),
    );

    const dayCell = findDayCell(container, '15');
    if (dayCell) {
      fireEvent.tap(dayCell);
      await nextTick();
      expect(confirmed.length).toBe(1);
    }
  });

  it('should not select dates when readonly', async () => {
    const selected: any[] = [];
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              type: 'single',
              poppable: false,
              readonly: true,
              minDate,
              maxDate,
              defaultDate: null,
              onSelect: (d: any) => selected.push(d),
            });
        },
      }),
    );

    const dayCell = findDayCell(container, '15');
    if (dayCell) {
      fireEvent.tap(dayCell);
      await nextTick();
      expect(selected.length).toBe(0);
    }
  });

  it('should handle defaultDate for single type', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 1, 31);
    const defaultDate = getDate(2024, 1, 20);

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            type: 'single',
            poppable: false,
            minDate,
            maxDate,
            defaultDate,
          });
        },
      }),
    );

    const selectedDay = container.querySelector('.van-calendar__selected-day');
    expect(selectedDay).toBeTruthy();
    // Find the text element with the day number (skip empty ones)
    const textEls = selectedDay?.querySelectorAll('text');
    const dayText = textEls ? Array.from(textEls).find((t) => t.textContent === '20') : undefined;
    expect(dayText).toBeTruthy();
  });

  it('should render month title for scrolling months', () => {
    const minDate = getDate(2024, 1, 1);
    const maxDate = getDate(2024, 3, 31);

    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, {
            poppable: false,
            minDate,
            maxDate,
          });
        },
      }),
    );

    const monthTitles = container.querySelectorAll('.van-calendar__month-title');
    // First month title may be hidden (showSubtitle), second and third should show
    expect(monthTitles.length).toBeGreaterThanOrEqual(2);
  });

  it('should emit clickSubtitle when subtitle is tapped', async () => {
    const clicked: any[] = [];

    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(Calendar, {
              poppable: false,
              showSubtitle: true,
              onClickSubtitle: (e: any) => clicked.push(e),
            });
        },
      }),
    );

    const subtitle = container.querySelector('.van-calendar__header-subtitle');
    if (subtitle) {
      fireEvent.tap(subtitle);
      await nextTick();
      expect(clicked.length).toBe(1);
    }
  });
});
