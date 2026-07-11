// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Loading.css';

/**
 * Props for the built-in Loading catalog component.
 *
 * @a2uiCatalog Loading
 */
export interface LoadingProps extends GenericComponentProps {
  /** Visual density for the skeleton placeholder. */
  variant?: 'inline' | 'block';
}

/**
 * Render a lightweight loading indicator.
 */
export const Loading: GenUIComponent = defineComponent({
  name: 'Loading',
  props: catalogProps('variant'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as LoadingProps;
    return (): VNodeChild => {
      const variant = props.variant ?? 'inline';

      return h('view', { class: `loading loading-${variant}` }, [
        h('view', { class: 'loading-skeleton loading-skeleton-primary' }),
        variant === 'block'
          ? h('view', { class: 'loading-skeleton loading-skeleton-secondary' })
          : null,
      ]);
    };
  },
});
