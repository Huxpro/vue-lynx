<!--
  Lynx Limitations:
  - scroller: Lynx has no arbitrary scroll parent detection (useScrollParent); scroll
    detection uses @scroll on the container view with event.detail measurements instead.
  - Tab status: No useAllTabStatus composable — List always checks regardless of tab state.
  - Passive scroll: No passive event listener option in Lynx.
  - role/aria: No ARIA attributes (role="feed", aria-busy) in Lynx.
-->
<script setup lang="ts">
import { ref, watch, onMounted, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils';
import Loading from '../Loading/index.vue';
import './index.less';
import type { ListDirection, ListExpose } from './types';

interface ListProps {
  loading?: boolean;
  finished?: boolean;
  error?: boolean;
  offset?: number | string;
  disabled?: boolean;
  scroller?: object;
  loadingText?: string | null;
  finishedText?: string;
  errorText?: string;
  immediateCheck?: boolean;
  direction?: ListDirection;
}

const props = withDefaults(defineProps<ListProps>(), {
  loading: false,
  finished: false,
  error: false,
  offset: 300,
  disabled: false,
  loadingText: '',
  immediateCheck: true,
  direction: 'down',
});

const emit = defineEmits<{
  load: [];
  'update:loading': [value: boolean];
  'update:error': [value: boolean];
}>();

const [, bem] = createNamespace('list');
const slots = useSlots();

// Use sync innerLoading state to avoid repeated loading in some edge cases (matching Vant)
const innerLoading = ref(props.loading);

function check() {
  if (
    innerLoading.value ||
    props.finished ||
    props.disabled ||
    props.error
  ) {
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
  emit('update:error', false);
  check();
}

function onScroll(event: any) {
  if (innerLoading.value || props.finished || props.disabled || props.error) {
    return;
  }

  const detail = event?.detail || {};
  const scrollTop = detail.scrollTop || 0;
  const scrollHeight = detail.scrollHeight || 0;
  const offsetHeight = detail.offsetHeight || 0;
  const offset = +props.offset;

  if (props.direction === 'down') {
    if (scrollHeight - scrollTop - offsetHeight <= offset) {
      triggerLoad();
    }
  } else {
    if (scrollTop <= offset) {
      triggerLoad();
    }
  }
}

watch(
  () => [props.loading, props.finished, props.error],
  () => {
    innerLoading.value = props.loading;
    if (!props.loading && !props.finished && !props.disabled) {
      check();
    }
  },
);

onMounted(() => {
  if (props.immediateCheck) {
    check();
  }
});

defineExpose<ListExpose>({ check });

const showLoading = () =>
  innerLoading.value && !props.finished && !props.disabled;
</script>

<template>
  <view :class="bem()" @scroll="onScroll">
    <!-- direction=up: placeholder first, then content last -->
    <view v-if="direction === 'up'" :class="bem('placeholder')" />

    <view v-if="direction === 'up' && showLoading()" :class="bem('loading')">
      <slot name="loading">
        <Loading v-if="loadingText != null" :class="bem('loading-icon')">{{ loadingText || '加载中...' }}</Loading>
      </slot>
    </view>
    <view v-if="direction === 'up' && finished && (slots.finished || finishedText)" :class="bem('finished-text')">
      <slot name="finished">
        <text>{{ finishedText }}</text>
      </slot>
    </view>
    <view v-if="direction === 'up' && error && (slots.error || errorText)" :class="bem('error-text')" @tap="onErrorTap">
      <slot name="error">
        <text>{{ errorText }}</text>
      </slot>
    </view>

    <slot />

    <!-- direction=down: content first, then placeholder last -->
    <view v-if="direction === 'down' && showLoading()" :class="bem('loading')">
      <slot name="loading">
        <Loading v-if="loadingText != null" :class="bem('loading-icon')">{{ loadingText || '加载中...' }}</Loading>
      </slot>
    </view>
    <view v-if="direction === 'down' && finished && (slots.finished || finishedText)" :class="bem('finished-text')">
      <slot name="finished">
        <text>{{ finishedText }}</text>
      </slot>
    </view>
    <view v-if="direction === 'down' && error && (slots.error || errorText)" :class="bem('error-text')" @tap="onErrorTap">
      <slot name="error">
        <text>{{ errorText }}</text>
      </slot>
    </view>

    <view v-if="direction === 'down'" :class="bem('placeholder')" />
  </view>
</template>
