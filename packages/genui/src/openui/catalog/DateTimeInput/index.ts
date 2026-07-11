// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import {
  booleanLikeSchema,
  booleanValue,
  stringLikeSchema,
  stringifyValue,
} from '../utils.js';

import '../../../../styles/openui/catalog/DateTimeInput.css';

const dateTimeInputPropsSchema = z.object({
  value: stringLikeSchema,
  enableDate: booleanLikeSchema.optional(),
  enableTime: booleanLikeSchema.optional(),
  min: stringLikeSchema.optional(),
  max: stringLikeSchema.optional(),
  label: stringLikeSchema.optional(),
});

export const DateTimeInput = defineComponent({
  name: 'DateTimeInput',
  props: dateTimeInputPropsSchema,
  description:
    'Date/time value display with optional label, min/max, and enabled date/time hints.',
  component: (
    { props }: ComponentRenderProps<
      z.infer<typeof dateTimeInputPropsSchema>
    >,
  ) => {
    const enableDate = booleanValue(props.enableDate);
    const enableTime = booleanValue(props.enableTime);
    const min = stringifyValue(props.min);
    const max = stringifyValue(props.max);

    return h('view', { class: 'OpenUIDateTimeInput' }, [
      props.label
        ? h(
          'text',
          { class: 'OpenUIDateTimeLabel' },
          stringifyValue(props.label),
        )
        : null,
      h('text', { class: 'OpenUIDateTimeValue' }, stringifyValue(props.value)),
      h(
        'text',
        { class: 'OpenUIDateTimeHint' },
        `enableDate=${
          enableDate === null ? '-' : (enableDate ? 'true' : 'false')
        }, enableTime=${
          enableTime === null ? '-' : (enableTime ? 'true' : 'false')
        }`,
      ),
      min || max
        ? h(
          'text',
          { class: 'OpenUIDateTimeHint' },
          `min=${min || '-'}, max=${max || '-'}`,
        )
        : null,
    ]);
  },
});
