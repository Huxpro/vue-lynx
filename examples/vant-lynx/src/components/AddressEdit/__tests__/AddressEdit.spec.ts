import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import AddressEdit from '../index.vue';

describe('AddressEdit', () => {
  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, {});
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render form fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, {});
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Name');
    expect(textContents).toContain('Tel');
    expect(textContents).toContain('Detail');
  });

  it('should show save button with custom text', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { saveButtonText: 'Submit' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Submit');
  });

  it('should show delete button when showDelete is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showDelete: true, deleteButtonText: 'Remove' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Remove');
  });

  it('should show postal field when showPostal is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showPostal: true });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Postal');
  });

  it('should show set default switch when showSetDefault is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(AddressEdit, { showSetDefault: true });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Set as default address');
  });
});
