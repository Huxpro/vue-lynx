<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface SkeletonProps {
  row?: number;
  rowWidth?: string | number | (string | number)[];
  title?: boolean;
  titleWidth?: string | number;
  avatar?: boolean;
  avatarSize?: number;
  avatarShape?: 'round' | 'square';
  loading?: boolean;
  animate?: boolean;
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  row: 0,
  title: false,
  titleWidth: '40%',
  avatar: false,
  avatarSize: 32,
  avatarShape: 'round',
  loading: true,
  animate: true,
});

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  padding: 16,
}));

const avatarStyle = computed(() => ({
  width: props.avatarSize,
  height: props.avatarSize,
  borderRadius: props.avatarShape === 'round' ? props.avatarSize / 2 : 4,
  backgroundColor: '#f2f3f5',
  marginRight: 16,
  flexShrink: 0,
  opacity: props.animate ? 0.6 : 1,
}));

const contentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
};

const titleStyle = computed(() => ({
  width: typeof props.titleWidth === 'number' ? props.titleWidth : props.titleWidth,
  height: 16,
  backgroundColor: '#f2f3f5',
  borderRadius: 4,
  marginBottom: 12,
  opacity: props.animate ? 0.6 : 1,
}));

function getRowWidth(index: number): string | number {
  if (!props.rowWidth) {
    // Last row is 60%, others 100%
    return index === props.row - 1 ? '60%' : '100%';
  }
  if (Array.isArray(props.rowWidth)) {
    return props.rowWidth[index] ?? '100%';
  }
  return props.rowWidth;
}

function getRowStyle(index: number) {
  const width = getRowWidth(index);
  return {
    width: typeof width === 'number' ? width : width,
    height: 16,
    backgroundColor: '#f2f3f5',
    borderRadius: 4,
    marginTop: index > 0 ? 12 : 0,
    opacity: props.animate ? 0.6 : 1,
  };
}

const rows = computed(() => {
  const result: number[] = [];
  for (let i = 0; i < props.row; i++) {
    result.push(i);
  }
  return result;
});
</script>

<template>
  <view v-if="loading" :style="containerStyle">
    <!-- Avatar -->
    <view v-if="avatar" :style="avatarStyle" />

    <!-- Content -->
    <view :style="contentStyle">
      <!-- Title -->
      <view v-if="title" :style="titleStyle" />

      <!-- Rows -->
      <view
        v-for="index in rows"
        :key="index"
        :style="getRowStyle(index)"
      />
    </view>
  </view>

  <!-- Default slot (shown when not loading) -->
  <slot v-else />
</template>
