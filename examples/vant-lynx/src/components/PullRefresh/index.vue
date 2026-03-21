<script setup lang="ts">
import { ref, watch, computed } from 'vue-lynx';

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
let startY = 0;

const statusText = computed(() => {
  switch (status.value) {
    case 'pulling': return props.pullingText;
    case 'loosing': return props.loosingText;
    case 'loading': return props.loadingText;
    case 'success': return props.successText;
    default: return '';
  }
});

watch(() => props.modelValue, (val) => {
  if (!val && status.value === 'loading') {
    if (props.successText) {
      status.value = 'success';
      setTimeout(() => {
        distance.value = 0;
        status.value = 'normal';
      }, 500);
    } else {
      distance.value = 0;
      status.value = 'normal';
    }
  }
});

function onTouchStart(e: any) {
  if (props.disabled || props.modelValue) return;
  startY = e?.touches?.[0]?.clientY || 0;
}

function onTouchMove(e: any) {
  if (props.disabled || props.modelValue) return;
  const currentY = e?.touches?.[0]?.clientY || 0;
  const deltaY = currentY - startY;
  if (deltaY <= 0) return;

  const dist = Math.min(deltaY * 0.5, props.headHeight * 2);
  distance.value = dist;

  if (dist >= props.pullDistance) {
    status.value = 'loosing';
  } else {
    status.value = 'pulling';
  }
  emit('change', { status: status.value, distance: dist });
}

function onTouchEnd() {
  if (props.disabled || props.modelValue) return;
  if (status.value === 'loosing') {
    distance.value = props.headHeight;
    status.value = 'loading';
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
