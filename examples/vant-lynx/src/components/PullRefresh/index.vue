<!--
  Vant Feature Parity Report:
  - Props: 10/10 supported
    Supported: modelValue, pullingText, loosingText, loadingText, successText,
               headHeight, pullDistance, disabled, successDuration, animationDuration
  - Events: 3/3 supported (update:modelValue, refresh, change)
  - Slots: 6/6 supported (default, normal, pulling, loosing, loading, success)
    All status slots receive { distance } as scoped slot props
  - Sub-components: Loading imported for loading state indicator
  - Lynx Adaptations:
    - Touch events use Lynx touch model (@touchstart/@touchmove/@touchend)
    - Damping/ease function applied to pull distance (matches Vant behavior)
    - transform uses translateY for pull distance
  - Gaps:
    - No CSS transition animation on snap-back (animationDuration accepted but unused)
    - No scroll parent detection (Lynx scroll-view model differs from web)
    - Touch passive event handling not configurable in Lynx
    - No useTouch composable; simplified inline touch tracking
-->
<script setup lang="ts">
import { ref, watch, useSlots } from 'vue-lynx';
import Loading from '../Loading/index.vue';

export interface PullRefreshProps {
  modelValue?: boolean;
  pullingText?: string;
  loosingText?: string;
  loadingText?: string;
  successText?: string;
  headHeight?: number;
  pullDistance?: number;
  successDuration?: number;
  animationDuration?: number;
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
  successDuration: 500,
  animationDuration: 300,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  refresh: [];
  change: [params: { status: string; distance: number }];
}>();

const slots = useSlots();

type PullStatus = 'normal' | 'pulling' | 'loosing' | 'loading' | 'success';

const status = ref<PullStatus>('normal');
const distance = ref(0);
let startY = 0;

// Damping function matching Vant's ease behavior
function ease(dist: number): number {
  const pullDist = props.pullDistance || props.headHeight;

  if (dist > pullDist) {
    if (dist < pullDist * 2) {
      dist = pullDist + (dist - pullDist) / 2;
    } else {
      dist = pullDist * 1.5 + (dist - pullDist * 2) / 4;
    }
  }

  return Math.round(dist);
}

watch(() => props.modelValue, (val) => {
  if (!val && status.value === 'loading') {
    if (props.successText || slots.success) {
      status.value = 'success';
      setTimeout(() => {
        distance.value = 0;
        status.value = 'normal';
      }, props.successDuration);
    } else {
      distance.value = 0;
      status.value = 'normal';
    }
  }
});

function onTouchStart(e: any) {
  if (props.disabled || props.modelValue) return;
  if (status.value === 'loading' || status.value === 'success') return;
  startY = e?.touches?.[0]?.clientY || 0;
}

function onTouchMove(e: any) {
  if (props.disabled || props.modelValue) return;
  if (status.value === 'loading' || status.value === 'success') return;
  const currentY = e?.touches?.[0]?.clientY || 0;
  const deltaY = currentY - startY;
  if (deltaY <= 0) return;

  const dist = ease(deltaY);
  distance.value = dist;

  const pullDist = props.pullDistance || props.headHeight;
  if (dist >= pullDist) {
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
    :style="{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <view :style="{ transform: `translateY(${distance}px)`, display: 'flex', flexDirection: 'column' }">
      <!-- Head area -->
      <view
        :style="{
          height: headHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -headHeight,
        }"
      >
        <!-- Named slot for current status (pulling/loosing/loading/success/normal) -->
        <slot v-if="status === 'normal'" name="normal" :distance="distance" />
        <slot v-else-if="status === 'pulling'" name="pulling" :distance="distance">
          <text :style="{ fontSize: 14, color: '#969799' }">{{ pullingText }}</text>
        </slot>
        <slot v-else-if="status === 'loosing'" name="loosing" :distance="distance">
          <text :style="{ fontSize: 14, color: '#969799' }">{{ loosingText }}</text>
        </slot>
        <slot v-else-if="status === 'loading'" name="loading" :distance="distance">
          <Loading :size="16" color="#969799">{{ loadingText }}</Loading>
        </slot>
        <slot v-else-if="status === 'success'" name="success" :distance="distance">
          <text :style="{ fontSize: 14, color: '#969799' }">{{ successText }}</text>
        </slot>
      </view>
      <slot />
    </view>
  </view>
</template>
