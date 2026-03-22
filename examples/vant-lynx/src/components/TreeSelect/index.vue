<!--
  Lynx Limitations:
  - HTML div/nav elements: Lynx uses view/text instead
  - CSS class-based BEM styling: replaced with inline styles
  - className on TreeSelectItem: no-op (Lynx has no CSS class system)
  - :active pseudo-class: not available in Lynx
  - cursor/user-select: not applicable in Lynx
  - van-ellipsis: text overflow handled differently in Lynx
  - overflow-y: auto scroll: Lynx uses scroll-view for scrollable content
  - -webkit-overflow-scrolling: not applicable in Lynx
  - dot/badge on nav items: uses inline rendering (no Badge component integration)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import Badge from '../Badge/index.vue';
import type { Numeric, TreeSelectChild, TreeSelectItem } from './types';
import './index.less';

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

function addUnit(value: Numeric | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    return `${value}px`;
  }
  return String(value);
}

const currentNavIndex = computed(() => +props.mainActiveIndex);

const currentChildren = computed(() => {
  const item = props.items[currentNavIndex.value];
  return item?.children ?? [];
});

function isActiveId(id: Numeric): boolean {
  if (Array.isArray(props.activeId)) {
    return props.activeId.includes(id);
  }
  return props.activeId === id;
}

function onNavTap(index: number) {
  const item = props.items[index];
  if (item?.disabled) return;

  // Only emit update:mainActiveIndex when index actually changes (like Vant's Sidebar onChange)
  if (index !== currentNavIndex.value) {
    emit('update:mainActiveIndex', index);
  }
  // Always emit clickNav (like Vant's SidebarItem onClick)
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

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  height: addUnit(props.height),
  fontSize: '14px',
}));

const navStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
  backgroundColor: '#f7f8fa',
};

const contentStyle = {
  flex: 2,
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
  backgroundColor: '#fff',
};

function getNavItemStyle(index: number, disabled?: boolean) {
  const isActive = currentNavIndex.value === index;
  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingTop: '14px',
    paddingBottom: '14px',
    paddingLeft: '8px',
    paddingRight: '8px',
    backgroundColor: isActive ? '#fff' : 'transparent',
    borderLeftWidth: isActive ? '3px' : '0px',
    borderLeftStyle: 'solid' as const,
    borderLeftColor: '#1989fa',
    opacity: disabled ? '0.5' : '1',
  };
}

function getNavTextStyle(index: number) {
  const isActive = currentNavIndex.value === index;
  return {
    fontSize: '14px',
    color: isActive ? '#323233' : '#323233',
    fontWeight: isActive ? 'bold' : ('normal' as any),
  };
}

function getChildItemStyle(disabled?: boolean) {
  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: '48px',
    paddingLeft: '16px',
    paddingRight: '32px',
  };
}

function getChildTextStyle(active: boolean) {
  return {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: active ? '#1989fa' : '#323233',
    flex: 1,
  };
}

const selectedIconStyle = {
  position: 'absolute' as const,
  right: '16px',
};
</script>

<template>
  <view :style="containerStyle">
    <!-- Left sidebar navigation -->
    <view :style="navStyle">
      <view
        v-for="(item, index) in items"
        :key="index"
        :style="getNavItemStyle(index, item.disabled)"
        @tap="onNavTap(index)"
      >
        <slot name="nav-text" v-bind="item">
          <Badge v-if="item.dot || item.badge" :dot="item.dot" :content="item.badge">
            <text :style="getNavTextStyle(index)">{{ item.text }}</text>
          </Badge>
          <text v-else :style="getNavTextStyle(index)">{{ item.text }}</text>
        </slot>
      </view>
    </view>

    <!-- Right content area -->
    <view :style="contentStyle">
      <slot name="content">
        <view
          v-for="child in currentChildren"
          :key="child.id"
          :style="getChildItemStyle(child.disabled)"
          @tap="onItemTap(child)"
        >
          <text :style="getChildTextStyle(isActiveId(child.id))">{{ child.text }}</text>
          <Icon
            v-if="isActiveId(child.id)"
            :name="selectedIcon"
            :size="16"
            color="#1989fa"
          />
        </view>
      </slot>
    </view>
  </view>
</template>
