// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import { stringLikeSchema, stringifyValue } from '../utils.js';

import '../../../../styles/openui/catalog/Video.css';

const videoPropsSchema = z.object({
  url: stringLikeSchema,
  title: stringLikeSchema.optional(),
});

export const Video = defineComponent({
  name: 'Video',
  props: videoPropsSchema,
  description: 'Video attachment placeholder with URL.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof videoPropsSchema>>,
  ) => {
    const title = stringifyValue(props.title) || 'Video';
    const url = stringifyValue(props.url);

    return h('view', { class: 'OpenUIVideo' }, [
      h('view', { class: 'OpenUIVideoPoster' }, [
        h('text', { class: 'OpenUIVideoPlay' }, 'play_arrow'),
      ]),
      h('view', { class: 'OpenUIVideoMeta' }, [
        h('text', { class: 'OpenUIVideoTitle' }, title),
        url ? h('text', { class: 'OpenUIVideoUrl' }, url) : null,
      ]),
    ]);
  },
});
