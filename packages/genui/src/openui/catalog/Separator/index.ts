// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';

import '../../../../styles/openui/catalog/Separator.css';

export const Separator = defineComponent({
  name: 'Separator',
  props: z.object({}),
  description: 'Separator',
  component: () => h('view', { class: 'OpenUISeparator' }),
});
