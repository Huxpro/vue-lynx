// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';

import '../../../../styles/openui/catalog/Tag.css';

const tagPropsSchema = z.object({
  text: z.string(),
});

export const Tag = defineComponent({
  name: 'Tag',
  props: tagPropsSchema,
  description: 'Tag',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof tagPropsSchema>>,
  ) =>
    h('view', { class: 'OpenUITag' }, [
      h('text', { class: 'OpenUITagText' }, props.text),
    ]),
});
