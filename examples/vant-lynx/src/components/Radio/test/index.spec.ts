import { describe, it, expect } from 'vitest';
import { h, ref, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Radio from '../index.vue';
import RadioGroup from '../../RadioGroup/index.vue';

describe('Radio', () => {
  it('should render radio', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: 'option1' }, {
            default: () => h('text', null, 'Option 1'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render checked state within RadioGroup', () => {
    const { container } = render(
      defineComponent({
        setup() {
          const value = ref('a');
          return { value };
        },
        render() {
          return h(RadioGroup, { modelValue: this.value }, {
            default: () => [
              h(Radio, { name: 'a' }, { default: () => h('text', null, 'A') }),
              h(Radio, { name: 'b' }, { default: () => h('text', null, 'B') }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should support disabled prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: 'option1', disabled: true }, {
            default: () => h('text', null, 'Option 1'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should support shape prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: 'option1', shape: 'square' }, {
            default: () => h('text', null, 'Option 1'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should support dot shape', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: 'option1', shape: 'dot' }, {
            default: () => h('text', null, 'Option 1'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should support custom icon slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Radio, { name: 'option1' }, {
            default: () => h('text', null, 'Option 1'),
            icon: ({ checked }: { checked: boolean }) =>
              h('text', null, checked ? 'ON' : 'OFF'),
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
