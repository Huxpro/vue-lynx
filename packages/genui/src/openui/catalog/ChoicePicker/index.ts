// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import {
  defineComponent as vueDefineComponent,
  h,
  ref,
  watch,
} from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { useOpenUI } from '../../core/context.js';
import { defineComponent } from '../../core/library.js';
import {
  booleanLikeSchema,
  booleanValue,
  isPathBinding,
  stringLikeSchema,
  stringifyValue,
} from '../utils.js';

import '../../../../styles/openui/catalog/ChoicePicker.css';

const choicePickerPropsSchema = z.object({
  label: stringLikeSchema.optional(),
  options: z.union([z.array(stringLikeSchema), stringLikeSchema]),
  value: stringLikeSchema.optional(),
  variant: z.enum(['default', 'card']).optional(),
  displayStyle: z.enum(['list', 'chips', 'dropdown']).optional(),
  filterable: booleanLikeSchema.optional(),
});

type ChoicePickerProps = z.infer<typeof choicePickerPropsSchema>;

const ChoicePickerRenderer = vueDefineComponent({
  name: 'OpenUIChoicePickerRenderer',
  props: ['props', 'renderNode', 'statementId', 'onAction'],
  setup(rp: { props: ChoicePickerProps }) {
    const ctx = useOpenUI();
    const selected = ref(stringifyValue(rp.props.value));
    let dirty = false;

    watch(
      () => rp.props.value,
      (value) => {
        if (!dirty) {
          selected.value = stringifyValue(value);
        }
      },
    );

    const onSelect = (next: string) => {
      dirty = true;
      selected.value = next;
    };

    return (): VNodeChild => {
      const props = rp.props;
      const isStreaming = ctx.isStreaming;
      const options = Array.isArray(props.options)
        ? props.options
        : [props.options];
      const displayStyle = props.displayStyle ?? 'chips';
      const variant = props.variant ?? 'default';
      const filterable = booleanValue(props.filterable);

      return h(
        'view',
        {
          class:
            `OpenUIChoicePicker OpenUIChoicePicker-${displayStyle} OpenUIChoicePicker-${variant}`,
        },
        [
          props.label
            ? h(
              'text',
              { class: 'OpenUIChoicePickerLabel' },
              stringifyValue(props.label),
            )
            : null,
          isPathBinding(props.options)
            ? h(
              'text',
              { class: 'OpenUIChoicePickerHint' },
              `options: {path: ${props.options.path}}`,
            )
            : null,
          filterable === null || filterable === undefined
            ? null
            : h(
              'text',
              { class: 'OpenUIChoicePickerHint' },
              `filterable: ${filterable ? 'true' : 'false'}`,
            ),
          h(
            'view',
            { class: 'OpenUIChoicePickerOptions' },
            options.map((option, index) => {
              const value = stringifyValue(option);
              const active = value === selected.value;
              return h(
                'view',
                {
                  key: `${value}-${index}`,
                  class: active
                    ? 'OpenUIChoiceItem OpenUIChoiceItemSelected'
                    : 'OpenUIChoiceItem',
                  ...(isStreaming || !value
                    ? {}
                    : { bindtap: () => onSelect(value) }),
                },
                [h('text', { class: 'OpenUIChoiceItemText' }, value)],
              );
            }),
          ),
        ],
      );
    };
  },
});

export const ChoicePicker = defineComponent({
  name: 'ChoicePicker',
  props: choicePickerPropsSchema,
  description:
    'Choice picker rendered as selectable chips, list items, or a dropdown-like field.',
  component: ChoicePickerRenderer,
});
