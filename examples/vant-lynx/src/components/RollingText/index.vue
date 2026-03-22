<!--
  Lynx Limitations:
  - inline-flex: Lynx uses display: flex with flexDirection: row instead
  - div/span elements: Uses view/text Lynx elements
  - raf: Uses setTimeout(fn, 0) instead of requestAnimationFrame for reset
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import { createNamespace } from '../../utils';
import RollingTextItem from './RollingTextItem.vue';
import type { RollingTextDirection, RollingTextStopOrder, RollingTextExpose } from './types';
import './index.less';

const props = withDefaults(
  defineProps<{
    startNum?: number;
    targetNum?: number;
    textList?: string[];
    duration?: number;
    autoStart?: boolean;
    direction?: RollingTextDirection;
    stopOrder?: RollingTextStopOrder;
    height?: number;
  }>(),
  {
    startNum: 0,
    targetNum: undefined,
    textList: () => [],
    duration: 2,
    autoStart: true,
    direction: 'down',
    stopOrder: 'ltr',
    height: 40,
  },
);

const [, bem] = createNamespace('rolling-text');

const CIRCLE_NUM = 2;

function padZero(num: number, targetLength: number): string {
  return String(num).padStart(targetLength, '0');
}

const isCustomType = computed(
  () => Array.isArray(props.textList) && props.textList.length > 0,
);

const itemLength = computed(() => {
  if (isCustomType.value) return props.textList[0].length;
  return String(Math.max(props.startNum, props.targetNum ?? 0)).length;
});

const getTextArrByIdx = (idx: number) => {
  const result: string[] = [];
  for (let i = 0; i < props.textList.length; i++) {
    result.push(props.textList[i][idx]);
  }
  return result;
};

const targetNumArr = computed(() => {
  if (isCustomType.value) return new Array(itemLength.value).fill('');
  return padZero(props.targetNum ?? 0, itemLength.value).split('');
});

const startNumArr = computed(() =>
  padZero(props.startNum, itemLength.value).split(''),
);

const getFigureArr = (i: number) => {
  const start = +startNumArr.value[i];
  const target = +targetNumArr.value[i];
  const result: number[] = [];
  for (let j = start; j <= 9; j++) {
    result.push(j);
  }
  for (let c = 0; c <= CIRCLE_NUM; c++) {
    for (let j = 0; j <= 9; j++) {
      result.push(j);
    }
  }
  for (let j = 0; j <= target; j++) {
    result.push(j);
  }
  return result;
};

const getDelay = (i: number, len: number) => {
  if (props.stopOrder === 'ltr') return 0.2 * i;
  return 0.2 * (len - 1 - i);
};

const rolling = ref(props.autoStart);

const start = () => {
  rolling.value = true;
};

const reset = () => {
  rolling.value = false;

  if (props.autoStart) {
    setTimeout(() => start(), 0);
  }
};

watch(
  () => props.autoStart,
  (value) => {
    if (value) {
      start();
    }
  },
);

defineExpose<RollingTextExpose>({
  start,
  reset,
});
</script>

<template>
  <view :class="bem()">
    <RollingTextItem
      v-for="(_, i) in targetNumArr"
      :key="i"
      :figure-arr="isCustomType ? getTextArrByIdx(i) : getFigureArr(i)"
      :duration="props.duration"
      :direction="props.direction"
      :is-start="rolling"
      :height="props.height"
      :delay="getDelay(i, itemLength)"
    />
  </view>
</template>
