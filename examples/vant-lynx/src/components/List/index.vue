<!--
  Vant List - Feature Parity Report
  ===================================
  Vant Source: packages/vant/src/list/List.tsx

  Props (10/10 supported):
    - loading: boolean                 [YES]
    - finished: boolean                [YES]
    - error: boolean                   [YES]
    - offset: number (default 300)     [YES]
    - disabled: boolean                [YES] added
    - loadingText: string              [YES]
    - finishedText: string             [YES]
    - errorText: string                [YES]
    - immediateCheck: boolean          [YES]
    - direction: 'up' | 'down'        [YES]
    - scroller: Element               [NO] Lynx has no arbitrary scroll parent detection

  Events (3/3 supported):
    - load                             [YES]
    - update:loading                   [YES]
    - update:error                     [YES] added

  Slots (4/4 supported):
    - default                          [YES]
    - loading                          [YES] added
    - finished                         [YES] added
    - error                            [YES] added

  Expose (1/1 supported):
    - check()                          [YES] added

  Lynx Adaptations:
    - Vant uses useScrollParent + useRect for scroll detection; Lynx uses
      @scroll event on the container view with event.detail measurements.
    - Vant uses <Loading> component in loading slot; we import and use the
      local Loading component.
    - Uses `display: 'flex'` explicitly on all flex containers.
    - Vant uses useEventListener for passive scroll; Lynx uses @scroll directly.

  Gaps:
    - No scroller prop (Lynx cannot query arbitrary scroll parents)
    - No tab status detection (useAllTabStatus not available)
    - No passive scroll event option (Lynx limitation)
    - No role/aria attributes (Lynx does not support ARIA)
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, useSlots } from 'vue-lynx';
import Loading from '../Loading/index.vue';

export interface ListProps {
  loading?: boolean;
  finished?: boolean;
  error?: boolean;
  offset?: number;
  disabled?: boolean;
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
  disabled: false,
  loadingText: 'Loading...',
  finishedText: '',
  errorText: 'Request failed. Click to reload',
  immediateCheck: true,
  direction: 'down',
});

const emit = defineEmits<{
  load: [];
  'update:loading': [value: boolean];
  'update:error': [value: boolean];
}>();

const slots = useSlots();

// Use sync innerLoading to avoid repeated loading (matching Vant)
const innerLoading = ref(props.loading);

function check() {
  if (innerLoading.value || props.finished || props.disabled || props.error) {
    return;
  }
  triggerLoad();
}

function triggerLoad() {
  if (innerLoading.value || props.finished || props.disabled) return;
  innerLoading.value = true;
  emit('update:loading', true);
  emit('load');
}

function onErrorTap() {
  if (props.error) {
    emit('update:error', false);
    check();
  }
}

function onScroll(event: any) {
  if (innerLoading.value || props.finished || props.disabled || props.error) {
    return;
  }

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
  () => [props.loading, props.finished, props.error],
  () => {
    innerLoading.value = props.loading;
    if (!props.loading && !props.finished && !props.disabled) {
      check();
    }
  },
);

defineExpose({ check });

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

const hasLoadingSlot = computed(() => !!slots.loading);
const hasFinishedSlot = computed(() => !!slots.finished);
const hasErrorSlot = computed(() => !!slots.error);

const showLoading = computed(
  () => innerLoading.value && !props.finished && !props.disabled,
);
</script>

<template>
  <view :style="containerStyle" @scroll="onScroll">
    <!-- Placeholder / tip at top if direction is up -->
    <view v-if="direction === 'up'" :style="tipStyle">
      <template v-if="showLoading">
        <slot name="loading">
          <Loading size="16" :textSize="14">{{ loadingText }}</Loading>
        </slot>
      </template>
      <template v-else-if="finished">
        <slot name="finished">
          <text v-if="finishedText" :style="tipTextStyle">{{ finishedText }}</text>
        </slot>
      </template>
      <template v-else-if="error">
        <slot name="error">
          <text
            :style="{ ...tipTextStyle, color: '#ee0a24' }"
            @tap="onErrorTap"
          >{{ errorText }}</text>
        </slot>
      </template>
    </view>

    <slot />

    <!-- Placeholder / tip at bottom if direction is down -->
    <view v-if="direction === 'down'" :style="tipStyle">
      <template v-if="showLoading">
        <slot name="loading">
          <Loading size="16" :textSize="14">{{ loadingText }}</Loading>
        </slot>
      </template>
      <template v-else-if="finished">
        <slot name="finished">
          <text v-if="finishedText" :style="tipTextStyle">{{ finishedText }}</text>
        </slot>
      </template>
      <template v-else-if="error">
        <slot name="error">
          <text
            :style="{ ...tipTextStyle, color: '#ee0a24' }"
            @tap="onErrorTap"
          >{{ errorText }}</text>
        </slot>
      </template>
    </view>
  </view>
</template>
