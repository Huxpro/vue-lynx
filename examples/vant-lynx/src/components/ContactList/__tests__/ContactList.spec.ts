import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ContactList from '../index.vue';

describe('ContactList', () => {
  const list = [
    { id: '1', name: 'John', tel: '13000000000', isDefault: true },
    { id: '2', name: 'Jane', tel: '13100000000' },
  ];

  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { list, modelValue: '1' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render contact items', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { list, modelValue: '1' });
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
          return h(ContactList, { list, modelValue: '1', defaultTagText: 'Default' });
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
          return h(ContactList, { list: [], addText: 'New Contact' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('New Contact');
  });

  it('should show empty state when no contacts', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactList, { list: [] });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('No contacts');
  });
});
