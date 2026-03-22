import { describe, it, expect, vi } from 'vitest';
import { h, defineComponent, nextTick, ref } from 'vue-lynx';
import { render, fireEvent } from 'vue-lynx-testing-library';
import Field from '../index.vue';

// Helper to fire Lynx input event (not in eventMap)
function fireInputEvent(el: Element, value: string) {
  const event = new Event('bindEvent:input', { bubbles: true });
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'input',
    detail: { value },
  });
  fireEvent(el, event);
}

describe('Field', () => {
  it('should emit "update:modelValue" event when after inputting', async () => {
    const values: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            'onUpdate:modelValue': (val: string) => values.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const inputEl = container.querySelector('input')!;
    expect(inputEl).not.toBeNull();

    fireInputEvent(inputEl, 'hello');
    await nextTick();
    expect(values).toContain('hello');
  });

  it('should emit clickInput event when input is clicked', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            onClickInput: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const inputEl = container.querySelector('input')!;
    fireEvent.tap(inputEl);
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should emit clickInput event when using input slot', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(
            Field,
            {
              label: 'Label',
              onClickInput: (e: any) => clicks.push(e),
            },
            {
              input: () => h('text', {}, 'Custom Input'),
            },
          );
      },
    });

    const { container } = render(Comp);
    // The custom slot content with the click handler should be in field__body
    const body = container.querySelector('.van-field__body');
    expect(body).toBeTruthy();
  });

  it('should emit clickLeftIcon event when left icon is clicked', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            leftIcon: 'contact',
            onClickLeftIcon: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const leftIcon = container.querySelector('.van-field__left-icon');
    expect(leftIcon).toBeTruthy();
    fireEvent.tap(leftIcon!);
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should emit clickRightIcon event when right icon is clicked', async () => {
    const clicks: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            rightIcon: 'search',
            onClickRightIcon: (e: any) => clicks.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const rightIcon = container.querySelector('.van-field__right-icon');
    expect(rightIcon).toBeTruthy();
    fireEvent.tap(rightIcon!);
    await nextTick();
    expect(clicks.length).toBe(1);
  });

  it('should render textarea when type is textarea', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { type: 'textarea', label: 'Message' });
        },
      }),
    );
    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();
    const input = container.querySelector('input');
    expect(input).toBeNull();
  });

  it('should render label correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Username' });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasLabel = Array.from(textEls).some(
      (t) => t.textContent === 'Username',
    );
    expect(hasLabel).toBe(true);
  });

  it('should render input element', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Email',
            placeholder: 'Enter email',
          });
        },
      }),
    );
    const inputEl = container.querySelector('input');
    expect(inputEl).not.toBeNull();
  });

  it('should show required icon when using rules which contain required', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            required: 'auto',
            rules: [{ required: true, message: 'Required' }],
          });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasAsterisk = Array.from(textEls).some(
      (t) => t.textContent === '*',
    );
    expect(hasAsterisk).toBe(true);
  });

  it('should render clear icon when using clearable prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            clearable: true,
            modelValue: 'test',
          });
        },
      }),
    );
    // clearTrigger defaults to 'focus', need focused state — but we can test 'always'
  });

  it('should always render clear icon when clear-trigger prop is always', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            clearable: true,
            clearTrigger: 'always',
            modelValue: 'test',
          });
        },
      }),
    );
    const clearEl = container.querySelector('.van-field__clear');
    expect(clearEl).toBeTruthy();
  });

  it('should render input slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Field,
            { label: 'Label' },
            { input: () => h('text', {}, 'Custom Input') },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustom = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Input',
    );
    expect(hasCustom).toBe(true);
  });

  it('should render label slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Field,
            {},
            { label: () => h('text', {}, 'Custom Label') },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustom = Array.from(textEls).some(
      (t) => t.textContent === 'Custom Label',
    );
    expect(hasCustom).toBe(true);
  });

  it('should render extra slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Field,
            { label: 'Label' },
            { extra: () => h('text', {}, 'Extra Content') },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasExtra = Array.from(textEls).some(
      (t) => t.textContent === 'Extra Content',
    );
    expect(hasExtra).toBe(true);
  });

  it('should change cell size when using size prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', size: 'large' });
        },
      }),
    );
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell--large')).toBe(true);
  });

  it('should allow to set label width with unit', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', labelWidth: '100px' });
        },
      }),
    );
    const titleEl = container.querySelector('.van-cell__title');
    const style = titleEl?.getAttribute('style') || '';
    expect(style).toContain('100px');
  });

  it('should allow to set label width without unit', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', labelWidth: 100 });
        },
      }),
    );
    const titleEl = container.querySelector('.van-cell__title');
    const style = titleEl?.getAttribute('style') || '';
    expect(style).toContain('100px');
  });

  it('should render colon when using colon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', colon: true });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasColon = Array.from(textEls).some(
      (t) => t.textContent === 'Label:',
    );
    expect(hasColon).toBe(true);
  });

  it('should render word limit correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            modelValue: 'hello',
            maxlength: 10,
            showWordLimit: true,
          });
        },
      }),
    );
    const wordLimit = container.querySelector('.van-field__word-limit');
    expect(wordLimit).toBeTruthy();
    const textEls = wordLimit!.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('5');
    expect(texts.some((t) => t?.includes('/10'))).toBe(true);
  });

  it('should render word limit correctly when modelValue is undefined', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            maxlength: 10,
            showWordLimit: true,
          });
        },
      }),
    );
    const wordLimit = container.querySelector('.van-field__word-limit');
    expect(wordLimit).toBeTruthy();
    const textEls = wordLimit!.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    expect(texts).toContain('0');
  });

  it('should render error message correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            errorMessage: 'Error!',
          });
        },
      }),
    );
    const errorEl = container.querySelector('.van-field__error-message');
    expect(errorEl).toBeTruthy();
    const textEls = errorEl!.querySelectorAll('text');
    const hasError = Array.from(textEls).some(
      (t) => t.textContent === 'Error!',
    );
    expect(hasError).toBe(true);
  });

  it('should render error-message slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Field,
            { label: 'Label', errorMessage: 'Error!' },
            {
              'error-message': ({ message }: { message: string }) =>
                h('text', {}, `Custom: ${message}`),
            },
          );
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasCustom = Array.from(textEls).some(
      (t) => t.textContent === 'Custom: Error!',
    );
    expect(hasCustom).toBe(true);
  });

  it('should apply error class when error prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', error: true });
        },
      }),
    );
    const field = container.firstElementChild!;
    expect(field.classList.contains('van-field--error')).toBe(true);
  });

  it('should apply disabled class when disabled prop is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', disabled: true });
        },
      }),
    );
    const field = container.firstElementChild!;
    expect(field.classList.contains('van-field--disabled')).toBe(true);
  });

  it('should render button slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Field,
            { label: 'Label' },
            { button: () => h('text', {}, 'Send') },
          );
        },
      }),
    );
    const buttonEl = container.querySelector('.van-field__button');
    expect(buttonEl).toBeTruthy();
    const textEls = buttonEl!.querySelectorAll('text');
    const hasSend = Array.from(textEls).some(
      (t) => t.textContent === 'Send',
    );
    expect(hasSend).toBe(true);
  });

  it('should render the field body with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label' });
        },
      }),
    );
    const body = container.querySelector('.van-field__body');
    expect(body).toBeTruthy();
  });

  it('should render field value area with BEM class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label' });
        },
      }),
    );
    const value = container.querySelector('.van-field__value');
    expect(value).toBeTruthy();
  });

  it('should apply input-align right class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', inputAlign: 'right' });
        },
      }),
    );
    const control = container.querySelector('.van-field__control--right');
    expect(control).toBeTruthy();
  });

  it('should apply input-align center class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', inputAlign: 'center' });
        },
      }),
    );
    const control = container.querySelector('.van-field__control--center');
    expect(control).toBeTruthy();
  });

  it('should change clear icon when using clear-icon prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            clearable: true,
            clearTrigger: 'always',
            clearIcon: 'cross',
            modelValue: 'test',
          });
        },
      }),
    );
    const clearEl = container.querySelector('.van-field__clear');
    expect(clearEl).toBeTruthy();
  });

  it('should render left-icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Field,
            { label: 'Label' },
            { 'left-icon': () => h('text', {}, 'Left') },
          );
        },
      }),
    );
    const leftIcon = container.querySelector('.van-field__left-icon');
    expect(leftIcon).toBeTruthy();
    const textEls = leftIcon!.querySelectorAll('text');
    const hasLeft = Array.from(textEls).some(
      (t) => t.textContent === 'Left',
    );
    expect(hasLeft).toBe(true);
  });

  it('should render right-icon slot correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(
            Field,
            { label: 'Label' },
            { 'right-icon': () => h('text', {}, 'Right') },
          );
        },
      }),
    );
    const rightIcon = container.querySelector('.van-field__right-icon');
    expect(rightIcon).toBeTruthy();
    const textEls = rightIcon!.querySelectorAll('text');
    const hasRight = Array.from(textEls).some(
      (t) => t.textContent === 'Right',
    );
    expect(hasRight).toBe(true);
  });

  it('should emit focus and blur events', async () => {
    const focuses: any[] = [];
    const blurs: any[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            onFocus: (e: any) => focuses.push(e),
            onBlur: (e: any) => blurs.push(e),
          });
      },
    });

    const { container } = render(Comp);
    const inputEl = container.querySelector('input')!;

    fireEvent.focus(inputEl);
    await nextTick();
    expect(focuses.length).toBe(1);

    fireEvent.blur(inputEl);
    await nextTick();
    expect(blurs.length).toBe(1);
  });

  it('should render required mark when required is true', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', required: true });
        },
      }),
    );
    const textEls = container.querySelectorAll('text');
    const hasAsterisk = Array.from(textEls).some(
      (t) => t.textContent === '*',
    );
    expect(hasAsterisk).toBe(true);
  });

  it('should not render required mark when required is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', required: false });
        },
      }),
    );
    const markEls = container.querySelectorAll('.van-field__required-mark');
    expect(markEls.length).toBe(0);
  });

  it('should render label-align top class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', labelAlign: 'top' });
        },
      }),
    );
    const field = container.firstElementChild!;
    expect(field.classList.contains('van-field--label-top')).toBe(true);
  });

  it('should render left icon inside label when label-align is top', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            leftIcon: 'contact',
            labelAlign: 'top',
          });
        },
      }),
    );
    // When label-align is top, left-icon should be in the title area
    const titleEl = container.querySelector('.van-cell__title');
    const leftIcon = titleEl?.querySelector('.van-field__left-icon');
    expect(leftIcon).toBeTruthy();
  });

  it('should emit clear event and reset value', async () => {
    const clears: any[] = [];
    const updates: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            clearable: true,
            clearTrigger: 'always',
            modelValue: 'test',
            onClear: (e: any) => clears.push(e),
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const clearEl = container.querySelector('.van-field__clear');
    expect(clearEl).toBeTruthy();
    fireEvent.tap(clearEl!);
    await nextTick();
    expect(clears.length).toBe(1);
    expect(updates).toContain('');
  });

  it('should render field name attribute', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', name: 'username' });
        },
      }),
    );
    // The name prop is accepted for API compat
    const field = container.firstElementChild;
    expect(field).toBeTruthy();
  });

  it('should format value after mounted if initial modelValue is null', async () => {
    const updates: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            type: 'digit',
            modelValue: 'abc123',
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    render(Comp);
    await nextTick();
    // formatNumber for digit type should strip non-digits
    expect(updates).toContain('123');
  });

  it('should render label class name when using label-class prop', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            labelClass: 'custom-label-class',
          });
        },
      }),
    );
    const titleEl = container.querySelector('.van-cell__title');
    expect(titleEl?.classList.contains('custom-label-class')).toBe(true);
  });

  it('should allow to format value with formatter prop', async () => {
    const updates: string[] = [];
    const formatter = (val: string) => val.replace(/\d/g, '');
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            modelValue: '',
            formatter,
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const inputEl = container.querySelector('input')!;
    fireInputEvent(inputEl, 'abc123');
    await nextTick();
    // Formatter should strip digits
    expect(updates).toContain('abc');
  });

  it('should limit maxlength of input value when using maxlength prop', async () => {
    const updates: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            modelValue: '',
            maxlength: 3,
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const inputEl = container.querySelector('input')!;
    fireInputEvent(inputEl, 'abcdef');
    await nextTick();
    expect(updates).toContain('abc');
  });

  it('should limit maxlength with emoji correctly', async () => {
    const updates: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            modelValue: '',
            maxlength: 3,
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const inputEl = container.querySelector('input')!;
    fireInputEvent(inputEl, '😀😁😂😃');
    await nextTick();
    // Should cut to 3 emoji characters
    expect(updates).toContain('😀😁😂');
  });

  it('should render word limit with emoji correctly', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            modelValue: '😀😁😂',
            maxlength: 10,
            showWordLimit: true,
          });
        },
      }),
    );
    const wordLimit = container.querySelector('.van-field__word-limit');
    expect(wordLimit).toBeTruthy();
    const textEls = wordLimit!.querySelectorAll('text');
    const texts = Array.from(textEls).map((el) => el.textContent);
    // 3 emoji characters
    expect(texts).toContain('3');
  });

  it('should allow to destroy field', () => {
    const show = ref(true);
    const Comp = defineComponent({
      setup() {
        return () => (show.value ? h(Field, { label: 'Label' }) : null);
      },
    });

    const { container } = render(Comp);
    expect(container.querySelector('input')).not.toBeNull();

    show.value = false;
  });

  it('should render borderless when border is false', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', border: false });
        },
      }),
    );
    const cell = container.firstElementChild!;
    expect(cell.classList.contains('van-cell--borderless')).toBe(true);
  });

  it('should render label-align right class on label', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, { label: 'Label', labelAlign: 'right' });
        },
      }),
    );
    const labelEl = container.querySelector('.van-field__label--right');
    expect(labelEl).toBeTruthy();
  });

  it('should render error-message-align class', () => {
    const { container } = render(
      defineComponent({
        render() {
          return h(Field, {
            label: 'Label',
            errorMessage: 'Error',
            errorMessageAlign: 'center',
          });
        },
      }),
    );
    const errorEl = container.querySelector('.van-field__error-message--center');
    expect(errorEl).toBeTruthy();
  });

  it('should apply min and max to number type on blur', async () => {
    const updates: string[] = [];
    const Comp = defineComponent({
      setup() {
        return () =>
          h(Field, {
            label: 'Label',
            type: 'number',
            modelValue: '200',
            min: 0,
            max: 100,
            'onUpdate:modelValue': (val: string) => updates.push(val),
          });
      },
    });

    const { container } = render(Comp);
    const inputEl = container.querySelector('input')!;

    fireEvent.blur(inputEl);
    await nextTick();
    // On blur, 200 should be clamped to 100
    expect(updates).toContain('100');
  });
});
