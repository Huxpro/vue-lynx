import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Field from '../index.vue';

describe('Field', () => {
  it('should render with label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Username' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasLabel = Array.from(textEls).some(
      (t) => t.textContent === 'Username',
    );
    expect(hasLabel).toBe(true);
  });

  it('should render input element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Email',
            placeholder: 'Enter email',
          });
        },
      }),
    );
    const inputEl = container.querySelector('input');
    expect(inputEl).not.toBeNull();
  });
});
