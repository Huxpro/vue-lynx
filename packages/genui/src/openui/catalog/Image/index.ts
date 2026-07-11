// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import { stringLikeSchema, stringifyValue } from '../utils.js';

import '../../../../styles/openui/catalog/Image.css';

const imagePropsSchema = z.object({
  url: stringLikeSchema,
  fit: z.enum(['contain', 'cover', 'fill', 'none', 'scale-down']).optional(),
  variant: z.enum([
    'icon',
    'avatar',
    'smallFeature',
    'mediumFeature',
    'largeFeature',
    'header',
  ]).optional(),
});

export const Image = defineComponent({
  name: 'Image',
  props: imagePropsSchema,
  description: 'Image with optional fit and variant sizing.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof imagePropsSchema>>,
  ) => {
    const fit = props.fit ?? 'cover';
    const variant = props.variant ?? 'mediumFeature';
    const url = stringifyValue(props.url);

    const mode = (() => {
      switch (fit) {
        case 'contain':
        case 'scale-down':
          return 'aspectFit';
        case 'fill':
          return 'scaleToFill';
        case 'none':
          return 'center';
        default:
          return 'aspectFill';
      }
    })();

    return h('image', {
      'auto-size': true,
      src: url,
      mode,
      class: `OpenUIImage OpenUIImageVariant${
        variant.charAt(0).toUpperCase() + variant.slice(1)
      }`,
    });
  },
});
