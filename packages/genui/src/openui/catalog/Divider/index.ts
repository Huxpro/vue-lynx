// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';

import '../../../../styles/openui/catalog/Divider.css';

const dividerPropsSchema = z.object({
  axis: z.enum(['horizontal', 'vertical']).optional(),
});

export const Divider = defineComponent({
  name: 'Divider',
  props: dividerPropsSchema,
  description: 'Horizontal or vertical divider.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof dividerPropsSchema>>,
  ) => {
    const axis = props.axis === 'vertical' ? 'Vertical' : 'Horizontal';
    return h('view', { class: `OpenUIDivider OpenUIDivider${axis}` });
  },
});
