// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import { NodeRenderer } from '../../vue/A2UIRenderer.js';
import type { GenUIComponent } from '../../vue/component.js';
import { useDataBinding } from '../../vue/useDataBinding.js';
import type {
  ComponentInstance,
  GenericComponentProps,
  Surface,
} from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Column.css';

const buildChild = (
  surface: Surface,
  childId: string,
  dataContextPath: string | undefined,
  childPath?: string,
  key = childId,
): {
  key: string;
  component: ComponentInstance;
} | null => {
  const child = surface.components.get(childId);
  if (!child) return null;
  let childWithContext = child;
  if (childPath) {
    childWithContext = { ...child, dataContextPath: childPath };
  } else if (dataContextPath) {
    childWithContext = { ...child, dataContextPath };
  }
  return {
    key,
    component: childWithContext,
  };
};

/**
 * Props for the built-in Column catalog component.
 *
 * @a2uiCatalog Column
 */
export interface ColumnProps extends GenericComponentProps {
  /** Static child IDs array or template object. */
  children: string[] | { componentId: string; path: string };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?:
    | 'start'
    | 'center'
    | 'end'
    | 'stretch'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly';
}

/**
 * Render child component ids in vertical order.
 */
export const Column: GenUIComponent = defineComponent({
  name: 'Column',
  props: catalogProps('children', 'align', 'justify'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as ColumnProps;

    const template = () => {
      const children = props.children;
      const isDynamic = children && !Array.isArray(children)
        && typeof children === 'object';
      return isDynamic ? children : undefined;
    };

    const [columnData, , fullPath] = useDataBinding<
      Record<string, unknown>[]
    >(
      () => {
        const t = template();
        return t ? { path: t.path } : undefined;
      },
      () => props.surface,
      () => props.dataContextPath,
      [],
    );

    return (): VNodeChild => {
      const {
        children,
        surface,
        dataContextPath,
        justify = 'start',
        align = 'stretch',
      } = props;

      const childList = Array.isArray(children)
        ? children.map((childId: string) =>
          buildChild(surface, childId, dataContextPath)
        )
        : (Array.isArray(columnData.value) ? columnData.value : []).map(
          (item, index) => {
            const key = item && typeof item === 'object' && 'key' in item
              ? String(item['key'])
              : `${index}`;
            const itemPath = `${fullPath.value}/${index}`;
            return buildChild(
              surface,
              template()?.componentId ?? '',
              dataContextPath,
              itemPath,
              key,
            );
          },
        );

      return h(
        'view',
        { class: `column alignment-${align} distribution-${justify}` },
        childList.map((item) => {
          if (!item) return null;
          const weight = item.component.weight;
          if (typeof weight === 'number' && weight > 0) {
            return h(
              'view',
              {
                key: item.key,
                class:
                  `column-weighted-item column-weighted-item-${weight}`,
                style: { flex: `${weight} ${weight} 0`, minHeight: 0 },
              },
              [
                h(NodeRenderer, {
                  component: item.component,
                  surface,
                }),
              ],
            );
          }
          return h(NodeRenderer, {
            key: item.key,
            component: item.component,
            surface,
          });
        }),
      );
    };
  },
});
