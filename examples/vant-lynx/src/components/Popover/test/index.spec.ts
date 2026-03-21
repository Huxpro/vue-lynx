import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Popover from '../index.vue';

describe('Popover', () => {
  it('should render popover trigger', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popover, {
            show: false,
            actions: [{ text: 'Option 1' }, { text: 'Option 2' }],
          }, {
            default: () => h('text', null, 'Click me'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const trigger = textEls.find((t) => t.textContent === 'Click me');
    expect(trigger).toBeTruthy();
  });

  it('should show actions when visible', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popover, {
            show: true,
            actions: [{ text: 'Option 1' }, { text: 'Option 2' }],
          }, {
            default: () => h('text', null, 'Trigger'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const option1 = textEls.find((t) => t.textContent === 'Option 1');
    const option2 = textEls.find((t) => t.textContent === 'Option 2');
    expect(option1).toBeTruthy();
    expect(option2).toBeTruthy();
  });

  it('should not show actions when hidden', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popover, {
            show: false,
            actions: [{ text: 'Hidden Option' }],
          }, {
            default: () => h('text', null, 'Trigger'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const option = textEls.find((t) => t.textContent === 'Hidden Option');
    expect(option).toBeFalsy();
  });

  it('should render dark theme', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popover, {
            show: true,
            theme: 'dark',
            actions: [{ text: 'Dark Option' }],
          }, {
            default: () => h('text', null, 'Trigger'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const option = textEls.find((t) => t.textContent === 'Dark Option');
    expect(option).toBeTruthy();
  });

  it('should render action with icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Popover, {
            show: true,
            actions: [{ text: 'With Icon', icon: '*' }],
          }, {
            default: () => h('text', null, 'Trigger'),
          });
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const icon = textEls.find((t) => t.textContent === '*');
    expect(icon).toBeTruthy();
  });
});
