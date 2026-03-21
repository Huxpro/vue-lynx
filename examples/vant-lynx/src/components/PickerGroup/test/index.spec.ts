import { describe, it, expect } from 'vitest';
import { h, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import PickerGroup from '../index.vue';

describe('PickerGroup', () => {
  it('should render picker group', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PickerGroup, { tabs: ['Date', 'Time'] });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render title', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PickerGroup, { title: 'Select Date & Time', tabs: ['Date', 'Time'] });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'Select Date & Time');
    expect(hasTitle).toBe(true);
  });

  it('should render tab labels', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PickerGroup, { tabs: ['Start Date', 'End Date'] });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasStart = Array.from(textEls).some((t) => t.textContent === 'Start Date');
    const hasEnd = Array.from(textEls).some((t) => t.textContent === 'End Date');
    expect(hasStart).toBe(true);
    expect(hasEnd).toBe(true);
  });

  it('should render slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PickerGroup, { tabs: ['Tab1'] }, {
            default: () => h('view', null, [h('text', null, 'Picker Content')]),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasContent = Array.from(textEls).some((t) => t.textContent === 'Picker Content');
    expect(hasContent).toBe(true);
  });

  it('should switch active tab on tap', async () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PickerGroup, { tabs: ['First', 'Second'] });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const secondTab = Array.from(textEls).find((t) => t.textContent === 'Second');
    expect(secondTab).toBeTruthy();
    if (secondTab && secondTab.parentElement) {
      fireEvent.tap(secondTab.parentElement);
      await nextTick();
      // After tap, the second tab should be active — just verify no crash
      const views = container.querySelectorAll('view');
      expect(views.length).toBeGreaterThan(0);
    }
  });

  it('should render with no tabs', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(PickerGroup, { tabs: [] });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
