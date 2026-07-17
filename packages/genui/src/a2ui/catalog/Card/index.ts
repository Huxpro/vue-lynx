// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import { NodeRenderer } from '../../vue/A2UIRenderer.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Card.css';

/**
 * Props for the built-in Card catalog component.
 *
 * @a2uiCatalog Card
 */
export interface CardProps extends GenericComponentProps {
  child: string;
  variant?: 'elevated' | 'outlined' | 'filled' | 'ghost';
  weight?: number;
}

/**
 * Render a single-child card container.
 */
export const Card: GenUIComponent = defineComponent({
  name: 'Card',
  props: catalogProps('child', 'variant', 'weight'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as CardProps;
    return (): VNodeChild => {
      const { child: childId, surface, dataContextPath } = props;
      const childComponent = surface.components.get(childId);
      const childWithContext = childComponent && dataContextPath
        ? { ...childComponent, dataContextPath }
        : childComponent;
      const variant = props.variant ?? 'elevated';
      const weightClass = typeof props.weight === 'number'
        ? 'card-weighted'
        : '';

      return h(
        'view',
        { class: `card card-${variant} ${weightClass}`.trim() },
        [
          childWithContext
            ? h(NodeRenderer, { component: childWithContext, surface })
            : null,
        ],
      );
    };
  },
});
