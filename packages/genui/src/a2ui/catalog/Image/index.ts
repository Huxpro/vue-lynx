// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Image.css';

/**
 * Props for the built-in Image catalog component.
 *
 * @a2uiCatalog Image
 */
export interface ImageProps extends GenericComponentProps {
  /** Image URL or path binding. */
  url: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'center';
  variant?:
    | 'icon'
    | 'avatar'
    | 'smallFeature'
    | 'mediumFeature'
    | 'largeFeature'
    | 'header';
  weight?: number;
}

/**
 * Render an image URL with catalog-defined sizing and fit variants.
 */
export const Image: GenUIComponent = defineComponent({
  name: 'Image',
  props: catalogProps('url', 'fit', 'mode', 'variant', 'weight'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as ImageProps;
    return (): VNodeChild => {
      const fit = props.fit ?? 'fit';
      const mode = props.mode ?? (() => {
        switch (fit) {
          case 'contain':
          case 'scale-down':
            return 'aspectFit';
          case 'fill':
            return 'scaleToFill';
          case 'none':
            return 'center';
          default:
            return 'aspectFill';
        }
      })();

      const variant = props.variant ?? 'mediumFeature';
      const className = `a2ui-image image-variant-${variant} ${
        typeof props.weight === 'number' ? 'image-weighted' : ''
      }`;
      return h('image', {
        class: className,
        'auto-size': true,
        src: props.url ?? '',
        mode,
      });
    };
  },
});
