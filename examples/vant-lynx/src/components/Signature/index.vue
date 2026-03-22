<!--
  Lynx Limitations:
  - canvas: Lynx has no HTML Canvas API; uses touch-positioned views for visual drawing
  - toDataURL: Cannot export signature as base64 image; submit returns path data JSON
  - devicePixelRatio: No window.devicePixelRatio in Lynx; drawing at 1x scale
  - getBoundingClientRect: Uses Lynx SelectorQuery API instead (for touch offset)
  - tips slot: Implemented but tips-when-canvas-unsupported scenario N/A (no canvas detection)
-->
<script setup lang="ts">
import { ref, computed, defineExpose } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Button from '../Button/index.vue';
import type { SignatureExpose } from './types';
import './index.less';

export interface SignatureProps {
  tips?: string;
  type?: string;
  penColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  clearButtonText?: string;
  confirmButtonText?: string;
}

const props = withDefaults(defineProps<SignatureProps>(), {
  tips: '',
  type: 'png',
  penColor: '#000',
  lineWidth: 3,
  backgroundColor: '',
  clearButtonText: '',
  confirmButtonText: '',
});

const emit = defineEmits<{
  submit: [data: { image: string; canvas: null }];
  clear: [];
  start: [];
  end: [];
  signing: [event: TouchEvent];
}>();

const [, bem] = createNamespace('signature');

interface Point {
  x: number;
  y: number;
}

const lines = ref<Point[][]>([]);
const currentLine = ref<Point[]>([]);
const isDrawing = ref(false);
const hasContent = ref(false);

// Track content area layout for touch offset calculation
let contentLeft = 0;
let contentTop = 0;

function getPosition(event: TouchEvent): Point {
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  if (!touch) return { x: 0, y: 0 };
  // Use clientX/Y minus content area offset
  const x = (touch as any).offsetX ?? (touch.clientX - contentLeft);
  const y = (touch as any).offsetY ?? (touch.clientY - contentTop);
  return { x, y };
}

function onTouchStart(event: TouchEvent) {
  isDrawing.value = true;
  const point = getPosition(event);
  currentLine.value = [point];
  hasContent.value = true;
  emit('start');
}

function onTouchMove(event: TouchEvent) {
  if (!isDrawing.value) return;
  const point = getPosition(event);
  currentLine.value = [...currentLine.value, point];
  emit('signing', event);
}

function onTouchEnd(event: TouchEvent) {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  if (currentLine.value.length > 0) {
    lines.value = [...lines.value, [...currentLine.value]];
  }
  currentLine.value = [];
  emit('end');
}

function onContentLayout(event: any) {
  const layout = event?.detail ?? event;
  if (layout) {
    contentLeft = layout.x ?? layout.left ?? 0;
    contentTop = layout.y ?? layout.top ?? 0;
  }
}

function submit() {
  const isEmpty = lines.value.length === 0 && currentLine.value.length === 0;
  const image = isEmpty ? '' : JSON.stringify(lines.value);
  emit('submit', { image, canvas: null });
}

function clear() {
  lines.value = [];
  currentLine.value = [];
  hasContent.value = false;
  emit('clear');
}

function resize() {
  // No-op in Lynx (no canvas to resize), but exposed for API compatibility
}

defineExpose<SignatureExpose>({ resize, clear, submit });

const allPoints = computed(() => {
  const points: Array<Point & { key: string }> = [];
  for (let i = 0; i < lines.value.length; i++) {
    for (let j = 0; j < lines.value[i].length; j++) {
      points.push({ ...lines.value[i][j], key: `l${i}-${j}` });
    }
  }
  for (let j = 0; j < currentLine.value.length; j++) {
    points.push({ ...currentLine.value[j], key: `c-${j}` });
  }
  return points;
});

const contentStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor;
  }
  return Object.keys(style).length > 0 ? style : undefined;
});
</script>

<template>
  <view :class="bem()">
    <view
      :class="bem('content')"
      :style="contentStyle"
      @bindlayoutchange="onContentLayout"
    >
      <!-- Drawing area (replaces canvas) -->
      <view
        :class="bem('canvas-area')"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Drawn dots -->
        <view
          v-for="point in allPoints"
          :key="point.key"
          :style="{
            position: 'absolute',
            left: `${point.x - lineWidth / 2}px`,
            top: `${point.y - lineWidth / 2}px`,
            width: `${lineWidth}px`,
            height: `${lineWidth}px`,
            borderRadius: `${lineWidth / 2}px`,
            backgroundColor: penColor,
          }"
        />
      </view>
      <!-- Tips shown when no content (replaces canvas-not-supported tips in Vant) -->
      <template v-if="!hasContent">
        <slot name="tips">
          <text v-if="tips" :class="bem('tips')">{{ tips }}</text>
        </slot>
      </template>
    </view>
    <view :class="bem('footer')">
      <Button size="small" @click="clear">
        <text>{{ clearButtonText || '清空' }}</text>
      </Button>
      <Button type="primary" size="small" @click="submit">
        <text>{{ confirmButtonText || '确认' }}</text>
      </Button>
    </view>
  </view>
</template>
