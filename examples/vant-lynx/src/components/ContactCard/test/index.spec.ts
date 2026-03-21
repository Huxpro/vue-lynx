import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ContactCard from '../index.vue';

describe('ContactCard', () => {
  it('should render add type', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'add' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasAddText = Array.from(textEls).some((t) => t.textContent === 'Add Contact Info');
    expect(hasAddText).toBe(true);
  });

  it('should render edit type with name and tel', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'edit', name: 'John Doe', tel: '13800138000' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasName = Array.from(textEls).some((t) => t.textContent === 'John Doe');
    const hasTel = Array.from(textEls).some((t) => t.textContent === '13800138000');
    expect(hasName).toBe(true);
    expect(hasTel).toBe(true);
  });

  it('should render non-editable card', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'edit', name: 'Jane', tel: '123', editable: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasName = Array.from(textEls).some((t) => t.textContent === 'Jane');
    expect(hasName).toBe(true);
    // Arrow indicator should not be rendered when not editable
    const hasArrow = Array.from(textEls).some((t) => t.textContent === '\u203A');
    expect(hasArrow).toBe(false);
  });

  it('should render custom add text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactCard, { type: 'add', addText: 'New Contact' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustomText = Array.from(textEls).some((t) => t.textContent === 'New Contact');
    expect(hasCustomText).toBe(true);
  });
});
