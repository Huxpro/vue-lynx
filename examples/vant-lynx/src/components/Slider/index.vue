<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

export interface SliderProps {
  modelValue?: number;
  max?: number;
  min?: number;
  step?: number;
  barHeight?: number;
  buttonSize?: number;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<SliderProps>(), {
  modelValue: 0,
  max: 100,
  min: 0,
  step: 1,
  barHeight: 2,
  buttonSize: 24,
  activeColor: '#1989fa',
  inactiveColor: '#e5e5e5',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const dragging = ref(false);
const trackWidth = ref(0);
const startX = ref(0);
const startValue = ref(0);

const clampedValue = computed(() =>
  Math.min(props.max, Math.max(props.min, props.modelValue)),
);

const percentage = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((clampedValue.value - props.min) / range) * 100;
});

const trackStyle = computed(() => ({
  width: '100%',
  height: props.barHeight,
  backgroundColor: props.inactiveColor,
  borderRadius: props.barHeight / 2,
  position: 'relative' as const,
}));

const fillStyle = computed(() => ({
  width: `${percentage.value}%`,
  height: props.barHeight,
  backgroundColor: props.activeColor,
  borderRadius: props.barHeight / 2,
  position: 'absolute' as const,
  top: 0,
  left: 0,
}));

const buttonWrapStyle = computed(() => ({
  position: 'absolute' as const,
  top: -(props.buttonSize - props.barHeight) / 2,
  left: `${percentage.value}%`,
  marginLeft: -(props.buttonSize / 2),
  width: props.buttonSize,
  height: props.buttonSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const buttonStyle = computed(() => ({
  width: props.buttonSize,
  height: props.buttonSize,
  borderRadius: props.buttonSize / 2,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderStyle: 'solid' as const,
  borderColor: props.disabled ? '#c8c9cc' : props.activeColor,
  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
}));

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  paddingTop: props.buttonSize / 2,
  paddingBottom: props.buttonSize / 2,
  paddingLeft: props.buttonSize / 2,
  paddingRight: props.buttonSize / 2,
  opacity: props.disabled ? 0.5 : 1,
}));

function snapToStep(value: number): number {
  const steps = Math.round((value - props.min) / props.step);
  return Math.min(props.max, Math.max(props.min, props.min + steps * props.step));
}

function onTrackLayout(event: any) {
  const width = event?.detail?.width ?? event?.currentTarget?.offsetWidth ?? 0;
  if (width) {
    trackWidth.value = width;
  }
}

function onTouchStart(event: any) {
  if (props.disabled) return;
  dragging.value = true;
  const touch = event.touches?.[0] || event;
  startX.value = touch.clientX || touch.pageX || 0;
  startValue.value = clampedValue.value;

  // Try to get track width from layout
  const target = event.currentTarget || event.target;
  if (target?.offsetWidth) {
    trackWidth.value = target.offsetWidth;
  }
}

function onTouchMove(event: any) {
  if (props.disabled || !dragging.value) return;
  const touch = event.touches?.[0] || event;
  const currentX = touch.clientX || touch.pageX || 0;
  const deltaX = currentX - startX.value;

  const width = trackWidth.value || 200; // fallback width
  const range = props.max - props.min;
  const deltaValue = (deltaX / width) * range;
  const newValue = snapToStep(startValue.value + deltaValue);

  if (newValue !== clampedValue.value) {
    emit('update:modelValue', newValue);
  }
}

function onTouchEnd() {
  if (props.disabled) return;
  dragging.value = false;
  emit('change', clampedValue.value);
}

function onTrackTap(event: any) {
  if (props.disabled) return;
  // Calculate value from tap position on track
  const touch = event.touches?.[0] || event;
  const x = touch.clientX || touch.pageX || 0;
  const target = event.currentTarget || event.target;
  const rect = target?.getBoundingClientRect?.() || { left: 0, width: trackWidth.value || 200 };
  const offsetX = x - (rect.left || 0);
  const width = rect.width || trackWidth.value || 200;
  const range = props.max - props.min;
  const newValue = snapToStep(props.min + (offsetX / width) * range);
  emit('update:modelValue', newValue);
  emit('change', newValue);
}
</script>

<template>
  <view :style="containerStyle">
    <view
      :style="{ flex: 1, position: 'relative' as const }"
      @layout="onTrackLayout"
      @tap="onTrackTap"
    >
      <!-- Track background -->
      <view :style="trackStyle">
        <!-- Active fill -->
        <view :style="fillStyle" />

        <!-- Thumb button -->
        <view
          :style="buttonWrapStyle"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <view :style="buttonStyle" />
        </view>
      </view>
    </view>
  </view>
</template>
