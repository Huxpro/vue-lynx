import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ContactList from '../index.vue';

describe('ContactList', () => {
  const list = [
    { id: '1', name: 'John', tel: '123-456-7890', isDefault: true },
    { id: '2', name: 'Jane', tel: '098-765-4321', isDefault: false },
  ];

  it('should render contact list', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { list, modelValue: '1' });
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
          return h(ContactList, { list, addText: 'Add Contact' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasAddText = Array.from(textEls).some((t) => t.textContent === 'Add Contact');
    expect(hasAddText).toBe(true);
  });

  it('should render empty state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { list: [] });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render default tag text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { list, modelValue: '1', defaultTagText: 'Default' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDefault = Array.from(textEls).some((t) => t.textContent === 'Default');
    expect(hasDefault).toBe(true);
  });

  it('should render telephone numbers', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { list, modelValue: '1' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasTel = Array.from(textEls).some((t) =>
      t.textContent?.includes('123-456-7890'),
    );
    expect(hasTel).toBe(true);
  });
});
