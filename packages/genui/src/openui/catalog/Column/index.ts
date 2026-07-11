// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import {
  GAP_CLASS,
  asArray,
  getAlignClass,
  getJustifyClass,
} from '../utils.js';

import '../../../../styles/openui/catalog/Column.css';

const columnPropsSchema = z.object({
  children: z.array(z.any()),
  justify: z.enum([
    'start',
    'center',
    'end',
    'between',
    'around',
    'evenly',
    'spaceBetween',
    'spaceAround',
    'spaceEvenly',
    'stretch',
  ]).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  gap: z.enum(['none', 'xs', 's', 'm', 'l', 'xl']).optional(),
});

export const Column = defineComponent({
  name: 'Column',
  props: columnPropsSchema,
  description: 'Vertical flex layout container.',
  component: (
    { props, renderNode }: ComponentRenderProps<
      z.infer<typeof columnPropsSchema>
    >,
  ) => {
    const gap = props.gap ?? 'm';
    const className = [
      'OpenUIColumn',
      'OpenUIStack',
      'OpenUIStackColumn',
      GAP_CLASS[gap] ?? GAP_CLASS['m'],
      getAlignClass(props.align ?? 'stretch'),
      getJustifyClass(props.justify ?? 'start'),
    ]
      .filter(Boolean)
      .join(' ');

    return h('view', { class: className }, [
      renderNode(asArray(props.children)),
    ]);
  },
});
