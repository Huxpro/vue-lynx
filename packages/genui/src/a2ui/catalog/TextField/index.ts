// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h, ref, watch } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import {
  getTextFieldInputType,
  isTextFieldValueValid,
  normalizeTextFieldValue,
  normalizeTextFieldVariant,
} from './utils.js';
import { catalogProps } from '../shared.js';
import { Input, TextArea } from '../../../shared/lynx-ui/index.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/TextField.css';

/**
 * Props for the built-in TextField catalog component.
 *
 * @a2uiCatalog TextField
 */
export interface TextFieldProps extends GenericComponentProps {
  /** The text label for the input field. */
  label: string | { path: string };
  /** The value of the text field. */
  value?: string | { path: string };
  /** The type of input field to display. */
  variant?: 'longText' | 'number' | 'shortText' | 'obscured';
  /** A regular expression used for client-side validation of the input. */
  validationRegexp?: string;
  /** A list of checks to perform. */
  checks?: Array<{
    /** The condition that indicates whether the check passes. */
    condition:
      | boolean
      | { path: string }
      | {
        call: string;
        args?: Record<string, string | number | boolean | { path: string }>;
        returnType?: 'boolean';
      };
    /** The error message to display if the check fails. */
    message: string;
  }>;
}

/**
 * Render a single-line or multi-line text input bound to the data model.
 */
export const TextField: GenUIComponent = defineComponent({
  name: 'TextField',
  props: catalogProps(
    'label',
    'value',
    'variant',
    'validationRegexp',
    'checks',
    'textFieldType',
  ),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as TextFieldProps;

    const draftValue = ref(normalizeTextFieldValue(props.value));
    const touched = ref(false);

    watch(
      () => normalizeTextFieldValue(props.value),
      (resolvedValue) => {
        draftValue.value = resolvedValue;
      },
    );

    return (): VNodeChild => {
      const { id, label, setValue, validationRegexp } = props;
      const textFieldType = (props as Record<string, unknown>)['textFieldType'];
      const variant = normalizeTextFieldVariant(props.variant, textFieldType);
      const labelText = normalizeTextFieldValue(label);

      const handleInput = (nextValue: string) => {
        touched.value = true;
        draftValue.value = nextValue;
        setValue?.('value', nextValue);
      };

      const handleBlur = () => {
        touched.value = true;
      };

      const invalid = !isTextFieldValueValid(
        draftValue.value,
        validationRegexp,
      );
      const showInvalid = touched.value && invalid;
      const rootClassName = showInvalid
        ? `textfield textfield-${variant} textfield-invalid`
        : `textfield textfield-${variant}`;

      const controlClassName = variant === 'longText'
        ? 'textfield-control textfield-textarea'
        : 'textfield-control';
      const controlId = id ? `${id}-control` : undefined;
      const controlIdProps = controlId ? { id: controlId } : {};

      return h('view', { class: rootClassName }, [
        h('text', { class: 'textfield-label' }, labelText),
        variant === 'longText'
          ? h(TextArea, {
            ...controlIdProps,
            className: controlClassName,
            value: draftValue.value,
            maxLines: 6,
            confirmType: 'done',
            onInput: handleInput,
            onBlur: handleBlur,
          })
          : h(Input, {
            ...controlIdProps,
            className: controlClassName,
            value: draftValue.value,
            type: getTextFieldInputType(variant),
            confirmType: 'done',
            onInput: handleInput,
            onBlur: handleBlur,
          }),
        showInvalid
          ? h('text', { class: 'textfield-error' }, 'Invalid value')
          : null,
      ]);
    };
  },
});
