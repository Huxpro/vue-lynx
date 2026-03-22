<!--
  Lynx Limitations:
  - overflow-y: auto: Lynx does not support overflow scroll; use scroll-view if content overflows
  - -webkit-overflow-scrolling: Not applicable in Lynx
  - :active pseudo-class: Not available in Lynx
  - cursor/user-select: Not applicable in Lynx
  - van-ellipsis: text-overflow not available in Lynx (text truncation handled by Lynx text element)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import Icon from '../Icon/index.vue';
import Sidebar from '../Sidebar/index.vue';
import SidebarItem from '../SidebarItem/index.vue';
import type { Numeric, TreeSelectChild, TreeSelectItem } from './types';
import './index.less';

const [, bem] = createNamespace('tree-select');

export interface TreeSelectProps {
  items?: TreeSelectItem[];
  activeId?: Numeric | Numeric[];
  mainActiveIndex?: Numeric;
  height?: Numeric;
  max?: Numeric;
  selectedIcon?: string;
}

const props = withDefaults(defineProps<TreeSelectProps>(), {
  items: () => [],
  activeId: 0,
  mainActiveIndex: 0,
  height: 300,
  max: Infinity,
  selectedIcon: 'success',
});

const emit = defineEmits<{
  'update:activeId': [value: Numeric | Numeric[]];
  'update:mainActiveIndex': [value: number];
  clickNav: [index: number];
  clickItem: [item: TreeSelectChild];
}>();

const isActiveItem = (id: Numeric) =>
  Array.isArray(props.activeId)
    ? props.activeId.includes(id)
    : props.activeId === id;

const currentChildren = computed(() => {
  const selected = props.items[+props.mainActiveIndex] || {};
  return selected.children ?? [];
});

function onSidebarChange(index: number) {
  emit('update:mainActiveIndex', index);
}

function onClickSidebarItem(index: number) {
  emit('clickNav', index);
}

function onItemTap(item: TreeSelectChild) {
  if (item.disabled) return;

  let activeId: Numeric | Numeric[];
  if (Array.isArray(props.activeId)) {
    activeId = props.activeId.slice();
    const index = activeId.indexOf(item.id);

    if (index !== -1) {
      activeId.splice(index, 1);
    } else if (activeId.length < +props.max) {
      activeId.push(item.id);
    }
  } else {
    activeId = item.id;
  }

  emit('update:activeId', activeId);
  emit('clickItem', item);
}

const rootStyle = computed(() => ({
  height: addUnit(props.height),
}));
</script>

<template>
  <view :class="bem()" :style="rootStyle">
    <!-- Left sidebar navigation -->
    <Sidebar
      :class="bem('nav')"
      :model-value="mainActiveIndex"
      @change="onSidebarChange"
    >
      <SidebarItem
        v-for="(item, index) in items"
        :key="index"
        :class="[bem('nav-item'), item.className]"
        :dot="item.dot"
        :badge="item.badge"
        :disabled="item.disabled"
        @click="onClickSidebarItem(index)"
      >
        <template #title>
          <slot name="nav-text" v-bind="item">
            <text>{{ item.text }}</text>
          </slot>
        </template>
      </SidebarItem>
    </Sidebar>

    <!-- Right content area -->
    <view :class="bem('content')">
      <slot name="content">
        <view
          v-for="child in currentChildren"
          :key="child.id"
          :class="bem('item', { active: isActiveItem(child.id), disabled: child.disabled })"
          @tap="onItemTap(child)"
        >
          <text>{{ child.text }}</text>
          <Icon
            v-if="isActiveItem(child.id)"
            :name="selectedIcon"
            :class="bem('selected')"
          />
        </view>
      </slot>
    </view>
  </view>
</template>
