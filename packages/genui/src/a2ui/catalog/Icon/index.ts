// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Icon.css';

function toMaterialName(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

/**
 * Props for the built-in Icon catalog component.
 *
 * @a2uiCatalog Icon
 */
export interface IconProps extends GenericComponentProps {
  /** Google Material icon ligature name, e.g. "info", "account_circle", "arrow_back". */
  name:
    | 'account_circle'
    | 'add'
    | 'arrow_back'
    | 'arrow_forward'
    | 'camera'
    | 'check'
    | 'close'
    | 'delete'
    | 'edit'
    | 'error'
    | 'favorite'
    | 'help'
    | 'home'
    | 'info'
    | 'location_on'
    | 'lock'
    | 'mail'
    | 'menu'
    | 'more_vert'
    | 'pause'
    | 'person'
    | 'play_arrow'
    | 'refresh'
    | 'search'
    | 'send'
    | 'settings'
    | 'share'
    | 'star'
    | 'warning'
    | { path: string };
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'muted' | 'inherit';
}

/**
 * Render a named icon from the catalog's supported icon set.
 */
export const Icon: GenUIComponent = defineComponent({
  name: 'Icon',
  props: catalogProps('name', 'size', 'color'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as IconProps;
    return (): VNodeChild => {
      const { name, size = 'md', color = 'inherit' } = props;
      const iconName = typeof name === 'string' ? toMaterialName(name) : '';

      return h(
        'text',
        { class: `a2ui-icon a2ui-icon-${size} a2ui-icon-color-${color}` },
        iconName,
      );
    };
  },
});
