<!--
  Vant Feature Parity Report:
  - Props: 8/8 supported
    - modelValue: any (supports custom activeValue/inactiveValue, not just boolean)
    - loading: boolean
    - disabled: boolean
    - size: number | string (controls overall dimensions, default 26)
    - activeColor: string (background when checked, default '#1989fa')
    - inactiveColor: string (background when unchecked, default 'rgba(120, 120, 128, 0.16)')
    - activeValue: any (value when checked, default true)
    - inactiveValue: any (value when unchecked, default false)
  - Events: 2/2 supported
    - update:modelValue: emits activeValue or inactiveValue
    - change: emits new value after toggle
  - Slots: 2/2 supported
    - node: custom content inside the thumb circle
    - background: custom content rendered behind the node (inside track)
  - Loading: uses the project's Loading component (circular spinner inside thumb)
  - Lynx Adaptations:
    - Uses view/text elements with inline styles only (no CSS classes)
    - display: 'flex' set explicitly on track (Lynx requires explicit flex display)
    - No CSS transition/animation (Lynx limitation); toggle is instant
    - Thumb shadow approximated with light border (no box-shadow in Lynx)
    - Loading spinner is static (no CSS keyframes in Lynx)
  - CSS Variables: Not supported (Lynx limitation)
  - Gaps:
    - No CSS transition on background color or thumb position (Lynx does not support CSS transitions)
    - No box-shadow on thumb (Lynx does not support box-shadow)
    - No role/aria attributes (Lynx does not support ARIA)
    - No cursor styling (Lynx is touch-only)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import Loading from '../Loading/index.vue';

export interface SwitchProps {
  modelValue?: unknown;
  loading?: boolean;
  disabled?: boolean;
  size?: number | string;
  activeColor?: string;
  inactiveColor?: string;
  activeValue?: unknown;
  inactiveValue?: unknown;
}

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  loading: false,
  disabled: false,
  size: 26,
  activeColor: '#1989fa',
  inactiveColor: 'rgba(120, 120, 128, 0.16)',
  activeValue: true,
  inactiveValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: unknown];
  change: [value: unknown];
}>();

const slots = useSlots();

const sizeValue = computed(() => {
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 26;
  return props.size;
});

const isChecked = computed(() => props.modelValue === props.activeValue);

const trackStyle = computed(() => {
  const sz = sizeValue.value;
  const trackWidth = Math.round(sz * 1.8) + 4;
  const trackHeight = sz + 4;
  return {
    position: 'relative' as const,
    width: trackWidth,
    height: trackHeight,
    borderRadius: sz,
    backgroundColor: isChecked.value ? props.activeColor : props.inactiveColor,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    opacity: props.disabled ? 0.5 : 1,
    overflow: 'hidden' as const,
  };
});

const thumbStyle = computed(() => {
  const sz = sizeValue.value;
  const trackWidth = Math.round(sz * 1.8) + 4;
  // Thumb offset: 2px from left when off, pushed right when on
  const offset = isChecked.value ? trackWidth - sz - 2 : 2;
  return {
    position: 'absolute' as const,
    top: 2,
    left: offset,
    width: sz,
    height: sz,
    borderRadius: sz / 2,
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    // Approximate box-shadow with a light border
    borderWidth: 0.5,
    borderStyle: 'solid' as const,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  };
});

const loadingSize = computed(() => {
  // Loading spinner is 50% of thumb size, matching Vant's 50% width/height
  return Math.round(sizeValue.value * 0.5);
});

const loadingColor = computed(() => {
  return isChecked.value ? props.activeColor : '#c9c9c9';
});

function onTap() {
  if (props.disabled || props.loading) return;
  const newValue = isChecked.value ? props.inactiveValue : props.activeValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
}
</script>

<template>
  <view :style="trackStyle" @tap="onTap">
    <!-- background slot: rendered behind the node, inside track -->
    <slot name="background" />
    <!-- thumb / node -->
    <view :style="thumbStyle">
      <Loading
        v-if="loading"
        type="circular"
        :size="loadingSize"
        :color="loadingColor"
      />
      <slot v-else name="node" />
    </view>
  </view>
</template>
