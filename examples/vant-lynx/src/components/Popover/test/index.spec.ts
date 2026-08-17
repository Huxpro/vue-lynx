import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, ref, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Popover from '../index.vue';

const baseActions = [
  { text: 'Option 1' },
  { text: 'Option 2' },
  { text: 'Option 3' },
];

describe('Popover', () => {
  it('should render wrapper with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: false, actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const wrapper = container.querySelector('.van-popover__wrapper');
    expect(wrapper).toBeTruthy();
  });

  it('should render trigger in reference slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: false, actions: baseActions },
            { reference: () => h('text', null, 'Click me') },
          );
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
          return h(
            Popover,
            { show: true, actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const option1 = textEls.find((t) => t.textContent === 'Option 1');
    const option2 = textEls.find((t) => t.textContent === 'Option 2');
    const option3 = textEls.find((t) => t.textContent === 'Option 3');
    expect(option1).toBeTruthy();
    expect(option2).toBeTruthy();
    expect(option3).toBeTruthy();
  });

  it('should not show actions when hidden', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: false, actions: [{ text: 'Hidden' }] },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const hidden = textEls.find((t) => t.textContent === 'Hidden');
    expect(hidden).toBeFalsy();
  });

  it('should render light theme class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, theme: 'light', actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const popover = container.querySelector('.van-popover');
    expect(popover?.getAttribute('class')).toContain('van-popover--light');
  });

  it('should render dark theme class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, theme: 'dark', actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const popover = container.querySelector('.van-popover');
    expect(popover?.getAttribute('class')).toContain('van-popover--dark');
  });

  it('should render placement modifier class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, placement: 'top-start', actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const popover = container.querySelector('.van-popover');
    expect(popover?.getAttribute('class')).toContain(
      'van-popover--placement-top-start',
    );
  });

  it('should render arrow by default', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const arrow = container.querySelector('.van-popover__arrow');
    expect(arrow).toBeTruthy();
  });

  it('should hide arrow when showArrow is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, showArrow: false, actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const arrow = container.querySelector('.van-popover__arrow');
    expect(arrow).toBeFalsy();
  });

  it('should render content BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const content = container.querySelector('.van-popover__content');
    expect(content).toBeTruthy();
  });

  it('should render action BEM classes', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, actions: baseActions },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const actionEls = container.querySelectorAll('.van-popover__action');
    expect(actionEls.length).toBe(3);
  });

  it('should render action-text BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true, actions: [{ text: 'Test' }] },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const actionText = container.querySelector('.van-popover__action-text');
    expect(actionText).toBeTruthy();
  });

  it('should render disabled action class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: [{ text: 'Disabled', disabled: true }],
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    expect(action?.getAttribute('class')).toContain(
      'van-popover__action--disabled',
    );
  });

  it('should render with-icon action class when action has icon', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: [{ text: 'With Icon', icon: 'add-o' }],
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    expect(action?.getAttribute('class')).toContain(
      'van-popover__action--with-icon',
    );
  });

  it('should render action icon with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: [{ text: 'Icon', icon: 'add-o' }],
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const icon = container.querySelector('.van-popover__action-icon');
    expect(icon).toBeTruthy();
  });

  it('should apply custom className to action', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: [{ text: 'Custom', className: 'my-action' }],
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    expect(action?.getAttribute('class')).toContain('my-action');
  });

  it('should apply custom color to action', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: [{ text: 'Red', color: 'red' }],
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    expect(action?.getAttribute('style')).toContain('color');
  });

  it('should add horizontal content class when actionsDirection is horizontal', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: baseActions,
              actionsDirection: 'horizontal',
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const content = container.querySelector('.van-popover__content');
    expect(content?.getAttribute('class')).toContain(
      'van-popover__content--horizontal',
    );
  });

  it('should emit select event when clicking an action', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: baseActions,
              onSelect,
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    await fireEvent.tap(action!);
    expect(onSelect).toHaveBeenCalledWith(baseActions[0], 0);
  });

  it('should not emit select event when action is disabled', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: [{ text: 'Disabled', disabled: true }],
              onSelect,
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    await fireEvent.tap(action!);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should emit update:show when clicking action with closeOnClickAction', async () => {
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: baseActions,
              'onUpdate:show': onUpdateShow,
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    await fireEvent.tap(action!);
    expect(onUpdateShow).toHaveBeenCalledWith(false);
  });

  it('should not close when closeOnClickAction is false', async () => {
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: baseActions,
              closeOnClickAction: false,
              'onUpdate:show': onUpdateShow,
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const action = container.querySelector('.van-popover__action');
    await fireEvent.tap(action!);
    expect(onUpdateShow).not.toHaveBeenCalled();
  });

  it('should toggle popover when trigger is click and wrapper is tapped', async () => {
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: false,
              trigger: 'click',
              actions: baseActions,
              'onUpdate:show': onUpdateShow,
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const wrapper = container.querySelector('.van-popover__wrapper');
    await fireEvent.tap(wrapper!);
    expect(onUpdateShow).toHaveBeenCalledWith(true);
  });

  it('should not toggle when trigger is manual', async () => {
    const onUpdateShow = vi.fn();
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: false,
              trigger: 'manual',
              actions: baseActions,
              'onUpdate:show': onUpdateShow,
            },
            { reference: () => h('text', null, 'Trigger') },
          );
        },
      }),
    );
    const wrapper = container.querySelector('.van-popover__wrapper');
    await fireEvent.tap(wrapper!);
    expect(onUpdateShow).not.toHaveBeenCalled();
  });

  it('should render custom content via default slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            { show: true },
            {
              reference: () => h('text', null, 'Trigger'),
              default: () => h('text', null, 'Custom Content'),
            },
          );
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const custom = textEls.find((t) => t.textContent === 'Custom Content');
    expect(custom).toBeTruthy();
    // Should not render action elements
    const actionEls = container.querySelectorAll('.van-popover__action');
    expect(actionEls.length).toBe(0);
  });

  it('should render action slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Popover,
            {
              show: true,
              actions: [{ text: 'Test' }],
            },
            {
              reference: () => h('text', null, 'Trigger'),
              action: ({ action, index }: { action: any; index: number }) =>
                h('text', null, `name: ${action.text}, index: ${index}`),
            },
          );
        },
      }),
    );
    const textEls = Array.from(container.querySelectorAll('text'));
    const custom = textEls.find(
      (t) => t.textContent === 'name: Test, index: 0',
    );
    expect(custom).toBeTruthy();
  });

  it('should render all 12 placements', () => {
    const placements = [
      'top', 'top-start', 'top-end',
      'bottom', 'bottom-start', 'bottom-end',
      'left', 'left-start', 'left-end',
      'right', 'right-start', 'right-end',
    ] as const;
    for (const placement of placements) {
      const { container } = render(
        defineComponent({
          render() {
            return h(
              Popover,
              { show: true, placement, actions: baseActions },
              { reference: () => h('text', null, 'Trigger') },
            );
          },
        }),
      );
      const popover = container.querySelector('.van-popover');
      expect(popover?.getAttribute('class')).toContain(
        `van-popover--placement-${placement}`,
      );
    }
  });
});
