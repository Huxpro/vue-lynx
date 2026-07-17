// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Divider.css';

/**
 * Props for the built-in Divider catalog component.
 *
 * @a2uiCatalog Divider
 */
export interface DividerProps extends GenericComponentProps {
  axis?: 'horizontal' | 'vertical';
}

/**
 * Render a horizontal or vertical visual separator.
 */
export const Divider: GenUIComponent = defineComponent({
  name: 'Divider',
  props: catalogProps('axis'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as DividerProps;
    return (): VNodeChild => {
      const axis = props.axis as string | undefined ?? 'horizontal';
      return h('view', { class: `divider divider-${axis}` });
    };
  },
});
