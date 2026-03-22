<!--
  Lynx Limitations:
  - ::before pseudo-elements: spinner type uses inner <view> elements instead of ::before for the 12 bar lines
  - SVG circle: circular type uses CSS border-based spinner instead of SVG stroke-dasharray animation
  - aria-live/aria-busy: Lynx has no ARIA attributes
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import './index.less';

export type LoadingType = 'circular' | 'spinner';

export interface LoadingProps {
  type?: LoadingType;
  color?: string;
  size?: string | number;
  textSize?: string | number;
  textColor?: string;
  vertical?: boolean;
}

const [, bem] = createNamespace('loading');

const props = withDefaults(defineProps<LoadingProps>(), {
  type: 'circular',
});

const slots = useSlots();

const spinnerStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.color) {
    style.color = props.color;
  }
  if (props.size !== undefined) {
    const s = addUnit(props.size);
    if (s) {
      style.width = s;
      style.height = s;
    }
  }
  return Object.keys(style).length > 0 ? style : undefined;
});

const textStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.textSize !== undefined) {
    const s = addUnit(props.textSize);
    if (s) {
      style.fontSize = s;
    }
  }
  const color = props.textColor ?? props.color;
  if (color) {
    style.color = color;
  }
  return Object.keys(style).length > 0 ? style : undefined;
});

const hasText = computed(() => !!slots.default);

const spinLines = Array.from({ length: 12 }, (_, i) => i + 1);
</script>

<template>
  <view :class="bem([type, { vertical }])">
    <view :class="bem('spinner', { [type]: true })" :style="spinnerStyle">
      <slot name="icon">
        <template v-if="type === 'spinner'">
          <view
            v-for="n in spinLines"
            :key="n"
            :class="`${bem('line')} van-loading__line--${n}`"
          >
            <view :class="bem('line-bar')" />
          </view>
        </template>
        <view v-else :class="bem('circular')" />
      </slot>
    </view>
    <view v-if="hasText" :class="bem('text')" :style="textStyle">
      <text :style="textStyle"><slot /></text>
    </view>
  </view>
</template>
