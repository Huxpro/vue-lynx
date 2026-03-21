<!--
  Vant Feature Parity Report:
  - Props: 6/6 supported (items, activeId, mainActiveIndex, height, max,
    selectedIcon)
  - Events: 4/4 supported (update:activeId, update:mainActiveIndex,
    clickNav, clickItem)
  - Slots: 0/1 supported
  - Gaps: content slot (custom right-side content area)
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';

export interface TreeSelectItem {
  text: string;
  id: string | number;
  children?: TreeSelectItem[];
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
  selectedIcon: '✓',
});

const emit = defineEmits<{
  'update:activeId': [value: string | number | (string | number)[]];
  'update:mainActiveIndex': [value: number];
  clickNav: [index: number];
  clickItem: [item: TreeSelectItem];
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
  emit('update:mainActiveIndex', index);
  emit('clickNav', index);
}

function onItemTap(item: TreeSelectItem) {
  if (item.disabled) return;

  emit('clickItem', item);

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
</script>

<template>
  <view :style="containerStyle">
    <!-- Left sidebar navigation -->
    <view :style="navStyle">
      <view
        v-for="(item, index) in items"
        :key="index"
        :style="{
          height: 44,
          display: 'flex',
          flexDirection: 'row' as const,
          alignItems: 'center',
          paddingLeft: 12,
          paddingRight: 12,
          backgroundColor: currentNavIndex === index ? '#fff' : 'transparent',
          borderLeftWidth: currentNavIndex === index ? 3 : 0,
          borderLeftStyle: 'solid' as const,
          borderLeftColor: '#1989fa',
        }"
        @tap="onNavTap(index)"
      >
        <text
          :style="{
            fontSize: 14,
            color: currentNavIndex === index ? '#323233' : '#323233',
            fontWeight: currentNavIndex === index ? 'bold' : 'normal',
          }"
        >{{ item.text }}</text>
      </view>
    </view>

    <!-- Right content area -->
    <view :style="contentStyle">
      <view
        v-for="child in currentChildren"
        :key="child.id"
        :style="{
          height: 44,
          display: 'flex',
          flexDirection: 'row' as const,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 16,
          opacity: child.disabled ? 0.5 : 1,
        }"
        @tap="onItemTap(child)"
      >
        <text
          :style="{
            fontSize: 14,
            color: isActiveId(child.id) ? '#1989fa' : '#323233',
            fontWeight: isActiveId(child.id) ? 'bold' : 'normal',
          }"
        >{{ child.text }}</text>
        <text
          v-if="isActiveId(child.id)"
          :style="{ fontSize: 14, color: '#1989fa' }"
        >{{ selectedIcon }}</text>
      </view>
      <view
        v-if="currentChildren.length === 0"
        :style="{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <text :style="{ fontSize: 14, color: '#969799' }">No data</text>
      </view>
    </view>
  </view>
</template>
