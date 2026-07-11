// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { Fragment, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import {
  GAP_CLASS,
  asArray,
  getAlignClass,
  isTemplateChildren,
  templateChildrenSchema,
} from '../utils.js';

import '../../../../styles/openui/catalog/List.css';

const listChildrenSchema = z.union([z.array(z.any()), templateChildrenSchema]);

const listPropsSchema = z.object({
  children: listChildrenSchema.optional(),
  items: listChildrenSchema.optional(),
  direction: z.enum(['vertical', 'horizontal']).optional(),
  align: z.enum(['start', 'center', 'end', 'stretch']).optional(),
  gap: z.enum(['none', 'xs', 's', 'm', 'l', 'xl']).optional(),
  divider: z.boolean().optional(),
});

function renderTemplateHint(
  children: { componentId: string; path: string },
): VNodeChild {
  return h('view', { class: 'OpenUIList' }, [
    h(
      'text',
      { class: 'OpenUIListTemplateHint' },
      `TemplateChildren(componentId=${children.componentId}, path=${children.path})`,
    ),
  ]);
}

export const List = defineComponent({
  name: 'List',
  props: listPropsSchema,
  description:
    'List container for repeated children. Supports vertical or horizontal layout.',
  component: (
    { props, renderNode }: ComponentRenderProps<
      z.infer<typeof listPropsSchema>
    >,
  ) => {
    const children = props.children ?? props.items ?? [];

    if (isTemplateChildren(children)) {
      return renderTemplateHint(children);
    }

    const direction = props.direction ?? 'vertical';
    const gap = props.gap ?? 'm';
    const items = asArray(children);
    const dividerClassName = direction === 'horizontal'
      ? 'OpenUIListDivider OpenUIListDividerVertical'
      : 'OpenUIListDivider OpenUIListDividerHorizontal';
    const className = [
      'OpenUIList',
      direction === 'horizontal' ? 'OpenUIStackRow' : 'OpenUIStackColumn',
      GAP_CLASS[gap] ?? GAP_CLASS['m'],
      getAlignClass(props.align ?? 'stretch'),
    ]
      .filter(Boolean)
      .join(' ');

    return h(
      'view',
      { class: className },
      items.map((item: unknown, index: number): VNodeChild =>
        h(Fragment, { key: index }, [
          props.divider && index > 0
            ? h('view', { class: dividerClassName })
            : null,
          renderNode(item),
        ])
      ),
    );
  },
});
