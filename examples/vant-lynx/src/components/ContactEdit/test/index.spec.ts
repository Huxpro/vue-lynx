import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ContactEdit from '../index.vue';

describe('ContactEdit', () => {
  it('should render edit form with name and tel fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasName = Array.from(textEls).some((t) => t.textContent === 'Name');
    const hasTel = Array.from(textEls).some((t) => t.textContent === 'Tel');
    expect(hasName).toBe(true);
    expect(hasTel).toBe(true);
  });

  it('should render with contact info', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, {
            contactInfo: { name: 'John Doe', tel: '13800138000' },
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render save button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSave = Array.from(textEls).some((t) => t.textContent === 'Save');
    expect(hasSave).toBe(true);
  });

  it('should render delete button when isEdit is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isEdit: true });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === 'Delete');
    expect(hasDelete).toBe(true);
  });

  it('should not render delete button when isEdit is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isEdit: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === 'Delete');
    expect(hasDelete).toBe(false);
  });
});
