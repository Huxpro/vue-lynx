// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import type { GenUIComponent } from '../../vue/component.js';
import { useChecks } from '../../vue/useChecks.js';
import type { CheckLike } from '../../vue/useChecks.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/CheckBox.css';

/**
 * Props for the built-in CheckBox catalog component.
 *
 * @a2uiCatalog CheckBox
 */
export interface CheckBoxProps extends GenericComponentProps {
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
  value: boolean | { path: string } | {
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
  checks?: Array<{
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
    message: string;
  }>;
}

/**
 * Render a boolean checkbox bound to the surface data model.
 */
export const CheckBox: GenUIComponent = defineComponent({
  name: 'CheckBox',
  props: catalogProps('label', 'value', 'checks'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as CheckBoxProps;

    const { outcome, firstFailureMessage } = useChecks({
      checks: () => props.checks as CheckLike[] | undefined,
      componentId: () => props.id ?? '',
      surface: () => props.surface,
      dataContextPath: () => props.dataContextPath,
    });

    return (): VNodeChild => {
      const {
        label = 'CheckBox',
        value,
        setValue,
      } = props;
      const ok = outcome.value.ok;

      const handleChange = () => {
        setValue?.('value', !value);
      };

      return h(
        'view',
        {
          class: `checkbox-row${ok ? '' : ' checkbox-row-invalid'}`,
          bindtap: handleChange,
        },
        [
          h(
            'view',
            {
              class: `checkbox-input ${value ? 'checkbox-input-checked' : ''}`
                .trim(),
            },
            value ? [h('text', '✓')] : [],
          ),
          h('text', { class: 'checkbox-label' }, label as string),
          !ok && firstFailureMessage.value
            ? h('text', { class: 'checkbox-error' }, firstFailureMessage.value)
            : null,
        ],
      );
    };
  },
});
