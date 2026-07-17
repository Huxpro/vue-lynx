// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';

import '../../../../styles/openui/catalog/Loading.css';

const loadingPropsSchema = z.object({
  variant: z.enum(['inline', 'block']).optional(),
});

export const Loading = defineComponent({
  name: 'Loading',
  props: loadingPropsSchema,
  description: 'Skeleton placeholder while content loads.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof loadingPropsSchema>>,
  ) => {
    const variant = props.variant ?? 'inline';
    const variantClass = variant === 'block'
      ? 'OpenUILoadingBlock'
      : 'OpenUILoadingInline';
    return h('view', { class: `OpenUILoading ${variantClass}` }, [
      h('view', {
        class: 'OpenUILoadingSkeleton OpenUILoadingSkeletonPrimary',
      }),
      variant === 'block'
        ? h('view', {
          class: 'OpenUILoadingSkeleton OpenUILoadingSkeletonSecondary',
        })
        : null,
    ]);
  },
});
