<!--
  Vant Feature Parity Report:
  - Props: 7/8 supported (loading, finished, error, offset, loadingText, finishedText, errorText, immediateCheck, direction; missing: disabled, scroller)
  - Events: 2/3 supported (load, update:loading; missing: update:error)
  - Slots: 1/4 supported (default; missing: loading, finished, error)
  - Gaps: no disabled prop, no scroller prop, no update:error event, no loading/finished/error slots, no check() expose
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue-lynx';

export interface ListProps {
  loading?: boolean;
  finished?: boolean;
  error?: boolean;
  offset?: number;
  loadingText?: string;
  finishedText?: string;
  errorText?: string;
  immediateCheck?: boolean;
  direction?: 'up' | 'down';
}

const props = withDefaults(defineProps<ListProps>(), {
  loading: false,
  finished: false,
  error: false,
  offset: 300,
  loadingText: 'Loading...',
  finishedText: '',
  errorText: 'Request failed. Click to reload',
  immediateCheck: true,
  direction: 'down',
});

const emit = defineEmits<{
  load: [];
  'update:loading': [value: boolean];
}>();

const listRef = ref<any>(null);

function check() {
  if (props.loading || props.finished || props.error) return;
  triggerLoad();
}

function triggerLoad() {
  if (props.loading || props.finished) return;
  emit('update:loading', true);
  emit('load');
}

function onErrorTap() {
  if (props.error) {
    triggerLoad();
  }
}

function onScroll(event: any) {
  if (props.loading || props.finished || props.error) return;

  const detail = event?.detail || {};
  const scrollTop = detail.scrollTop || 0;
  const scrollHeight = detail.scrollHeight || 0;
  const offsetHeight = detail.offsetHeight || 0;

  if (props.direction === 'down') {
    if (scrollHeight - scrollTop - offsetHeight <= props.offset) {
      triggerLoad();
    }
  } else {
    if (scrollTop <= props.offset) {
      triggerLoad();
    }
  }
}

onMounted(() => {
  if (props.immediateCheck) {
    check();
  }
});

watch(
  () => props.finished,
  () => {
    if (!props.finished) {
      check();
    }
  },
);

watch(
  () => props.loading,
  (val) => {
    if (!val && !props.finished) {
      // After loading completes, do another check
      check();
    }
  },
);

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  flex: 1,
}));

const tipStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 16,
}));

const tipTextStyle = {
  fontSize: 14,
  color: '#969799',
};
</script>

<template>
  <view :style="containerStyle" @scroll="onScroll">
    <!-- Content at top if direction is up -->
    <view
      v-if="direction === 'up'"
      :style="tipStyle"
    >
      <text v-if="loading" :style="tipTextStyle">{{ loadingText }}</text>
      <text v-else-if="finished && finishedText" :style="tipTextStyle">{{ finishedText }}</text>
      <text v-else-if="error" :style="{ ...tipTextStyle, color: '#ee0a24' }" @tap="onErrorTap">{{ errorText }}</text>
    </view>

    <slot />

    <!-- Content at bottom if direction is down -->
    <view
      v-if="direction === 'down'"
      :style="tipStyle"
    >
      <text v-if="loading" :style="tipTextStyle">{{ loadingText }}</text>
      <text v-else-if="finished && finishedText" :style="tipTextStyle">{{ finishedText }}</text>
      <text v-else-if="error" :style="{ ...tipTextStyle, color: '#ee0a24' }" @tap="onErrorTap">{{ errorText }}</text>
    </view>
  </view>
</template>
