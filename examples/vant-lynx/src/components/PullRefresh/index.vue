<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

export interface PullRefreshProps {
  modelValue?: boolean;
  pullingText?: string;
  loosingText?: string;
  loadingText?: string;
  successText?: string;
  headHeight?: number;
  pullDistance?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<PullRefreshProps>(), {
  modelValue: false,
  pullingText: 'Pull to refresh...',
  loosingText: 'Release to refresh...',
  loadingText: 'Loading...',
  successText: '',
  headHeight: 50,
  pullDistance: 50,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  refresh: [];
  change: [params: { status: string; distance: number }];
}>();

type PullStatus = 'normal' | 'pulling' | 'loosing' | 'loading' | 'success';

const status = ref<PullStatus>('normal');
const distance = ref(0);
const startY = ref(0);

const statusText = computed(() => {
  switch (status.value) {
    case 'pulling': return props.pullingText;
    case 'loosing': return props.loosingText;
    case 'loading': return props.loadingText;
    case 'success': return props.successText;
    default: return '';
  }
});

function onTouchStart(e: any) {
  if (props.disabled || props.modelValue) return;
  const touch = e.touches?.[0] || e;
  startY.value = touch.clientY || 0;
}

function onTouchMove(e: any) {
  if (props.disabled || props.modelValue) return;
  const touch = e.touches?.[0] || e;
  const deltaY = (touch.clientY || 0) - startY.value;
  if (deltaY <= 0) return;

  distance.value = Math.min(deltaY * 0.5, props.headHeight * 2);
  status.value = distance.value >= props.pullDistance ? 'loosing' : 'pulling';
  emit('change', { status: status.value, distance: distance.value });
}

function onTouchEnd() {
  if (props.disabled || props.modelValue) return;
  if (status.value === 'loosing') {
    status.value = 'loading';
    distance.value = props.headHeight;
    emit('update:modelValue', true);
    emit('refresh');
  } else {
    distance.value = 0;
    status.value = 'normal';
  }
}
</script>

<template>
  <view
    :style="{ overflow: 'hidden' }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <view :style="{ transform: `translateY(${distance}px)` }">
      <view
        :style="{
          height: headHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -headHeight,
        }"
      >
        <text v-if="statusText" :style="{ fontSize: 14, color: '#969799' }">{{ statusText }}</text>
      </view>
      <slot />
    </view>
  </view>
</template>
