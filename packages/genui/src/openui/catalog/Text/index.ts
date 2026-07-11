// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import { stringLikeSchema, stringifyValue } from '../utils.js';

import '../../../../styles/openui/catalog/Text.css';

const textVariants = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'caption',
  'body',
] as const;

function getVariantClass(variant: typeof textVariants[number]): string {
  switch (variant) {
    case 'h1':
      return 'OpenUITextH1';
    case 'h2':
      return 'OpenUITextH2';
    case 'h3':
      return 'OpenUITextH3';
    case 'h4':
      return 'OpenUITextH4';
    case 'h5':
      return 'OpenUITextH5';
    case 'caption':
      return 'OpenUITextCaption';
    default:
      return 'OpenUITextBody';
  }
}

const textPropsSchema = z.object({
  text: stringLikeSchema,
  variant: z.enum(textVariants).optional(),
});

export const Text = defineComponent({
  name: 'Text',
  props: textPropsSchema,
  description: 'Plain text with display variants.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof textPropsSchema>>,
  ) => {
    const variant = props.variant ?? 'body';
    return h(
      'text',
      { class: `OpenUIText ${getVariantClass(variant)}` },
      stringifyValue(props.text),
    );
  },
});
