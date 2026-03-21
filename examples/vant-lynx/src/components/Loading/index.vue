<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface LoadingProps {
  type?: 'circular' | 'spinner';
  color?: string;
  size?: string | number;
  textSize?: string | number;
  vertical?: boolean;
}

const props = withDefaults(defineProps<LoadingProps>(), {
  type: 'circular',
  color: '#c9c9c9',
  size: 30,
  vertical: false,
});

const spinnerSize = computed(() => {
  if (typeof props.size === 'string') return parseInt(props.size, 10) || 30;
  return props.size;
});

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: props.vertical ? ('column' as const) : ('row' as const),
  alignItems: 'center',
}));

const spinnerStyle = computed(() => ({
  width: spinnerSize.value,
  height: spinnerSize.value,
  borderRadius: spinnerSize.value / 2,
  borderWidth: 2,
  borderStyle: 'solid' as const,
  borderColor: props.type === 'circular'
    ? `${props.color} ${props.color} ${props.color} transparent`
    : props.color,
}));

const textStyle = computed(() => ({
  fontSize: typeof props.textSize === 'number' ? props.textSize : (parseInt(String(props.textSize), 10) || 14),
  color: props.color === '#c9c9c9' ? '#969799' : props.color,
  marginLeft: props.vertical ? 0 : 8,
  marginTop: props.vertical ? 8 : 0,
}));
</script>

<template>
  <view :style="containerStyle">
    <view :style="spinnerStyle" />
    <slot>
      <text v-if="false" />
    </slot>
  </view>
</template>
