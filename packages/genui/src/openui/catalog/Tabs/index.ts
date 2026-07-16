// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod/v4';

import {
  defineComponent as vueDefineComponent,
  h,
  ref,
  watch,
} from '@vue/runtime-core';
import type { VNodeChild } from '@vue/runtime-core';

import { useOpenUI } from '../../core/context.js';
import { defineComponent } from '../../core/library.js';
import { stringLikeSchema, stringifyValue } from '../utils.js';

import '../../../../styles/openui/catalog/Tabs.css';

const tabSchema = z.object({
  value: z.string(),
  title: stringLikeSchema,
  child: z.any(),
});

const tabsPropsSchema = z.object({
  tabs: z.array(tabSchema),
  value: z.string().optional(),
});

type TabsProps = z.infer<typeof tabsPropsSchema>;

const TabsRenderer = vueDefineComponent({
  name: 'OpenUITabsRenderer',
  props: ['props', 'renderNode', 'statementId', 'onAction'],
  setup(
    rp: { props: TabsProps; renderNode: (v: unknown) => VNodeChild },
  ) {
    const ctx = useOpenUI();
    const firstValue = () => rp.props.tabs[0]?.value ?? '';
    const active = ref(rp.props.value ?? firstValue());
    let dirty = false;

    watch(
      [() => rp.props.value, firstValue],
      () => {
        if (!dirty) {
          active.value = rp.props.value ?? firstValue();
        }
      },
    );

    const onSelect = (value: string) => {
      dirty = true;
      active.value = value;
    };

    return (): VNodeChild => {
      const props = rp.props;
      const isStreaming = ctx.isStreaming;
      if (props.tabs.length === 0) return null;

      const activeTab = props.tabs.find((tab) => tab.value === active.value)
        ?? props.tabs[0];

      return h('view', { class: 'OpenUITabs' }, [
        h(
          'view',
          { class: 'OpenUITabList' },
          props.tabs.map((tab) => {
            const selected = tab.value === activeTab?.value;
            return h(
              'view',
              {
                key: tab.value,
                class: selected
                  ? 'OpenUITabTrigger OpenUITabTriggerActive'
                  : 'OpenUITabTrigger OpenUITabTriggerInactive',
                ...(isStreaming
                  ? {}
                  : { bindtap: () => onSelect(tab.value) }),
              },
              [
                h(
                  'text',
                  { class: 'OpenUITabTriggerText' },
                  stringifyValue(tab.title) || tab.value,
                ),
              ],
            );
          }),
        ),
        h('view', { class: 'OpenUITabBody' }, [
          activeTab ? rp.renderNode(activeTab.child) : null,
        ]),
      ]);
    };
  },
});

export const Tabs = defineComponent({
  name: 'Tabs',
  props: tabsPropsSchema,
  description:
    'Tabbed content switcher. Each tab has value, title, and child content.',
  component: TabsRenderer,
});
