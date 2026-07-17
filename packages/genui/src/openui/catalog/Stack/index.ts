// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import { GAP_CLASS, asArray } from '../utils.js';

import '../../../../styles/openui/catalog/Stack.css';

function getAlignClass(align: 'start' | 'center' | 'end' | 'stretch'): string {
  switch (align) {
    case 'start':
      return 'OpenUIAlignStart';
    case 'center':
      return 'OpenUIAlignCenter';
    case 'end':
      return 'OpenUIAlignEnd';
    default:
      return 'OpenUIAlignStretch';
  }
}

function getJustifyClass(
  justify: 'start' | 'center' | 'end' | 'between',
): string {
  switch (justify) {
    case 'center':
      return 'OpenUIJustifyCenter';
    case 'end':
      return 'OpenUIJustifyEnd';
    case 'between':
      return 'OpenUIJustifyBetween';
    default:
      return 'OpenUIJustifyStart';
  }
}

const stackPropsSchema = z.object({
  children: z.array(z.any()),
  direction: z.enum(['row', 'column']).optional(),
  wrap: z.boolean().optional(),
  gap: z.enum(['none', 'xs', 's', 'm', 'l', 'xl']).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  justify: z.enum(['start', 'center', 'end', 'between']).optional(),
});

export const Stack = defineComponent({
  name: 'Stack',
  props: stackPropsSchema,
  description: 'Flex layout container',
  component: (
    { props, renderNode }: ComponentRenderProps<
      z.infer<typeof stackPropsSchema>
    >,
  ) => {
    const direction = props.direction ?? 'column';
    const gap = props.gap ?? 'm';
    const align = props.align ?? 'stretch';
    const justify = props.justify ?? 'start';

    const className = [
      'OpenUIStack',
      direction === 'row' ? 'OpenUIStackRow' : 'OpenUIStackColumn',
      props.wrap ? 'OpenUIStackWrap' : '',
      GAP_CLASS[gap] ?? GAP_CLASS['m'],
      getAlignClass(align),
      getJustifyClass(justify),
    ]
      .filter(Boolean)
      .join(' ');

    return h('view', { class: className }, [
      renderNode(asArray(props.children)),
    ]);
  },
});
