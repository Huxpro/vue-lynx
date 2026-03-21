<!--
  Vant Feature Parity Report:
  - Props: 6/6 (items, activeId, mainActiveIndex, height, max, selectedIcon)
  - Events: 4/4 (update:activeId, update:mainActiveIndex, clickNav, clickItem)
  - Slots: 2/2 (content, nav-text)
  - Badge/dot rendering on nav items: Supported
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import Badge from '../Badge/index.vue';

export interface TreeSelectChild {
  text: string;
  id: string | number;
  disabled?: boolean;
}

export interface TreeSelectItem {
  text: string;
  dot?: boolean;
  badge?: string | number;
  children?: TreeSelectChild[];
  disabled?: boolean;
}

export interface TreeSelectProps {
  items?: TreeSelectItem[];
  activeId?: string | number | (string | number)[];
  mainActiveIndex?: number;
  height?: number;
  max?: number;
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
  'update:activeId': [value: string | number | (string | number)[]];
  'update:mainActiveIndex': [value: number];
  clickNav: [index: number];
  clickItem: [item: TreeSelectChild];
}>();

const currentNavIndex = computed(() => props.mainActiveIndex);

const currentChildren = computed(() => {
  const item = props.items[currentNavIndex.value];
  return item?.children ?? [];
});

function isActiveId(id: string | number): boolean {
  if (Array.isArray(props.activeId)) {
    return props.activeId.includes(id);
  }
  return props.activeId === id;
}

function onNavTap(index: number) {
  const item = props.items[index];
  if (item?.disabled) return;
  emit('update:mainActiveIndex', index);
  emit('clickNav', index);
}

function onItemTap(item: TreeSelectChild) {
  if (item.disabled) return;

  if (Array.isArray(props.activeId)) {
    const ids = [...props.activeId];
    const index = ids.indexOf(item.id);
    if (index !== -1) {
      ids.splice(index, 1);
      emit('update:activeId', ids);
    } else {
      if (props.max !== Infinity && ids.length >= props.max) return;
      ids.push(item.id);
      emit('update:activeId', ids);
    }
  } else {
    emit('update:activeId', item.id);
  }

  emit('clickItem', item);
}

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  height: props.height,
  backgroundColor: '#fff',
}));

const navStyle = {
  width: 120,
  backgroundColor: '#f7f8fa',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
};

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
};

function getNavItemStyle(index: number, disabled?: boolean) {
  return {
    height: 44,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: currentNavIndex.value === index ? '#fff' : 'transparent',
    borderLeftWidth: currentNavIndex.value === index ? 3 : 0,
    borderLeftStyle: 'solid' as const,
    borderLeftColor: '#1989fa',
    opacity: disabled ? 0.5 : 1,
  };
}

function getNavTextStyle(index: number) {
  return {
    fontSize: 14,
    color: '#323233',
    fontWeight: currentNavIndex.value === index ? 'bold' : ('normal' as any),
  };
}

function getChildItemStyle(disabled?: boolean) {
  return {
    height: 44,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingLeft: 16,
    paddingRight: 16,
    opacity: disabled ? 0.5 : 1,
  };
}

function getChildTextStyle(active: boolean) {
  return {
    fontSize: 14,
    color: active ? '#1989fa' : '#323233',
    fontWeight: active ? 'bold' : ('normal' as any),
  };
}

const emptyStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
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
        <slot name="nav-text" :item="item">
          <Badge v-if="item.dot || item.badge != null" :dot="item.dot" :content="item.badge">
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
        <view
          v-if="currentChildren.length === 0"
          :style="emptyStyle"
        >
          <text :style="{ fontSize: 14, color: '#969799' }">No data</text>
        </view>
      </slot>
    </view>
  </view>
</template>
