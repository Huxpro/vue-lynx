// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { validate } from '@openuidev/lang-core';
import type { ParsedRule } from '@openuidev/lang-core';

import { inject, provide, reactive } from '@vue/runtime-core';
import type { InjectionKey } from '@vue/runtime-core';

/**
 * Validation state and helpers for OpenUI form fields.
 */
export interface FormValidationContextValue {
  errors: Record<string, string | undefined>;
  getFieldError: (name: string) => string | undefined;
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  registerField: (
    name: string,
    rules: ParsedRule[],
    getValue: () => unknown,
  ) => void;
  unregisterField: (name: string) => void;
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

export const FormValidationKey: InjectionKey<
  FormValidationContextValue | null
> = Symbol('openui-form-validation');

/**
 * Provide a form validation context to a subtree.
 *
 * @internal
 */
export function provideFormValidation(
  value: FormValidationContextValue,
): void {
  provide(FormValidationKey, value);
}

/**
 * Read the nearest OpenUI form validation context, if one exists.
 */
export function useFormValidation(): FormValidationContextValue | null {
  return inject(FormValidationKey, null);
}

interface FieldRegistration {
  rules: ParsedRule[];
  getValue: () => unknown;
}

/**
 * Create form validation state and callbacks for an OpenUI form boundary.
 * `errors` is reactive, so render-function reads track updates.
 */
export function useCreateFormValidation(): FormValidationContextValue {
  const errors = reactive<Record<string, string | undefined>>({});
  const fields: Record<string, FieldRegistration> = {};

  const getFieldError = (name: string) => errors[name];

  const validateField = (
    name: string,
    value: unknown,
    rules: ParsedRule[],
  ): boolean => {
    const error = validate(value, rules);
    if (errors[name] !== error) {
      errors[name] = error;
    }
    return !error;
  };

  const registerField = (
    name: string,
    rules: ParsedRule[],
    getValue: () => unknown,
  ) => {
    fields[name] = { rules, getValue };
  };

  const unregisterField = (name: string) => {
    delete fields[name];
  };

  const validateForm = (): boolean => {
    let allValid = true;

    for (const key of Object.keys(errors)) {
      delete errors[key];
    }
    for (const [name, reg] of Object.entries(fields)) {
      let value = reg.getValue();
      // Normalize: form state stores { value, componentType }; extract actual value if needed
      if (
        value != null
        && typeof value === 'object'
        && 'value' in value
        && 'componentType' in value
      ) {
        value = (value as { value: unknown }).value;
      }
      const error = validate(value, reg.rules);
      errors[name] = error;
      if (error) allValid = false;
    }

    return allValid;
  };

  const clearFieldError = (name: string) => {
    if (errors[name] !== undefined) {
      errors[name] = undefined;
    }
  };

  return {
    errors,
    getFieldError,
    validateField,
    registerField,
    unregisterField,
    validateForm,
    clearFieldError,
  };
}
