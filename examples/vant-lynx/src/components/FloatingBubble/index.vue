<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

export interface FloatingBubbleProps {
  offset?: { x: number; y: number };
  axis?: 'x' | 'y' | 'xy' | 'lock';
  magnetic?: 'x' | 'y' | '';
  icon?: string;
  gap?: number;
}

const props = withDefaults(defineProps<FloatingBubbleProps>(), {
  offset: () => ({ x: -1, y: -1 }),
  axis: 'y',
  magnetic: '',
  icon: '',
  gap: 24,
});

const emit = defineEmits<{
  click: [];
  'update:offset': [value: { x: number; y: number }];
  'offset-change': [value: { x: number; y: number }];
}>();

const posX = ref(props.offset.x >= 0 ? props.offset.x : 300);
const posY = ref(props.offset.y >= 0 ? props.offset.y : 500);
const startX = ref(0);
const startY = ref(0);
const startPosX = ref(0);
const startPosY = ref(0);
const dragging = ref(false);

function onTouchStart(e: any) {
  const touch = e.touches?.[0] || e;
  startX.value = touch.clientX || 0;
  startY.value = touch.clientY || 0;
  startPosX.value = posX.value;
  startPosY.value = posY.value;
  dragging.value = true;
}

function onTouchMove(e: any) {
  if (!dragging.value) return;
  const touch = e.touches?.[0] || e;
  const deltaX = (touch.clientX || 0) - startX.value;
  const deltaY = (touch.clientY || 0) - startY.value;

  if (props.axis === 'x' || props.axis === 'xy') {
    posX.value = startPosX.value + deltaX;
  }
  if (props.axis === 'y' || props.axis === 'xy') {
    posY.value = startPosY.value + deltaY;
  }
}

function onTouchEnd() {
  dragging.value = false;
  const offset = { x: posX.value, y: posY.value };
  emit('update:offset', offset);
  emit('offset-change', offset);
}

function onClick() {
  if (!dragging.value) {
    emit('click');
  }
}
</script>

<template>
  <view
    :style="{
      position: 'fixed',
      left: posX,
      top: posY,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#1989fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @tap="onClick"
  >
    <text :style="{ fontSize: 20, color: '#fff' }">{{ icon || '\u2605' }}</text>
  </view>
</template>
