/**
 * defineModel tests — verify that the mergeModels compiler helper is exported
 * and that defineModel works alongside explicit defineProps / defineEmits.
 *
 * Regression coverage for https://github.com/Huxpro/vue-lynx/issues/186
 */

import { describe, it, expect } from 'vitest';
import {
  h,
  defineComponent,
  ref,
  nextTick,
  mergeModels,
  useModel,
} from 'vue-lynx';
import { render, fireEvent } from '../index.js';

describe('defineModel', () => {
  it('exports mergeModels helper', () => {
    expect(typeof mergeModels).toBe('function');
  });

  it('mergeModels merges array and object model declarations', () => {
    // Simulates what the Vue 3.4+ compiler generates when defineModel()
    // is used together with defineProps({ extra: String }).
    const merged = mergeModels(
      { extra: { type: String } },
      { modelValue: {} },
    );
    expect(merged).toHaveProperty('extra');
    expect(merged).toHaveProperty('modelValue');
  });

  it('component using useModel alongside extra props renders correctly', async () => {
    // This mirrors compiled output of:
    //   defineProps({ label: String })
    //   const model = defineModel<string>()
    const Child = defineComponent({
      props: mergeModels(
        { label: { type: String, default: '' } },
        { modelValue: {}, 'modelValue:modifiers': {} },
      ),
      emits: ['update:modelValue'],
      setup(props) {
        const model = useModel(props, 'modelValue');
        return () =>
          h('view', null, [
            h('text', null, `${props.label}:${model.value}`),
          ]);
      },
    });

    const value = ref('hello');
    const Parent = defineComponent({
      setup() {
        return () =>
          h(Child, {
            label: 'field',
            modelValue: value.value,
            'onUpdate:modelValue': (v: string) => {
              value.value = v;
            },
          });
      },
    });

    const { container } = render(Parent);
    await nextTick();
    await nextTick();

    const text = container.querySelector('text');
    expect(text?.textContent).toBe('field:hello');
  });
});
