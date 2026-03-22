<!--
  RollingTextItem — sub-component matching Vant's RollingTextItem.tsx
  Renders a single column of rolling digits/text with CSS @keyframes animation.
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import type { RollingTextDirection } from './types';

const props = withDefaults(
  defineProps<{
    figureArr: Array<string | number>;
    delay?: number;
    duration?: number;
    isStart?: boolean;
    direction?: RollingTextDirection;
    height?: number;
  }>(),
  {
    delay: 0,
    duration: 2,
    isStart: false,
    direction: 'down',
    height: 40,
  },
);

const [, bem] = createNamespace('rolling-text-item');

const newFigureArr = computed(() =>
  props.direction === 'down'
    ? props.figureArr.slice().reverse()
    : props.figureArr,
);

const translatePx = computed(() => {
  const totalHeight = props.height * (props.figureArr.length - 1);
  return `-${totalHeight}px`;
});

const itemStyle = computed(() => ({
  lineHeight: addUnit(props.height),
  height: addUnit(props.height),
}));

const rootStyle = computed(() => ({
  height: addUnit(props.height),
  '--van-translate': translatePx.value,
  '--van-duration': props.duration + 's',
  '--van-delay': props.delay + 's',
}));

const rootClass = computed(() => bem([props.direction]));
const boxClass = computed(() => bem('box', { animate: props.isStart }));
</script>

<template>
  <view :class="rootClass" :style="rootStyle">
    <view :class="boxClass">
      <view
        v-for="(figure, idx) in newFigureArr"
        :key="idx"
        :class="bem('item')"
        :style="itemStyle"
      >
        <text>{{ figure }}</text>
      </view>
    </view>
  </view>
</template>
