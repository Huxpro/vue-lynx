<script setup lang="ts">
import { provide, toRef, ref } from 'vue-lynx';

export interface DropdownMenuProps {
  activeColor?: string;
  direction?: 'up' | 'down';
  overlay?: boolean;
}

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  activeColor: '#1989fa',
  direction: 'down',
  overlay: true,
});

const openedIndex = ref<number | null>(null);

function openItem(index: number) {
  openedIndex.value = openedIndex.value === index ? null : index;
}

function closeAll() {
  openedIndex.value = null;
}

provide('dropdownMenu', {
  activeColor: toRef(props, 'activeColor'),
  direction: toRef(props, 'direction'),
  overlay: toRef(props, 'overlay'),
  openedIndex,
  openItem,
  closeAll,
});

const containerStyle = {
  position: 'relative' as const,
  zIndex: 10,
};

const barStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  backgroundColor: '#fff',
  borderBottomWidth: 0.5,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
};
</script>

<template>
  <view :style="containerStyle">
    <view :style="barStyle">
      <slot />
    </view>
  </view>
</template>
