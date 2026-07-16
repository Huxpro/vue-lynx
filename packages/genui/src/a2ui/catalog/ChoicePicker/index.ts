// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h, ref } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import {
  filterChoicePickerOptions,
  normalizeChoicePickerDisplayStyle,
  normalizeChoicePickerLabel,
  normalizeChoicePickerOptions,
  normalizeChoicePickerValue,
  normalizeChoicePickerVariant,
  toggleChoicePickerValue,
} from './utils.js';
import { catalogProps } from '../shared.js';
import {
  Checkbox,
  CheckboxIndicator,
  Input,
  Radio,
  RadioGroupRoot,
  RadioIndicator,
} from '../../../shared/lynx-ui/index.js';
import type { GenUIComponent } from '../../vue/component.js';
import { useChecks } from '../../vue/useChecks.js';
import type { CheckLike } from '../../vue/useChecks.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/ChoicePicker.css';

const HitSlop = {
  'hit-slop': {
    top: '8px' as `${number}px`,
    left: '8px' as `${number}px`,
    right: '8px' as `${number}px`,
    bottom: '8px' as `${number}px`,
  },
};

/**
 * Props for the built-in ChoicePicker catalog component.
 *
 * @a2uiCatalog ChoicePicker
 */
export interface ChoicePickerProps extends GenericComponentProps {
  /** The label for the group of options. */
  label?: string | { path: string } | {
    call: string;
    args: Record<string, unknown>;
    returnType?:
      | 'string'
      | 'number'
      | 'boolean'
      | 'array'
      | 'object'
      | 'any'
      | 'void';
  };
  /** A hint for how the choice picker should be displayed and behave. */
  variant?: 'multipleSelection' | 'mutuallyExclusive';
  /** The list of available options to choose from. */
  options: Array<{
    /** The text to display for this option. */
    label: string | { path: string } | {
      call: string;
      args: Record<string, unknown>;
      returnType?:
        | 'string'
        | 'number'
        | 'boolean'
        | 'array'
        | 'object'
        | 'any'
        | 'void';
    };
    /** The stable value associated with this option. */
    value: string;
  }>;
  /** The list of currently selected values. */
  value: string[] | { path: string } | {
    call: string;
    args: Record<string, unknown>;
    returnType?:
      | 'string'
      | 'number'
      | 'boolean'
      | 'array'
      | 'object'
      | 'any'
      | 'void';
  };
  /** The display style of the component. */
  displayStyle?: 'checkbox' | 'chips';
  /** If true, displays a search input to filter the options. */
  filterable?: boolean;
  /** A list of checks to perform. */
  checks?: Array<{
    /** The condition that indicates whether the check passes. */
    condition: boolean | { path: string } | {
      call: string;
      args: Record<string, unknown>;
      returnType?:
        | 'string'
        | 'number'
        | 'boolean'
        | 'array'
        | 'object'
        | 'any'
        | 'void';
    };
    /** The error message to display if the check fails. */
    message: string;
  }>;
}

/**
 * Render a single- or multi-select choice picker.
 */
export const ChoicePicker: GenUIComponent = defineComponent({
  name: 'ChoicePicker',
  props: catalogProps(
    'label',
    'variant',
    'options',
    'value',
    'displayStyle',
    'filterable',
    'checks',
  ),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as ChoicePickerProps;
    const query = ref('');

    const { outcome, firstFailureMessage } = useChecks({
      checks: () => props.checks as CheckLike[] | undefined,
      componentId: () => props.id ?? '',
      surface: () => props.surface,
      dataContextPath: () => props.dataContextPath,
    });

    return (): VNodeChild => {
      const {
        filterable = false,
        label,
        setValue,
      } = props;
      const options = normalizeChoicePickerOptions(props.options);
      const variant = normalizeChoicePickerVariant(props.variant);
      const displayStyle = normalizeChoicePickerDisplayStyle(
        props.displayStyle,
      );
      const selectedValues = normalizeChoicePickerValue(props.value, options);
      const selectedValue = selectedValues[0] ?? '';
      const visibleOptions = filterChoicePickerOptions(options, query.value);
      const ok = outcome.value.ok;

      const handleExclusiveChange = (nextValue: string) => {
        if (!nextValue || selectedValue === nextValue) return;
        setValue?.('value', [nextValue]);
      };

      const handleMultipleChange = (optionValue: string) => {
        setValue?.(
          'value',
          toggleChoicePickerValue(selectedValues, optionValue, variant),
        );
      };

      const rootClassName = [
        'choice-picker',
        `choice-picker-${displayStyle}`,
        `choice-picker-${variant}`,
        ok ? '' : 'choice-picker-invalid',
      ].filter(Boolean).join(' ');
      const labelText = normalizeChoicePickerLabel(label);

      return h('view', { class: rootClassName }, [
        labelText
          ? h('text', { class: 'choice-picker-label' }, labelText)
          : null,
        filterable
          ? h(Input, {
            className: 'choice-picker-filter',
            value: query.value,
            type: 'text',
            confirmType: 'done',
            onInput: (v: string) => {
              query.value = v;
            },
          })
          : null,
        variant === 'mutuallyExclusive'
          ? h(RadioGroupRoot, {
            value: selectedValue,
            onValueChange: handleExclusiveChange,
          }, {
            default: () => [
              h(
                'view',
                { class: 'choice-picker-options' },
                visibleOptions.map((option) =>
                  displayStyle === 'chips'
                    ? h(Radio, {
                      key: option.value,
                      className: 'choice-picker-chip',
                      value: option.value,
                      radioProps: HitSlop,
                    }, {
                      default: () => [
                        h(
                          'text',
                          { class: 'choice-picker-chip-text' },
                          option.label,
                        ),
                      ],
                    })
                    : h(Radio, {
                      key: option.value,
                      className: 'choice-picker-option',
                      value: option.value,
                      radioProps: HitSlop,
                    }, {
                      default: () => [
                        h(RadioIndicator, {
                          forceMount: true,
                          className: 'choice-picker-radio-indicator',
                        }, {
                          default: () => [
                            h('view', { class: 'choice-picker-radio-dot' }),
                          ],
                        }),
                        h(
                          'text',
                          { class: 'choice-picker-option-text' },
                          option.label,
                        ),
                      ],
                    })
                ),
              ),
            ],
          })
          : h(
            'view',
            { class: 'choice-picker-options' },
            visibleOptions.map((option) => {
              const checked = selectedValues.includes(option.value);
              return displayStyle === 'chips'
                ? h(Checkbox, {
                  key: option.value,
                  className: 'choice-picker-chip',
                  checked,
                  onChange: () => handleMultipleChange(option.value),
                  checkboxProps: HitSlop,
                }, {
                  default: () => [
                    h(
                      'text',
                      { class: 'choice-picker-chip-text' },
                      option.label,
                    ),
                  ],
                })
                : h(Checkbox, {
                  key: option.value,
                  className: 'choice-picker-option',
                  checked,
                  onChange: () => handleMultipleChange(option.value),
                  checkboxProps: HitSlop,
                }, {
                  default: () => [
                    h(CheckboxIndicator, {
                      forceMount: true,
                      className: 'choice-picker-checkbox-indicator',
                    }, {
                      default: () => [
                        h(
                          'text',
                          { class: 'choice-picker-checkmark' },
                          '✓',
                        ),
                      ],
                    }),
                    h(
                      'text',
                      { class: 'choice-picker-option-text' },
                      option.label,
                    ),
                  ],
                });
            }),
          ),
        !ok && firstFailureMessage.value
          ? h(
            'text',
            { class: 'choice-picker-error' },
            firstFailureMessage.value,
          )
          : null,
      ]);
    };
  },
});
