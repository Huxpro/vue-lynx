// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';
import { stringLikeSchema, stringifyValue } from '../utils.js';

import '../../../../styles/openui/catalog/AudioPlayer.css';

const audioPlayerPropsSchema = z.object({
  url: stringLikeSchema,
  description: stringLikeSchema.optional(),
});

export const AudioPlayer = defineComponent({
  name: 'AudioPlayer',
  props: audioPlayerPropsSchema,
  description: 'Audio attachment placeholder with URL and description.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof audioPlayerPropsSchema>>,
  ) => {
    const description = stringifyValue(props.description);
    const url = stringifyValue(props.url);

    return h('view', { class: 'OpenUIAudio' }, [
      h('view', { class: 'OpenUIAudioIcon' }, [
        h('text', { class: 'OpenUIAudioIconText' }, 'music_note'),
      ]),
      h('view', { class: 'OpenUIAudioContent' }, [
        h('text', { class: 'OpenUIAudioTitle' }, description || 'Audio'),
        url ? h('text', { class: 'OpenUIAudioUrl' }, url) : null,
      ]),
    ]);
  },
});
