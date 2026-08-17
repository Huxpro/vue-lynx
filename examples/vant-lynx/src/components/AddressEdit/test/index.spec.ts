import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import AddressEdit from '../index.vue';

describe('AddressEdit', () => {
  it('should render form fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit);
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasName = Array.from(textEls).some((t) => t.textContent === 'Name');
    const hasTel = Array.from(textEls).some((t) => t.textContent === 'Tel');
    expect(hasName).toBe(true);
    expect(hasTel).toBe(true);
  });

  it('should render with addressInfo', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, {
            addressInfo: {
              name: 'John Doe',
              tel: '13800138000',
              province: 'Beijing',
              city: 'Beijing',
              county: 'Chaoyang',
              addressDetail: '123 Main St',
            },
          });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render delete button when showDelete is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showDelete: true, deleteButtonText: 'Delete Address' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === 'Delete Address');
    expect(hasDelete).toBe(true);
  });

  it('should not render delete button when showDelete is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showDelete: false });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasDelete = Array.from(textEls).some((t) => t.textContent === 'Delete');
    expect(hasDelete).toBe(false);
  });

  it('should render save button with custom text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { saveButtonText: 'Submit' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSave = Array.from(textEls).some((t) => t.textContent === 'Submit');
    expect(hasSave).toBe(true);
  });
});
