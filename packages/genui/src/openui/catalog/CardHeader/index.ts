// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';

import '../../../../styles/openui/catalog/CardHeader.css';

const cardHeaderPropsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});

export const CardHeader = defineComponent({
  name: 'CardHeader',
  props: cardHeaderPropsSchema,
  description: 'Card header with title and optional subtitle.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof cardHeaderPropsSchema>>,
  ) =>
    h('view', { class: 'OpenUICardHeader' }, [
      h('text', { class: 'OpenUICardHeaderTitle' }, props.title),
      props.subtitle
        ? h('text', { class: 'OpenUICardHeaderSubtitle' }, props.subtitle)
        : null,
    ]),
});
