import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ContactCard from '../index.vue';

describe('ContactCard', () => {
  it('should render add type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'add', addText: 'Add Contact' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Add Contact');
  });

  it('should render edit type with name and tel', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'edit', name: 'John', tel: '13000000000' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('John');
    expect(textContents).toContain('13000000000');
  });

  it('should render add icon in add mode', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'add' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('+');
  });

  it('should render default add text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'add' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Add Contact Info');
  });
});
