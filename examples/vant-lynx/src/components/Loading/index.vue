<!--
  Lynx Limitations:
  - ::before pseudo-elements: spinner type uses inner <view> elements instead of ::before for the 12 bar lines
  - aria-live/aria-busy: Lynx has no ARIA attributes
-->
<script lang="ts">
import { computed, useSlots, type ExtractPropTypes, defineComponent } from 'vue-lynx';
import { createNamespace, addUnit, numericProp, makeStringProp } from '../../utils';
import './index.less';

export type LoadingType = 'circular' | 'spinner';

export const loadingProps = {
  size: numericProp,
  type: makeStringProp<LoadingType>('circular'),
  color: String,
  vertical: Boolean,
  textSize: numericProp,
  textColor: String,
};

export type LoadingProps = ExtractPropTypes<typeof loadingProps>;

export default defineComponent({
  name: 'van-loading',
  props: loadingProps,
  setup(props, { slots }) {
    const [, bem] = createNamespace('loading');

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

    return {
      bem,
      spinnerStyle,
      textStyle,
      hasText,
      spinLines,
      type: props.type,
      vertical: props.vertical,
    };
  },
});
</script>

<template>
  <view :class="bem([type, { vertical }])" aria-live="polite" aria-busy="true">
    <view :class="bem('spinner', { [type]: true })" :style="spinnerStyle">
      <slot name="icon">
        <template v-if="type === 'spinner'">
          <view
            v-for="n in spinLines"
            :key="n"
            :class="`${bem('line')} van-loading__line--${n}`"
          />
        </template>
        <svg v-else :class="bem('circular')" viewBox="25 25 50 50">
          <circle cx="50" cy="50" r="20" fill="none" />
        </svg>
      </slot>
    </view>
    <view v-if="hasText" :class="bem('text')" :style="textStyle">
      <slot />
    </view>
  </view>
</template>
