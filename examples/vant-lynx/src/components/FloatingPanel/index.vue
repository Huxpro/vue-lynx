<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

export interface FloatingPanelProps {
  height?: number;
  anchors?: number[];
  duration?: number;
  contentDraggable?: boolean;
}

const props = withDefaults(defineProps<FloatingPanelProps>(), {
  height: 100,
  anchors: () => [100, 300],
  duration: 300,
  contentDraggable: true,
});

const emit = defineEmits<{
  'update:height': [value: number];
  'height-change': [params: { height: number }];
}>();

const currentHeight = ref(props.height);
const startY = ref(0);
const startHeight = ref(0);

function findNearestAnchor(h: number): number {
  return props.anchors.reduce((prev, curr) =>
    Math.abs(curr - h) < Math.abs(prev - h) ? curr : prev
  );
}

function onTouchStart(e: any) {
  const touch = e.touches?.[0] || e;
  startY.value = touch.clientY || 0;
  startHeight.value = currentHeight.value;
}

function onTouchMove(e: any) {
  const touch = e.touches?.[0] || e;
  const deltaY = startY.value - (touch.clientY || 0);
  const minH = Math.min(...props.anchors);
  const maxH = Math.max(...props.anchors);
  currentHeight.value = Math.min(maxH, Math.max(minH, startHeight.value + deltaY));
}

function onTouchEnd() {
  const anchor = findNearestAnchor(currentHeight.value);
  currentHeight.value = anchor;
  emit('update:height', anchor);
  emit('height-change', { height: anchor });
}
</script>

<template>
  <view
    :style="{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: currentHeight,
      backgroundColor: '#fff',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      boxShadow: '0 -2px 12px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 999,
    }"
  >
    <view
      :style="{
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
      }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view :style="{ width: 20, height: 3, backgroundColor: '#c8c9cc', borderRadius: 2 }" />
    </view>
    <view :style="{ flex: 1, overflow: 'hidden' }">
      <slot />
    </view>
  </view>
</template>
