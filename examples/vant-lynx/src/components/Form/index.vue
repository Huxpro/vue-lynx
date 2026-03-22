<!--
  Lynx Limitations:
  - <form> element: Lynx has no <form> element, uses <view> instead
  - native-type="submit": No native form submission in Lynx
  - scrollToField: No scrollIntoView in Lynx
  - submitOnEnter: Keyboard behavior differs in Lynx native input
  - scrollToErrorPosition: ScrollLogicalPosition not applicable in Lynx
-->
<script setup lang="ts">
import { provide, reactive } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { FORM_KEY } from './types';
import type { FormFieldExpose, FormExpose } from './types';
import type { FieldTextAlign, FieldValidateTrigger, FieldValidateError, FieldValidationStatus } from '../Field/types';
import './index.less';

const [, bem] = createNamespace('form');

export interface FormProps {
  colon?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean | 'auto';
  showError?: boolean;
  labelWidth?: number | string;
  labelAlign?: FieldTextAlign;
  inputAlign?: FieldTextAlign;
  scrollToError?: boolean;
  scrollToErrorPosition?: string;
  validateFirst?: boolean;
  submitOnEnter?: boolean;
  showErrorMessage?: boolean;
  errorMessageAlign?: FieldTextAlign;
  validateTrigger?: FieldValidateTrigger | FieldValidateTrigger[];
}

const props = withDefaults(defineProps<FormProps>(), {
  colon: false,
  disabled: false,
  readonly: false,
  showError: false,
  scrollToError: false,
  validateFirst: false,
  submitOnEnter: true,
  showErrorMessage: true,
  validateTrigger: 'onBlur',
});

const emit = defineEmits<{
  submit: [values: Record<string, unknown>];
  failed: [errorInfo: { values: Record<string, unknown>; errors: FieldValidateError[] }];
}>();

// Field registration — children register themselves via provide/inject
const fields: FormFieldExpose[] = [];

const registerField = (field: FormFieldExpose) => {
  if (!fields.includes(field)) {
    fields.push(field);
  }
};

const unregisterField = (field: FormFieldExpose) => {
  const idx = fields.indexOf(field);
  if (idx > -1) {
    fields.splice(idx, 1);
  }
};

const getFieldsByNames = (names?: string[]) => {
  if (names) {
    return fields.filter((field) => field.name !== undefined && names.includes(field.name));
  }
  return fields;
};

const validateSeq = (names?: string[]) =>
  new Promise<void>((resolve, reject) => {
    const errors: FieldValidateError[] = [];
    const targetFields = getFieldsByNames(names);

    targetFields
      .reduce(
        (promise, field) =>
          promise.then(() => {
            if (!errors.length) {
              return field.validate().then((error?: FieldValidateError | void) => {
                if (error) {
                  errors.push(error);
                }
              });
            }
          }),
        Promise.resolve(),
      )
      .then(() => {
        if (errors.length) {
          reject(errors);
        } else {
          resolve();
        }
      });
  });

const validateAll = (names?: string[]) =>
  new Promise<void>((resolve, reject) => {
    const targetFields = getFieldsByNames(names);
    Promise.all(targetFields.map((field) => field.validate())).then(
      (errors: any[]) => {
        errors = errors.filter(Boolean);
        if (errors.length) {
          reject(errors);
        } else {
          resolve();
        }
      },
    );
  });

const validateField = (name: string) => {
  const matched = fields.find((field) => field.name === name);

  if (matched) {
    return new Promise<void>((resolve, reject) => {
      matched.validate().then((error?: FieldValidateError | void) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  return Promise.reject();
};

const validate = (name?: string | string[]) => {
  if (typeof name === 'string') {
    return validateField(name);
  }
  return props.validateFirst ? validateSeq(name) : validateAll(name);
};

const resetValidation = (name?: string | string[]) => {
  if (typeof name === 'string') {
    name = [name];
  }
  const targetFields = getFieldsByNames(name);
  targetFields.forEach((field) => {
    field.resetValidation();
  });
};

const getValidationStatus = () =>
  fields.reduce<Record<string, FieldValidationStatus>>((form, field) => {
    if (field.name !== undefined) {
      form[field.name] = field.getValidationStatus();
    }
    return form;
  }, {});

const scrollToField = (
  _name: string,
  _options?: boolean | Record<string, unknown>,
) => {
  // In Lynx, scrollIntoView is not available.
  // No-op stub for API compatibility.
};

const getValues = () =>
  fields.reduce<Record<string, unknown>>((form, field) => {
    if (field.name !== undefined) {
      form[field.name] = field.formValue.value;
    }
    return form;
  }, {});

const submit = () => {
  const values = getValues();

  validate()
    .then(() => emit('submit', values))
    .catch((errors: FieldValidateError[]) => {
      emit('failed', { values, errors });
      if (props.scrollToError && errors[0]?.name) {
        scrollToField(errors[0].name);
      }
    });
};

provide(FORM_KEY, {
  props,
  registerField,
  unregisterField,
});

defineExpose<FormExpose>({
  submit,
  validate,
  getValues,
  scrollToField,
  resetValidation,
  getValidationStatus,
});
</script>

<template>
  <view :class="bem()">
    <slot />
  </view>
</template>
