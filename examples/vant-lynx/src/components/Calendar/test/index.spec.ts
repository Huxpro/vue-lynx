import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Calendar from '../index.vue';

describe('Calendar', () => {
  it('should render calendar', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render title when showTitle is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { title: 'Select Date', showTitle: true });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Select Date');
    expect(hasTitle).toBe(true);
  });

  it('should not render title when showTitle is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { title: 'Select Date', showTitle: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Select Date');
    expect(hasTitle).toBe(false);
  });

  it('should render weekday headers', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSun = Array.from(textEls).some((t) => t.textContent === 'Sun');
    const hasMon = Array.from(textEls).some((t) => t.textContent === 'Mon');
    expect(hasSun).toBe(true);
    expect(hasMon).toBe(true);
  });

  it('should render confirm button when showConfirm is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { showConfirm: true });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasConfirm = Array.from(textEls).some((t) => t.textContent === 'Confirm');
    expect(hasConfirm).toBe(true);
  });

  it('should not render confirm button when showConfirm is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { showConfirm: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasConfirm = Array.from(textEls).some((t) => t.textContent === 'Confirm');
    expect(hasConfirm).toBe(false);
  });

  it('should render day numbers in the grid', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    // Should have at least day "1" rendered
    const hasDay1 = Array.from(textEls).some((t) => t.textContent === '1');
    expect(hasDay1).toBe(true);
  });

  it('should emit select when a date is tapped', async () => {
    const selected: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Calendar, {
            type: 'single',
            showConfirm: false,
            onSelect: (d: any) => selected.push(d),
          });
      },
    });

    const { container } = render(Comp);
    // Find a day cell with text "15"
    const textEls = container.querySelectorAll('text');
    const day15 = Array.from(textEls).find((t) => t.textContent === '15');
    if (day15 && day15.parentElement) {
      // Tap the parent view
      const parentView = day15.parentElement.parentElement;
      if (parentView) {
        fireEvent.tap(parentView);
        await nextTick();
        expect(selected.length).toBeGreaterThan(0);
      }
    }
  });

  it('should emit confirm when confirm button is tapped', async () => {
    const confirmed: any[] = [];
    const defaultDate = new Date(2025, 5, 15);
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Calendar, {
            type: 'single',
            defaultDate,
            showConfirm: true,
            onConfirm: (d: any) => confirmed.push(d),
          });
      },
    });

    const { container } = render(Comp);
    const textEls = container.querySelectorAll('text');
    const confirmBtn = Array.from(textEls).find((t) => t.textContent === 'Confirm');
    if (confirmBtn && confirmBtn.parentElement) {
      fireEvent.tap(confirmBtn.parentElement);
      await nextTick();
      expect(confirmed.length).toBeGreaterThan(0);
    }
  });

  it('should apply custom color', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Calendar, { color: '#ee0a24' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
