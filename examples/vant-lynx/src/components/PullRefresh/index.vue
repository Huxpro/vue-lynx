<script setup lang="ts">
import { ref, watch, computed } from 'vue-lynx';
import { useMainThreadRef, runOnBackground } from 'vue-lynx';

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

const statusText = computed(() => {
  switch (status.value) {
    case 'pulling': return props.pullingText;
    case 'loosing': return props.loosingText;
    case 'loading': return props.loadingText;
    case 'success': return props.successText;
    default: return '';
  }
});

// Watch for modelValue becoming false (refresh complete)
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

// --- Main Thread refs for smooth gesture ---
const trackRef = useMainThreadRef<unknown>(null);
const startYRef = useMainThreadRef<number>(0);
const isLoosingRef = useMainThreadRef<boolean>(false);

// Captured props for main thread access
const headHeight = props.headHeight;
const pullDist = props.pullDistance;

// Background thread functions called from main thread
function onStatusUpdate(newStatus: string, dist: number) {
  distance.value = dist;
  status.value = newStatus as PullStatus;
  emit('change', { status: newStatus, distance: dist });
}

function onReleaseTrigger() {
  distance.value = headHeight;
  status.value = 'loading';
  emit('update:modelValue', true);
  emit('refresh');
}

function onReleaseCancel() {
  distance.value = 0;
  status.value = 'normal';
}

// --- Main Thread touch handlers ---
const handleTouchStart = (e: { touches: Array<{ clientY: number }> }) => {
  'main thread';
  startYRef.current = e.touches[0].clientY;
  isLoosingRef.current = false;
};

const handleTouchMove = (e: { touches: Array<{ clientY: number }> }) => {
  'main thread';
  const deltaY = e.touches[0].clientY - startYRef.current;
  if (deltaY <= 0) return;

  const dist = Math.min(deltaY * 0.5, headHeight * 2);
  const loosing = dist >= pullDist;
  isLoosingRef.current = loosing;

  const el = trackRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void };
  };
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateY(${dist}px)`);
  }

  runOnBackground(onStatusUpdate)(loosing ? 'loosing' : 'pulling', dist);
};

const handleTouchEnd = () => {
  'main thread';
  const el = trackRef as unknown as {
    current?: { setStyleProperty?(k: string, v: string): void };
  };

  if (isLoosingRef.current) {
    // Snap to head height for loading state
    if (el.current?.setStyleProperty) {
      el.current.setStyleProperty('transform', `translateY(${headHeight}px)`);
    }
    runOnBackground(onReleaseTrigger)();
  } else {
    // Reset - not pulled enough
    if (el.current?.setStyleProperty) {
      el.current.setStyleProperty('transform', 'translateY(0px)');
    }
    runOnBackground(onReleaseCancel)();
  }
};
</script>

<template>
  <view
    :style="{ overflow: 'hidden' }"
    :main-thread-bindtouchstart="!disabled && !modelValue ? handleTouchStart : undefined"
    :main-thread-bindtouchmove="!disabled && !modelValue ? handleTouchMove : undefined"
    :main-thread-bindtouchend="!disabled && !modelValue ? handleTouchEnd : undefined"
  >
    <view
      :main-thread-ref="trackRef"
      :style="{ transform: `translateY(${distance}px)` }"
    >
      <view
        :style="{
          height: `${headHeight}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: `${-headHeight}px`,
        }"
      >
        <text v-if="statusText" :style="{ fontSize: '14px', color: '#969799' }">{{ statusText }}</text>
      </view>
      <slot />
    </view>
  </view>
</template>
