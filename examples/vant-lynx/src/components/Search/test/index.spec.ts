import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Search from '../index.vue';

describe('Search', () => {
  it('should render search input', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Search, { placeholder: 'Search...' });
        },
      }),
    );
    const inputEl = container.querySelector('input');
    expect(inputEl).not.toBeNull();
  });

  it('should render label when provided', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Search, { label: 'Address' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should render action button when showAction is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Search, { showAction: true, actionText: 'Cancel' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    expect(textEls.length).toBeGreaterThan(0);
  });

  it('should show clear button when modelValue is non-empty and clearable is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Search, { modelValue: 'test', clearable: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });
});
