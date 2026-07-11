// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import {
  Radio,
  RadioGroupRoot,
  RadioIndicator,
} from '../../../shared/lynx-ui/index.js';
import type { GenUIComponent } from '../../vue/component.js';
import { useChecks } from '../../vue/useChecks.js';
import type { CheckLike } from '../../vue/useChecks.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/RadioGroup.css';

const HitSlop = {
  'hit-slop': {
    top: '8px' as `${number}px`,
    left: '8px' as `${number}px`,
    right: '8px' as `${number}px`,
    bottom: '8px' as `${number}px`,
  },
};

/**
 * Props for the built-in RadioGroup catalog component.
 *
 * @a2uiCatalog RadioGroup
 */
export interface RadioGroupComponentProps extends GenericComponentProps {
  /** The list of string options to display. */
  items: string[] | { path: string } | {
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
  /** The currently selected value. */
  value: string | { path: string } | {
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
  /** A hint for the visual style of the radio group. */
  usageHint?: 'default' | 'card' | 'row';
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
 * Render a single-choice radio group bound to the surface data model.
 */
export const RadioGroup: GenUIComponent = defineComponent({
  name: 'RadioGroup',
  props: catalogProps('items', 'value', 'usageHint', 'checks'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as RadioGroupComponentProps;

    const { outcome, firstFailureMessage } = useChecks({
      checks: () => props.checks as CheckLike[] | undefined,
      componentId: () => props.id ?? '',
      surface: () => props.surface,
      dataContextPath: () => props.dataContextPath,
    });

    return (): VNodeChild => {
      const value = props.value;
      const items = props.items;
      const usageHint = (props.usageHint as string | undefined) ?? 'default';
      const setValue = props.setValue as
        | ((key: string, value: unknown) => void)
        | undefined;
      const explicitItems = Array.isArray(items) ? items : [];
      const ok = outcome.value.ok;

      const handleValueChange = (newValue: string) => {
        setValue?.('value', newValue);
      };

      return h(
        'view',
        {
          class: `radio-group radio-group-${usageHint}${
            ok ? '' : ' radio-group-invalid'
          }`,
        },
        [
          h(RadioGroupRoot, {
            value: value as string,
            onValueChange: handleValueChange,
          }, {
            default: () => [
              h(
                'view',
                { class: 'radio-group-container' },
                explicitItems.map((itemValue: string) =>
                  h('view', { key: itemValue, class: 'radio-option' }, [
                    h(Radio, {
                      className: 'radio-item',
                      value: itemValue,
                      radioProps: HitSlop,
                    }, {
                      default: () => [
                        h(RadioIndicator, {
                          className: 'radio-indicator',
                        }, {
                          default: () => [
                            h('view', { class: 'radio-indicator-dot' }),
                          ],
                        }),
                      ],
                    }),
                    h('text', { class: 'label' }, itemValue),
                  ])
                ),
              ),
            ],
          }),
          !ok && firstFailureMessage.value
            ? h(
              'text',
              { class: 'radio-group-error' },
              firstFailureMessage.value,
            )
            : null,
        ],
      );
    };
  },
});
