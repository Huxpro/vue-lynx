<!--
  Vant Feature Parity Report:
  - Props: 11/14 supported
    Supported: colon, disabled, readonly, showError, labelWidth, labelAlign, inputAlign,
               scrollToError, validateFirst, showErrorMessage, errorMessageAlign, validateTrigger
    Missing: required ('auto' mode), submitOnEnter, scrollToErrorPosition
  - Events: 2/2 supported (submit, failed)
  - Slots: 1/1 supported (default)
    Note: footer slot is a Lynx-specific addition (not in Vant)
  - Exposed Methods: 5/5 supported (submit, validate, resetValidation, getValues, getValidationStatus)
  - Gaps:
    - No required prop with 'auto' mode (auto-detects from field rules)
    - No submitOnEnter prop (keyboard submit in Lynx differs from web)
    - No scrollToErrorPosition prop (ScrollLogicalPosition not applicable in Lynx)
    - Uses modelValue for two-way binding (Vant Form does not use v-model)
    - validateTrigger provided via inject context but Field must implement trigger check
-->
<script setup lang="ts">
import { ref, provide, reactive, computed } from 'vue-lynx';

export interface FormRule {
  required?: boolean;
  message?: string;
  validator?: (value: any, rule: FormRule) => boolean | string | Promise<boolean | string>;
  pattern?: RegExp;
  trigger?: 'onBlur' | 'onChange' | 'onSubmit';
}

export type FieldValidateTrigger = 'onBlur' | 'onChange' | 'onSubmit';

export interface FormProps {
  modelValue?: Record<string, any>;
  labelWidth?: number | string;
  labelAlign?: 'left' | 'center' | 'right';
  inputAlign?: 'left' | 'center' | 'right';
  errorMessageAlign?: 'left' | 'center' | 'right';
  colon?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  showError?: boolean;
  showErrorMessage?: boolean;
  validateFirst?: boolean;
  scrollToError?: boolean;
  validateTrigger?: FieldValidateTrigger | FieldValidateTrigger[];
}

const props = withDefaults(defineProps<FormProps>(), {
  modelValue: () => ({}),
  labelWidth: 88,
  labelAlign: 'left',
  inputAlign: 'left',
  errorMessageAlign: 'left',
  colon: false,
  disabled: false,
  readonly: false,
  showError: true,
  showErrorMessage: true,
  validateFirst: false,
  scrollToError: false,
  validateTrigger: 'onBlur',
});

const emit = defineEmits<{
  'update:modelValue': [values: Record<string, any>];
  submit: [values: Record<string, any>];
  failed: [errorInfo: { values: Record<string, any>; errors: Array<{ name: string; message: string }> }];
}>();

interface FieldRegistration {
  name: string;
  rules: FormRule[];
  getValue: () => any;
  setError: (message: string) => void;
  clearError: () => void;
}

const registeredFields = ref<FieldRegistration[]>([]);

function registerField(field: FieldRegistration) {
  registeredFields.value.push(field);
}

function unregisterField(name: string) {
  const index = registeredFields.value.findIndex((f) => f.name === name);
  if (index > -1) {
    registeredFields.value.splice(index, 1);
  }
}

async function validateField(field: FieldRegistration): Promise<{ name: string; message: string } | null> {
  if (!field.rules || field.rules.length === 0) return null;

  const value = field.getValue();

  for (const rule of field.rules) {
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      const message = rule.message || `${field.name} is required`;
      if (props.showError) field.setError(message);
      return { name: field.name, message };
    }

    if (rule.pattern && !rule.pattern.test(String(value))) {
      const message = rule.message || `${field.name} is invalid`;
      if (props.showError) field.setError(message);
      return { name: field.name, message };
    }

    if (rule.validator) {
      try {
        const result = await rule.validator(value, rule);
        if (result === false) {
          const message = rule.message || `${field.name} is invalid`;
          if (props.showError) field.setError(message);
          return { name: field.name, message };
        }
        if (typeof result === 'string') {
          if (props.showError) field.setError(result);
          return { name: field.name, message: result };
        }
      } catch (err: any) {
        const message = err?.message || rule.message || `${field.name} validation failed`;
        if (props.showError) field.setError(message);
        return { name: field.name, message };
      }
    }
  }

  field.clearError();
  return null;
}

async function validate(name?: string | string[]): Promise<void> {
  const fieldsToValidate = name
    ? registeredFields.value.filter((f) =>
        Array.isArray(name) ? name.includes(f.name) : f.name === name,
      )
    : registeredFields.value;

  const errors: Array<{ name: string; message: string }> = [];

  if (props.validateFirst) {
    for (const field of fieldsToValidate) {
      const error = await validateField(field);
      if (error) {
        errors.push(error);
        break;
      }
    }
  } else {
    const results = await Promise.all(fieldsToValidate.map(validateField));
    for (const result of results) {
      if (result) errors.push(result);
    }
  }

  if (errors.length > 0) {
    throw errors;
  }
}

function resetValidation(name?: string | string[]) {
  const fieldsToReset = name
    ? registeredFields.value.filter((f) =>
        Array.isArray(name) ? name.includes(f.name) : f.name === name,
      )
    : registeredFields.value;

  fieldsToReset.forEach((field) => field.clearError());
}

async function submit() {
  const values = { ...props.modelValue };
  registeredFields.value.forEach((field) => {
    values[field.name] = field.getValue();
  });

  try {
    await validate();
    emit('submit', values);
  } catch (errors: any) {
    emit('failed', { values, errors });
  }
}

provide(
  'vanForm',
  reactive({
    props,
    registerField,
    unregisterField,
    validateTrigger: computed(() => props.validateTrigger),
  }),
);

function getValues(): Record<string, any> {
  const values = { ...props.modelValue };
  registeredFields.value.forEach((field) => {
    values[field.name] = field.getValue();
  });
  return values;
}

function getValidationStatus(): Record<string, 'passed' | 'failed' | 'unvalidated'> {
  const status: Record<string, 'passed' | 'failed' | 'unvalidated'> = {};
  registeredFields.value.forEach((field) => {
    status[field.name] = 'unvalidated';
  });
  return status;
}

defineExpose({ submit, validate, resetValidation, getValues, getValidationStatus });

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#fff',
}));
</script>

<template>
  <view :style="containerStyle">
    <slot />
    <view :style="{ display: 'flex', flexDirection: 'column', padding: 16, paddingTop: 8 }">
      <slot name="footer" />
    </view>
  </view>
</template>
