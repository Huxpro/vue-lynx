// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { defineComponent, h, ref } from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { catalogProps } from '../shared.js';
import { NodeRenderer } from '../../vue/A2UIRenderer.js';
import type { GenUIComponent } from '../../vue/component.js';
import type { GenericComponentProps, Surface } from '../../store/types.js';

import '../../../../styles/a2ui/catalog/Tabs.css';

/**
 * Props for the built-in Tabs catalog component.
 *
 * @a2uiCatalog Tabs
 */
export interface TabsProps extends GenericComponentProps {
  tabs: Array<{
    title: string;
    child: string;
  }>;
}

function renderTabsHeader(props: {
  key: string;
  active: boolean;
  onSelect: () => void;
  tab: {
    title: string;
    child: string;
  };
}): VNodeChild {
  return h(
    'view',
    {
      key: props.key,
      class: `tabs-header${props.active ? ' tabs-header-active' : ''}`,
      bindtap: props.onSelect,
    },
    [h('text', { class: 'tabs-header-text' }, props.tab.title)],
  );
}

function renderTabsContent(props: {
  activeTab:
    | {
      title: string;
      child: string;
    }
    | undefined;
  surface: Surface;
}): VNodeChild {
  const childId = props.activeTab?.child;
  if (!childId) return null;

  const child = props.surface.components.get(childId);
  if (!child) return null;

  return h(NodeRenderer, { component: child, surface: props.surface });
}

/**
 * Render a tabbed container whose tabs reference child component ids.
 */
export const Tabs: GenUIComponent = defineComponent({
  name: 'Tabs',
  props: catalogProps('tabs'),
  setup(rawProps: Record<string, unknown>) {
    const props = rawProps as unknown as TabsProps;
    const selectedIndex = ref(0);

    return (): VNodeChild => {
      const { surface, tabs } = props;
      const activeIndex = tabs.length > 0
        ? Math.min(selectedIndex.value, tabs.length - 1)
        : 0;
      const activeTab = tabs[activeIndex];

      if (tabs.length === 0) {
        return h('view', { class: 'tabs' });
      }

      return h('view', { class: 'tabs' }, [
        h(
          'view',
          { class: 'tabs-headers' },
          tabs.map((tab, index) =>
            renderTabsHeader({
              key: `${index}-${tab.child}`,
              active: index === activeIndex,
              onSelect: () => {
                selectedIndex.value = index;
              },
              tab,
            })
          ),
        ),
        h('view', { class: 'tabs-content' }, [
          renderTabsContent({ activeTab, surface }),
        ]),
      ]);
    };
  },
});
