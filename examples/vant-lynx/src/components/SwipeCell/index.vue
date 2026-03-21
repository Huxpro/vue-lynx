<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

export interface SwipeCellProps {
  name?: string | number;
  leftWidth?: number;
  rightWidth?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SwipeCellProps>(), {
  name: '',
  leftWidth: 0,
  rightWidth: 0,
  disabled: false,
});

const emit = defineEmits<{
  open: [params: { name: string | number; position: 'left' | 'right' }];
  close: [params: { name: string | number; position: 'left' | 'right' }];
  click: [position: 'left' | 'right' | 'cell' | 'outside'];
}>();

const offset = ref(0);
const startX = ref(0);
const opened = ref<'left' | 'right' | null>(null);

function onTouchStart(e: any) {
  if (props.disabled) return;
  const touch = e.touches?.[0] || e;
  startX.value = touch.clientX || 0;
}

function onTouchMove(e: any) {
  if (props.disabled) return;
  const touch = e.touches?.[0] || e;
  const deltaX = (touch.clientX || 0) - startX.value;

  if (deltaX > 0 && props.leftWidth) {
    offset.value = Math.min(deltaX, props.leftWidth);
  } else if (deltaX < 0 && props.rightWidth) {
    offset.value = Math.max(deltaX, -props.rightWidth);
  }
}

function onTouchEnd() {
  if (props.disabled) return;
  if (offset.value > props.leftWidth / 2) {
    offset.value = props.leftWidth;
    opened.value = 'left';
    emit('open', { name: props.name, position: 'left' });
  } else if (offset.value < -props.rightWidth / 2) {
    offset.value = -props.rightWidth;
    opened.value = 'right';
    emit('open', { name: props.name, position: 'right' });
  } else {
    close();
  }
}

function close() {
  if (opened.value) {
    emit('close', { name: props.name, position: opened.value });
  }
  offset.value = 0;
  opened.value = null;
}

function onCellClick() {
  if (opened.value) {
    close();
  } else {
    emit('click', 'cell');
  }
}
</script>

<template>
  <view :style="{ position: 'relative', overflow: 'hidden' }">
    <view
      :style="{
        display: 'flex',
        flexDirection: 'row',
        transform: `translateX(${offset}px)`,
      }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @tap="onCellClick"
    >
      <view
        v-if="leftWidth"
        :style="{
          position: 'absolute',
          top: 0,
          left: -leftWidth,
          width: leftWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
        }"
        @tap.stop="emit('click', 'left')"
      >
        <slot name="left" />
      </view>
      <view :style="{ flex: 1 }">
        <slot />
      </view>
      <view
        v-if="rightWidth"
        :style="{
          position: 'absolute',
          top: 0,
          right: -rightWidth,
          width: rightWidth,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
        }"
        @tap.stop="emit('click', 'right')"
      >
        <slot name="right" />
      </view>
    </view>
  </view>
</template>
