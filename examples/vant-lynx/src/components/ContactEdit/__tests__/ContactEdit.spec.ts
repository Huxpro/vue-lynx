import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import ContactEdit from '../index.vue';

describe('ContactEdit', () => {
  it('should render component', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, {});
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render name and tel fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, {});
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Name');
    expect(textContents).toContain('Tel');
  });

  it('should show save button', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, {});
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Save');
  });

  it('should show delete button when isEdit is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { isEdit: true });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Delete');
  });

  it('should show set default switch when showSetDefault is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(ContactEdit, { showSetDefault: true, setDefaultLabel: 'Set Default' });
        },
      }),
    );
    const texts = container.querySelectorAll('text');
    const textContents = Array.from(texts).map(t => t.textContent);
    expect(textContents).toContain('Set Default');
  });
});
