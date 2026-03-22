import { describe, it, expect } from 'vitest';
import { h, ref, defineComponent, nextTick } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Radio from '../index.vue';
import RadioGroup from '../../RadioGroup/index.vue';

describe('Radio', () => {
  it('should render with BEM root class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1' }, {
            default: () => h('text', null, 'Radio 1'),
          });
        },
      }),
    );
    expect(container.querySelector('.van-radio')).toBeTruthy();
  });

  it('should render icon with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1' }, {
            default: () => h('text', null, 'Radio 1'),
          });
        },
      }),
    );
    const icon = container.querySelector('.van-radio__icon');
    expect(icon).toBeTruthy();
    // Default shape is round
    expect(icon!.className).toContain('van-radio__icon--round');
  });

  it('should render label with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1' }, {
            default: () => h('text', null, 'Radio 1'),
          });
        },
      }),
    );
    expect(container.querySelector('.van-radio__label')).toBeTruthy();
  });

  it('should emit "update:modelValue" when icon is clicked', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Radio,
            {
              name: 'a',
              'onUpdate:modelValue': (val: unknown) => updates.push(val),
            },
            { default: () => h('text', null, 'A') },
          );
      },
    });

    const { container } = render(Comp);
    const icon = container.querySelector('.van-radio__icon');
    expect(icon).toBeTruthy();
    fireEvent.tap(icon!);
    await nextTick();
    expect(updates).toEqual(['a']);
  });

  it('should emit "update:modelValue" when label is clicked', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Radio,
            {
              name: 'a',
              'onUpdate:modelValue': (val: unknown) => updates.push(val),
            },
            { default: () => h('text', null, 'A') },
          );
      },
    });

    const { container } = render(Comp);
    const label = container.querySelector('.van-radio__label');
    expect(label).toBeTruthy();
    fireEvent.tap(label!);
    await nextTick();
    expect(updates).toEqual(['a']);
  });

  it('should not emit when disabled', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Radio,
            {
              name: 'a',
              disabled: true,
              'onUpdate:modelValue': (val: unknown) => updates.push(val),
            },
            { default: () => h('text', null, 'A') },
          );
      },
    });

    const { container } = render(Comp);
    const icon = container.querySelector('.van-radio__icon');
    fireEvent.tap(icon!);
    await nextTick();
    expect(updates).toEqual([]);
  });

  it('should add disabled BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1', disabled: true }, {
            default: () => h('text', null, 'A'),
          });
        },
      }),
    );
    expect(container.querySelector('.van-radio')!.className).toContain('van-radio--disabled');
    expect(container.querySelector('.van-radio__icon')!.className).toContain('van-radio__icon--disabled');
    expect(container.querySelector('.van-radio__label')!.className).toContain('van-radio__label--disabled');
  });

  it('should add label-disabled BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1', labelDisabled: true }, {
            default: () => h('text', null, 'A'),
          });
        },
      }),
    );
    expect(container.querySelector('.van-radio')!.className).toContain('van-radio--label-disabled');
  });

  it('should not toggle when label is disabled and label is clicked', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Radio,
            {
              name: 'a',
              labelDisabled: true,
              'onUpdate:modelValue': (val: unknown) => updates.push(val),
            },
            { default: () => h('text', null, 'A') },
          );
      },
    });

    const { container } = render(Comp);
    const label = container.querySelector('.van-radio__label');
    fireEvent.tap(label!);
    await nextTick();
    expect(updates).toEqual([]);
  });

  it('should render label on left when labelPosition is left', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1', labelPosition: 'left' }, {
            default: () => h('text', null, 'A'),
          });
        },
      }),
    );
    const label = container.querySelector('.van-radio__label');
    expect(label).toBeTruthy();
    expect(label!.className).toContain('van-radio__label--left');
    // Label should come before icon in DOM
    const root = container.querySelector('.van-radio')!;
    const children = Array.from(root.children);
    const labelIdx = children.indexOf(label as Element);
    const iconIdx = children.findIndex(c => c.className?.includes('van-radio__icon'));
    expect(labelIdx).toBeLessThan(iconIdx);
  });

  it('should render square shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1', shape: 'square' }, {
            default: () => h('text', null, 'A'),
          });
        },
      }),
    );
    const icon = container.querySelector('.van-radio__icon');
    expect(icon!.className).toContain('van-radio__icon--square');
    expect(icon!.className).not.toContain('van-radio__icon--round');
  });

  it('should render dot shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1', shape: 'dot' }, {
            default: () => h('text', null, 'A'),
          });
        },
      }),
    );
    const icon = container.querySelector('.van-radio__icon');
    expect(icon!.className).toContain('van-radio__icon--dot');
    // Dot has inner icon element
    expect(container.querySelector('.van-radio__icon--dot__icon')).toBeTruthy();
  });

  it('should apply checkedColor inline style when checked', async () => {
    const Comp = defineComponent({
      setup() {
        const value = ref('1');
        return () =>
          h(RadioGroup, { modelValue: value.value, 'onUpdate:modelValue': (v: unknown) => { value.value = v as string; } }, {
            default: () => [
              h(Radio, { name: '1', checkedColor: '#ee0a24' }, {
                default: () => h('text', null, 'A'),
              }),
            ],
          });
      },
    });

    const { container } = render(Comp);
    const vanIcon = container.querySelector('.van-icon');
    if (vanIcon) {
      // The checked radio should have inline borderColor/backgroundColor
      // Browser normalizes hex to rgb()
      const style = (vanIcon as HTMLElement).style;
      expect(style.borderColor).toBeTruthy();
      expect(style.backgroundColor).toBeTruthy();
    }
  });

  it('should support custom icon slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1' }, {
            default: () => h('text', null, 'A'),
            icon: ({ checked }: { checked: boolean }) =>
              h('text', null, checked ? 'ON' : 'OFF'),
          });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const offText = Array.from(texts).find(t => t.textContent === 'OFF');
    expect(offText).toBeTruthy();
  });

  it('should emit click event', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Radio,
            {
              name: 'a',
              onClick: (e: any) => clicks.push(e),
            },
            { default: () => h('text', null, 'A') },
          );
      },
    });

    const { container } = render(Comp);
    const icon = container.querySelector('.van-radio__icon');
    fireEvent.tap(icon!);
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should apply iconSize via inline style', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: '1', iconSize: '24px' }, {
            default: () => h('text', null, 'A'),
          });
        },
      }),
    );
    const icon = container.querySelector('.van-radio__icon') as HTMLElement;
    expect(icon.style.fontSize).toBe('24px');
  });
});

describe('Radio with RadioGroup', () => {
  it('should render checked state from group modelValue', () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RadioGroup, { modelValue: 'a' }, {
              default: () => [
                h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Radio, { name: 'b' }, { default: () => h('text', null, 'B') }),
              ],
            });
        },
      }),
    );
    const radios = container.querySelectorAll('.van-radio__icon');
    expect(radios[0]!.className).toContain('van-radio__icon--checked');
    expect(radios[1]!.className).not.toContain('van-radio__icon--checked');
  });

  it('should update group value when radio is clicked', async () => {
    const updates: unknown[] = [];
    const Comp = defineComponent({
      setup() {
        const value = ref('a');
        return () =>
          h(RadioGroup, {
            modelValue: value.value,
            'onUpdate:modelValue': (v: unknown) => {
              updates.push(v);
              value.value = v as string;
            },
          }, {
            default: () => [
              h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
              h(Radio, { name: 'b' }, { default: () => h('text', null, 'B') }),
            ],
          });
      },
    });

    const { container } = render(Comp);
    const radios = container.querySelectorAll('.van-radio__icon');
    fireEvent.tap(radios[1]!);
    await nextTick();
    expect(updates).toEqual(['b']);
  });

  it('should disable all radios when group is disabled', () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RadioGroup, { modelValue: 'a', disabled: true }, {
              default: () => [
                h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Radio, { name: 'b' }, { default: () => h('text', null, 'B') }),
              ],
            });
        },
      }),
    );
    const radios = container.querySelectorAll('.van-radio');
    expect(radios[0]!.className).toContain('van-radio--disabled');
    expect(radios[1]!.className).toContain('van-radio--disabled');
  });

  it('should emit change event from group when value changes', async () => {
    const changes: unknown[] = [];
    const value = ref('a');
    const Comp = defineComponent({
      setup() {
        return () =>
          h(RadioGroup, {
            modelValue: value.value,
            'onUpdate:modelValue': (v: unknown) => { value.value = v as string; },
            onChange: (v: unknown) => changes.push(v),
          }, {
            default: () => [
              h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
              h(Radio, { name: 'b' }, { default: () => h('text', null, 'B') }),
            ],
          });
      },
    });

    render(Comp);
    value.value = 'b';
    await nextTick();
    expect(changes).toContain('b');
  });

  it('should apply group shape to radios', () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RadioGroup, { modelValue: 'a', shape: 'square' }, {
              default: () => [
                h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
              ],
            });
        },
      }),
    );
    const icon = container.querySelector('.van-radio__icon');
    expect(icon!.className).toContain('van-radio__icon--square');
  });

  it('should apply horizontal direction class', () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RadioGroup, { modelValue: 'a', direction: 'horizontal' }, {
              default: () => [
                h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
                h(Radio, { name: 'b' }, { default: () => h('text', null, 'B') }),
              ],
            });
        },
      }),
    );
    const group = container.querySelector('.van-radio-group');
    expect(group).toBeTruthy();
    expect(group!.className).toContain('van-radio-group--horizontal');
    // Radios should have horizontal modifier
    const radios = container.querySelectorAll('.van-radio');
    expect(radios[0]!.className).toContain('van-radio--horizontal');
  });

  it('should render radio-group with BEM root class', () => {
    const { container } = render(
      defineComponent({
        setup() {
          return () =>
            h(RadioGroup, { modelValue: 'a' }, {
              default: () => [
                h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
              ],
            });
        },
      }),
    );
    expect(container.querySelector('.van-radio-group')).toBeTruthy();
  });
});
