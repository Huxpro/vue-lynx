import type { InjectionKey, ComputedRef } from 'vue-lynx';
import type { FieldTextAlign, FieldValidateTrigger, FieldValidateError, FieldValidationStatus } from '../Field/types';

export type FormProps = {
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
};

export type FormFieldExpose = {
  name: string | undefined;
  validate: (rules?: any[]) => Promise<FieldValidateError | void>;
  resetValidation: () => void;
  getValidationStatus: () => FieldValidationStatus;
  formValue: ComputedRef<unknown>;
};

export type FormProvide = {
  props: FormProps;
  registerField: (field: FormFieldExpose) => void;
  unregisterField: (field: FormFieldExpose) => void;
};

export type FormExpose = {
  submit: () => void;
  validate: (name?: string | string[]) => Promise<void>;
  getValues: () => Record<string, unknown>;
  scrollToField: (name: string, options?: boolean | Record<string, unknown>) => void;
  resetValidation: (name?: string | string[]) => void;
  getValidationStatus: () => Record<string, FieldValidationStatus>;
};

export const FORM_KEY: InjectionKey<FormProvide> = Symbol('van-form');
