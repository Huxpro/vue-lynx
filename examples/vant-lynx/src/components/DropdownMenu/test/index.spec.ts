import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import DropdownMenu from '../index.vue';
import DropdownItem from '../../DropdownItem/index.vue';

describe('DropdownMenu', () => {
  it('should render menu bar with items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(DropdownMenu, {}, {
            default: () => [
              h(DropdownItem, {
                modelValue: 'a',
                title: 'Filter 1',
                options: [
                  { text: 'Option A', value: 'a' },
                  { text: 'Option B', value: 'b' },
                ],
              }),
              h(DropdownItem, {
                modelValue: 1,
                title: 'Filter 2',
                options: [
                  { text: 'Sort 1', value: 1 },
                  { text: 'Sort 2', value: 2 },
                ],
              }),
            ],
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThanOrEqual(2);
  });

  it('should render title text from title prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(DropdownMenu, {}, {
            default: () =>
              h(DropdownItem, {
                modelValue: '',
                title: 'My Title',
                options: [],
              }),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTitle = Array.from(textEls).some((t) => t.textContent === 'My Title');
    expect(hasTitle).toBe(true);
  });
});
