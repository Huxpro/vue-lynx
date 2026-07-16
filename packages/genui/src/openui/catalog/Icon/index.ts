// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import { h } from '@vue/runtime-core';

import { defineComponent } from '../../core/library.js';
import type { ComponentRenderProps } from '../../core/library.js';

import '../../../../styles/openui/material-icons.css';
import '../../../../styles/openui/catalog/Icon.css';

const ICON_NAMES = [
  'account_circle',
  'add',
  'arrow_back',
  'arrow_forward',
  'camera',
  'check',
  'close',
  'delete',
  'edit',
  'error',
  'favorite',
  'help',
  'home',
  'info',
  'location_on',
  'lock',
  'mail',
  'menu',
  'more_vert',
  'pause',
  'person',
  'play_arrow',
  'refresh',
  'search',
  'send',
  'settings',
  'share',
  'star',
  'warning',
] as const;

function toMaterialName(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

const iconPropsSchema = z.object({
  name: z.enum(ICON_NAMES),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  color: z.enum(['primary', 'muted', 'inherit']).optional(),
});

export const Icon = defineComponent({
  name: 'Icon',
  props: iconPropsSchema,
  description: 'Material icon. Font CSS is bundled with this component.',
  component: (
    { props }: ComponentRenderProps<z.infer<typeof iconPropsSchema>>,
  ) => {
    const size = props.size ?? 'md';
    const color = props.color ?? 'inherit';
    const sizeClass = size === 'sm'
      ? 'OpenUIIconSm'
      : (size === 'lg'
        ? 'OpenUIIconLg'
        : 'OpenUIIconMd');
    const colorClass = color === 'primary'
      ? 'OpenUIIconColorPrimary'
      : (color === 'muted'
        ? 'OpenUIIconColorMuted'
        : 'OpenUIIconColorInherit');
    return h(
      'text',
      { class: `OpenUIIcon ${sizeClass} ${colorClass}` },
      toMaterialName(props.name),
    );
  },
});
