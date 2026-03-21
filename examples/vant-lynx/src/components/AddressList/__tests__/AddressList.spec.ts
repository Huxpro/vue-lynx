import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import AddressList from '../index.vue';

describe('AddressList', () => {
  const list = [
    { id: '1', name: 'John', tel: '13000000000', address: '123 Main St', isDefault: true },
    { id: '2', name: 'Jane', tel: '13100000000', address: '456 Oak Ave' },
  ];

  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list, modelValue: '1' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render address items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list, modelValue: '1' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('John');
    expect(textContents).toContain('Jane');
  });

  it('should show default tag', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list, modelValue: '1', defaultTagText: 'Default' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Default');
  });

  it('should show add button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list, addButtonText: 'Add Address' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Add Address');
  });

  it('should render disabled list', () => {
    const disabledList = [
      { id: '3', name: 'Bob', tel: '13200000000', address: '789 Pine Rd' },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list: [], disabledList });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Bob');
  });
});
