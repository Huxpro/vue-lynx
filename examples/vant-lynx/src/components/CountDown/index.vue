<!--
  Lynx Limitations:
  - role="timer": Lynx has no ARIA role support
  - KeepAlive activated/deactivated: Lynx may not support KeepAlive lifecycle
  - <div> element: replaced with <view>
  - Bare text rendering: Lynx requires <text> element for text content
-->
<script setup lang="ts">
import { watch, computed } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { useCountDown } from '../../composables/useCountDown';
import { parseFormat } from './utils';
import type { CountDownCurrentTime } from './types';
import './index.less';

const [name, bem] = createNamespace('count-down');

export interface CountDownProps {
  time?: number | string;
  format?: string;
  autoStart?: boolean;
  millisecond?: boolean;
}

const props = withDefaults(defineProps<CountDownProps>(), {
  time: 0,
  format: 'HH:mm:ss',
  autoStart: true,
  millisecond: false,
});

const emit = defineEmits<{
  change: [current: CountDownCurrentTime];
  finish: [];
}>();

const { start, pause, reset, current } = useCountDown({
  time: +props.time,
  millisecond: props.millisecond,
  onChange: (current) => emit('change', current),
  onFinish: () => emit('finish'),
});

const timeText = computed(() => parseFormat(props.format, current.value));

const resetTime = () => {
  reset(+props.time);

  if (props.autoStart) {
    start();
  }
};

watch(() => props.time, resetTime, { immediate: true });

defineExpose({ start, pause, reset: resetTime });
</script>

<template>
  <view :class="bem()">
    <slot :current="current">
      <text :class="bem()">{{ timeText }}</text>
    </slot>
  </view>
</template>
