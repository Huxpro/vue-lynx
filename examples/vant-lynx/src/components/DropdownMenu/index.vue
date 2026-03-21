<!--
  Vant Feature Parity Report:
  - Props: 7/8 supported (overlay, zIndex, duration, direction, activeColor, closeOnClickOutside, closeOnClickOverlay)
  - Missing: swipeThreshold (horizontal scroll N/A in Lynx), autoLocate (no getContainingBlock in Lynx)
  - Expose: close(), opened (ref)
  - Provide/Inject: Provides props object, offset, openedIndex, toggleItem, closeAll to DropdownItem children
  - Slots: 1/1 (default)
  - Gaps:
    - No swipeThreshold (scroll behavior N/A in Lynx)
    - No autoLocate (no DOM rect measurement in Lynx)
    - No useClickAway (no document-level event delegation in Lynx)
    - No scroll tracking (no scrollParent in Lynx)
-->
<script setup lang="ts">
import { provide, toRef, ref, computed, type Ref } from 'vue-lynx';

export interface DropdownMenuProps {
  activeColor?: string;
  direction?: 'up' | 'down';
  overlay?: boolean;
  zIndex?: number | string;
  duration?: number | string;
  closeOnClickOutside?: boolean;
  closeOnClickOverlay?: boolean;
}

export interface DropdownMenuProvide {
  props: DropdownMenuProps;
  offset: Ref<number>;
  openedIndex: Ref<number | null>;
  toggleItem: (index: number) => void;
  closeAll: () => void;
}

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  activeColor: '#1989fa',
  direction: 'down',
  overlay: true,
  zIndex: 10,
  duration: 0.2,
  closeOnClickOutside: true,
  closeOnClickOverlay: true,
});

const openedIndex = ref<number | null>(null);

const opened = computed(() => openedIndex.value !== null);

function toggleItem(index: number) {
  openedIndex.value = openedIndex.value === index ? null : index;
}

function closeAll() {
  openedIndex.value = null;
}

// Expose close and opened for parent usage
defineExpose({
  close: closeAll,
  opened,
});

provide<DropdownMenuProvide>('dropdownMenu', {
  props,
  offset: ref(0),
  openedIndex,
  toggleItem,
  closeAll,
});

const containerStyle = computed(() => ({
  position: 'relative' as const,
  zIndex: Number(props.zIndex) || 10,
}));

const barStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
  zIndex: opened.value ? (Number(props.zIndex) || 10) + 1 : undefined,
}));
</script>

<template>
  <view :style="containerStyle">
    <view :style="barStyle">
      <slot />
    </view>
  </view>
</template>
