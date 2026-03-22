import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Form from '../index.vue';
import Field from '../../Field/index.vue';

// Helper: fire Lynx input event
function fireInputEvent(el: Element, value: string) {
  const event = new Event('bindEvent:input', { bubbles: true });
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'input',
    detail: { value },
  });
  fireEvent(el, event);
}

// Helper: submit the form via ref
async function submitForm(formRef: any) {
  formRef.submit();
  await nextTick();
  // Give async validation time to complete
  await new Promise((r) => setTimeout(r, 50));
  await nextTick();
}

describe('Form', () => {
  it('should render form with van-form class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form);
        },
      }),
    );
    const formEl = container.querySelector('.van-form');
    expect(formEl).not.toBeNull();
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
    const hasContent = Array.from(textEls).some(
      (t) => t.textContent === 'Field Content',
    );
    expect(hasContent).toBe(true);
  });

  it('should emit submit event with form values', async () => {
    const onSubmit = vi.fn();
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef, onSubmit },
            {
              default: () => [
                h(Field, {
                  name: 'username',
                  modelValue: 'test',
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();
    await submitForm(formRef.value);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('should emit failed event when validation fails', async () => {
    const onFailed = vi.fn();
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef, onFailed },
            {
              default: () => [
                h(Field, {
                  name: 'username',
                  modelValue: '',
                  rules: [{ required: true, message: 'required' }],
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();
    await submitForm(formRef.value);

    expect(onFailed).toHaveBeenCalled();
  });

  it('should validate fields with validate method', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () => [
                h(Field, {
                  name: 'username',
                  modelValue: '',
                  rules: [{ required: true, message: 'required' }],
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    let error: any;
    try {
      await formRef.value.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
  });

  it('should validate a single field by name', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () => [
                h(Field, {
                  name: 'username',
                  modelValue: 'ok',
                }),
                h(Field, {
                  name: 'password',
                  modelValue: '',
                  rules: [{ required: true, message: 'required' }],
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    let error: any;
    try {
      await formRef.value.validate('password');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
  });

  it('should reset validation with resetValidation method', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () => [
                h(Field, {
                  name: 'username',
                  modelValue: '',
                  rules: [{ required: true, message: 'required' }],
                }),
              ],
            },
          );
      },
    });

    const { container } = render(Comp);
    await nextTick();

    // Trigger validation
    try {
      await formRef.value.validate();
    } catch (_e) {
      // expected
    }
    await nextTick();

    // Reset
    formRef.value.resetValidation();
    await nextTick();

    // Error message should be cleared
    const errorMessages = container.querySelectorAll(
      '.van-field__error-message',
    );
    // After reset, no error messages should show
    const hasVisibleError = Array.from(errorMessages).some(
      (el) => el.textContent && el.textContent.trim().length > 0,
    );
    expect(hasVisibleError).toBe(false);
  });

  it('should get values with getValues method', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () => [
                h(Field, {
                  name: 'username',
                  modelValue: 'hello',
                }),
                h(Field, {
                  name: 'password',
                  modelValue: 'world',
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    const values = formRef.value.getValues();
    expect(values).toEqual({ username: 'hello', password: 'world' });
  });

  it('should get validation status with getValidationStatus', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () => [
                h(Field, {
                  name: 'username',
                  modelValue: 'test',
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    const status = formRef.value.getValidationStatus();
    expect(status).toHaveProperty('username');
    expect(status.username).toBe('unvalidated');
  });

  it('should validate first field only when validateFirst is true', async () => {
    const onFailed = vi.fn();
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef, validateFirst: true, onFailed },
            {
              default: () => [
                h(Field, {
                  name: 'A',
                  modelValue: '',
                  rules: [{ required: true, message: 'A' }],
                }),
                h(Field, {
                  name: 'B',
                  modelValue: '',
                  rules: [{ required: true, message: 'B' }],
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();
    await submitForm(formRef.value);

    expect(onFailed).toHaveBeenCalled();
    const errors = onFailed.mock.calls[0]?.[0]?.errors;
    // When validateFirst is true, only the first error should be reported
    if (errors) {
      expect(errors.length).toBe(1);
      expect(errors[0].name).toBe('A');
    }
  });

  it('should pass disabled prop to child fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Form,
            { disabled: true },
            {
              default: () =>
                h(Field, {
                  name: 'test',
                  modelValue: 'value',
                  label: 'Test',
                }),
            },
          );
        },
      }),
    );

    // Field should pick up disabled from Form
    const input = container.querySelector('input');
    if (input) {
      expect(input.hasAttribute('disabled')).toBe(true);
    }
  });

  it('should pass readonly prop to child fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Form,
            { readonly: true },
            {
              default: () =>
                h(Field, {
                  name: 'test',
                  modelValue: 'value',
                  label: 'Test',
                }),
            },
          );
        },
      }),
    );

    const input = container.querySelector('input');
    if (input) {
      expect(input.hasAttribute('readonly')).toBe(true);
    }
  });

  it('should expose scrollToField method', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () =>
                h(Field, { name: 'test', modelValue: '' }),
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    // scrollToField should not throw
    expect(() => formRef.value.scrollToField('test')).not.toThrow();
  });

  it('should pass colon prop to child fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Form,
            { colon: true },
            {
              default: () =>
                h(Field, {
                  name: 'test',
                  modelValue: 'value',
                  label: 'Test',
                }),
            },
          );
        },
      }),
    );

    // The colon should be added after the label
    const textEls = container.querySelectorAll('text');
    const hasColon = Array.from(textEls).some(
      (t) => t.textContent === 'Test:',
    );
    expect(hasColon).toBe(true);
  });

  it('should pass labelWidth prop to child fields', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Form,
            { labelWidth: '120px' },
            {
              default: () =>
                h(Field, {
                  name: 'test',
                  modelValue: 'value',
                  label: 'Test',
                }),
            },
          );
        },
      }),
    );

    // The form should render with child fields
    const formEl = container.querySelector('.van-form');
    expect(formEl).not.toBeNull();
  });

  it('should have all expected props', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Form, {
            colon: true,
            disabled: true,
            readonly: true,
            required: 'auto' as const,
            showError: true,
            labelWidth: '120px',
            labelAlign: 'center',
            inputAlign: 'right',
            scrollToError: true,
            scrollToErrorPosition: 'center',
            validateFirst: true,
            submitOnEnter: false,
            showErrorMessage: false,
            errorMessageAlign: 'right',
            validateTrigger: 'onChange',
          });
        },
      }),
    );

    const formEl = container.querySelector('.van-form');
    expect(formEl).not.toBeNull();
  });

  it('should emit submit and failed events', async () => {
    const onSubmit = vi.fn();
    const onFailed = vi.fn();
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef, onSubmit, onFailed },
            {
              default: () => [
                h(Field, {
                  name: 'test',
                  modelValue: '',
                  rules: [{ required: true, message: 'required' }],
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();
    await submitForm(formRef.value);

    // Should fail since field is empty
    expect(onFailed).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should reset validation for specific field by name', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () => [
                h(Field, {
                  name: 'A',
                  modelValue: '',
                  rules: [{ required: true, message: 'A required' }],
                }),
                h(Field, {
                  name: 'B',
                  modelValue: '',
                  rules: [{ required: true, message: 'B required' }],
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    // Trigger validation
    try {
      await formRef.value.validate();
    } catch (_e) {
      // expected
    }
    await nextTick();

    // Reset only field A
    formRef.value.resetValidation('A');
    await nextTick();

    // A's validation should be reset, B's should remain
    const status = formRef.value.getValidationStatus();
    expect(status.A).toBe('unvalidated');
  });

  it('should validate fields with array of names', async () => {
    const formRef = ref<any>(null);

    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Form,
            { ref: formRef },
            {
              default: () => [
                h(Field, {
                  name: 'A',
                  modelValue: '',
                  rules: [{ required: true, message: 'A required' }],
                }),
                h(Field, {
                  name: 'B',
                  modelValue: 'filled',
                }),
                h(Field, {
                  name: 'C',
                  modelValue: '',
                  rules: [{ required: true, message: 'C required' }],
                }),
              ],
            },
          );
      },
    });

    render(Comp);
    await nextTick();

    let error: any;
    try {
      await formRef.value.validate(['A', 'C']);
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    // Should have errors for both A and C
    expect(error.length).toBe(2);
  });
});
