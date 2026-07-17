// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';

import '../../../../styles/openui/catalog/TextContent.css';

const textContentPropsSchema = z.object({
  text: z.union([z.string(), z.number(), z.boolean()]),
  size: z.enum(['small', 'default', 'large', 'small-heavy', 'large-heavy'])
    .optional(),
});

export const TextContent = defineComponent({
  name: 'TextContent',
  props: textContentPropsSchema,
  description: 'Text content with optional size.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof textContentPropsSchema>>,
  ) => {
    const size = props.size ?? 'default';
    let sizeClass = 'OpenUITextContentDefault';
    if (size === 'small') {
      sizeClass = 'OpenUITextContentSmall';
    } else if (size === 'large') {
      sizeClass = 'OpenUITextContentLarge';
    } else if (size === 'small-heavy') {
      sizeClass = 'OpenUITextContentSmallHeavy';
    } else if (size === 'large-heavy') {
      sizeClass = 'OpenUITextContentLargeHeavy';
    }

    return h(
      'text',
      { class: `OpenUITextContent ${sizeClass}` },
      String(props.text ?? ''),
    );
  },
});
