import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import AddressList from '../index.vue';

const list = [
  { id: '1', name: 'John', tel: '123', address: '123 Main St', isDefault: true },
  { id: '2', name: 'Jane', tel: '456', address: '456 Oak Ave', isDefault: false },
];

describe('AddressList', () => {
  it('should render list items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasJohn = Array.from(textEls).some((t) => t.textContent === 'John');
    const hasJane = Array.from(textEls).some((t) => t.textContent === 'Jane');
    expect(hasJohn).toBe(true);
    expect(hasJane).toBe(true);
  });

  it('should render add button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list, addButtonText: 'Add New Address' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasAddBtn = Array.from(textEls).some((t) => t.textContent === 'Add New Address');
    expect(hasAddBtn).toBe(true);
  });

  it('should render disabled list', () => {
    const disabledList = [
      { id: '3', name: 'Bob', tel: '789', address: '789 Elm Dr', isDefault: false },
    ];
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list: [], disabledList });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasBob = Array.from(textEls).some((t) => t.textContent === 'Bob');
    const hasDisabledLabel = Array.from(textEls).some((t) => t.textContent === 'Disabled Addresses');
    expect(hasBob).toBe(true);
    expect(hasDisabledLabel).toBe(true);
  });

  it('should render default tag text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list, defaultTagText: 'Default' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDefault = Array.from(textEls).some((t) => t.textContent === 'Default');
    expect(hasDefault).toBe(true);
  });

  it('should render with custom add button text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressList, { list: [], addButtonText: 'Create Address' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomBtn = Array.from(textEls).some((t) => t.textContent === 'Create Address');
    expect(hasCustomBtn).toBe(true);
  });
});
