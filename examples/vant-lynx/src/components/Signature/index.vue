<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

export interface SignatureProps {
  type?: string;
  penColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  clearButtonText?: string;
  confirmButtonText?: string;
}

const props = withDefaults(defineProps<SignatureProps>(), {
  type: 'png',
  penColor: '#000',
  lineWidth: 3,
  backgroundColor: '#fff',
  clearButtonText: 'Clear',
  confirmButtonText: 'Confirm',
});

const emit = defineEmits<{
  submit: [data: { image: string; canvas: any }];
  clear: [];
  start: [];
  end: [];
  signing: [event: any];
}>();

// Track drawing points for visual feedback
interface Point {
  x: number;
  y: number;
}

const lines = ref<Point[][]>([]);
const currentLine = ref<Point[]>([]);
const isDrawing = ref(false);
const hasContent = ref(false);

function getPosition(event: any): Point {
  const touch = event?.changedTouches?.[0] ?? event?.touches?.[0] ?? event;
  const x = touch?.offsetX ?? touch?.pageX ?? touch?.clientX ?? 0;
  const y = touch?.offsetY ?? touch?.pageY ?? touch?.clientY ?? 0;
  return { x, y };
}

function onTouchStart(event: any) {
  isDrawing.value = true;
  const point = getPosition(event);
  currentLine.value = [point];
  hasContent.value = true;
  emit('start');
}

function onTouchMove(event: any) {
  if (!isDrawing.value) return;
  const point = getPosition(event);
  currentLine.value.push(point);
  emit('signing', event);
}

function onTouchEnd(event: any) {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  if (currentLine.value.length > 0) {
    lines.value.push([...currentLine.value]);
  }
  currentLine.value = [];
  emit('end');
}

function onClear() {
  lines.value = [];
  currentLine.value = [];
  hasContent.value = false;
  emit('clear');
}

function onConfirm() {
  // In Lynx environment, we emit the drawn data representation
  // Since we can't use HTML canvas, we emit the path data
  const imageData = hasContent.value ? JSON.stringify(lines.value) : '';
  emit('submit', { image: imageData, canvas: null });
}

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#fff',
}));

const canvasStyle = computed(() => ({
  height: 200,
  backgroundColor: props.backgroundColor,
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderColor: '#ebedf0',
  borderRadius: 8,
  margin: 16,
  marginBottom: 0,
  position: 'relative' as const,
  overflow: 'hidden' as const,
}));

const footerStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
  padding: 16,
};

// Generate visual lines using small view dots
const allPoints = computed(() => {
  const points: Point[] = [];
  for (const line of lines.value) {
    for (const point of line) {
      points.push(point);
    }
  }
  for (const point of currentLine.value) {
    points.push(point);
  }
  return points;
});
</script>

<template>
  <view :style="containerStyle">
    <!-- Drawing area -->
    <view
      :style="canvasStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- Placeholder text when empty -->
      <view
        v-if="!hasContent"
        :style="{
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <text :style="{ fontSize: 14, color: '#c8c9cc' }">Sign here</text>
      </view>

      <!-- Drawn dots (visual representation of strokes) -->
      <view
        v-for="(point, index) in allPoints"
        :key="index"
        :style="{
          position: 'absolute' as const,
          left: point.x - lineWidth / 2,
          top: point.y - lineWidth / 2,
          width: lineWidth,
          height: lineWidth,
          borderRadius: lineWidth / 2,
          backgroundColor: penColor,
        }"
      />
    </view>

    <!-- Footer buttons -->
    <view :style="footerStyle">
      <view
        :style="{
          height: 36,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 18,
          borderWidth: 1,
          borderStyle: 'solid' as const,
          borderColor: '#ebedf0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 8,
          backgroundColor: '#fff',
        }"
        @tap="onClear"
      >
        <text :style="{ fontSize: 14, color: '#323233' }">{{ clearButtonText }}</text>
      </view>
      <view
        :style="{
          height: 36,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 18,
          backgroundColor: '#1989fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="onConfirm"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">{{ confirmButtonText }}</text>
      </view>
    </view>
  </view>
</template>
