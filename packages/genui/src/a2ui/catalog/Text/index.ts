// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps } from '../../store/types.js';
import '../../../../styles/a2ui/catalog/Text.css';

/**
 * Props for the built-in Text catalog component.
 *
 * @a2uiCatalog Text
 */
export interface TextProps extends GenericComponentProps {
  /** Literal text, path binding, or function call. */
  text: string | { path: string } | {
    call: string;
    args: Record<string, unknown>;
    returnType?:
      | 'string'
      | 'number'
      | 'boolean'
      | 'array'
      | 'object'
      | 'any'
      | 'void';
  };
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'caption' | 'body' | 'markdown';
  emphasis?: 'medium' | 'strong';
}

/**
 * Render styled text from a literal value, data binding, or function call.
 */
export const Text: GenUIComponent = defineComponent({
  name: 'Text',
  props: catalogProps('text', 'variant', 'emphasis'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as TextProps;
    return (): VNodeChild => {
      const text = props.text as string;
      const variant = props.variant ?? 'body';
      const emphasisClass = props.emphasis
        ? `text-emphasis-${props.emphasis}`
        : '';

      if (variant === 'markdown') {
        return h('x-markdown', { content: text });
      }
      return h(
        'text',
        { class: `text-${variant} ${emphasisClass}` },
        text,
      );
    };
  },
});
