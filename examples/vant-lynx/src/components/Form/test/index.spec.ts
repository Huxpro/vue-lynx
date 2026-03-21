import { describe, it, expect } from 'vitest';
import { h, defineComponent } from 'vue-lynx';
import { render } from 'vue-lynx-testing-library';
import Form from '../index.vue';

describe('Form', () => {
  it('should render form container', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form);
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render slot content', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form, null, {
            default: () => h('view', null, [h('text', null, 'Field Content')]),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasContent = Array.from(textEls).some((t) => t.textContent === 'Field Content');
    expect(hasContent).toBe(true);
  });

  it('should render with custom label width', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form, { labelWidth: 120 });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with labelAlign center', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form, { labelAlign: 'center' });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with disabled state', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form, { disabled: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render with colon enabled', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form, { colon: true });
        },
      }),
    );
    const views = container.querySelectorAll('view');
    expect(views.length).toBeGreaterThan(0);
  });

  it('should render footer slot', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form, null, {
            footer: () => h('view', null, [h('text', null, 'Submit')]),
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasSubmit = Array.from(textEls).some((t) => t.textContent === 'Submit');
    expect(hasSubmit).toBe(true);
  });
});
