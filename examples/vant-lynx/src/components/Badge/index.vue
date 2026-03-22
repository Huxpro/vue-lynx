<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as <view> (Lynx has no HTML tags)
  - display: inline-block: Lynx has no inline-block, badge uses display: flex instead
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace, addUnit, isDef, isNumeric } from '../../utils';
import type { BadgePosition, BadgeProps } from './types';
import './index.less';

const [, bem] = createNamespace('badge');

const props = withDefaults(defineProps<BadgeProps>(), {
  dot: false,
  tag: 'div',
  showZero: true,
  position: 'top-right',
});

const slots = useSlots();

const hasContent = () => {
  if (slots.content) {
    return true;
  }
  const { content, showZero } = props;
  return (
    isDef(content) &&
    content !== '' &&
    (showZero || (content !== 0 && content !== '0'))
  );
};

const renderContent = computed(() => {
  const { dot, max, content } = props;

  if (!dot && hasContent()) {
    if (slots.content) return undefined;

    if (isDef(max) && isNumeric(content!) && +content! > +max) {
      return `${max}+`;
    }

    return String(content);
  }
  return undefined;
});

const shouldShowBadge = computed(() => {
  return hasContent() || props.dot;
});

const isFixed = computed(() => {
  return !!slots.default;
});

const getOffsetWithMinusString = (val: string) =>
  val.startsWith('-') ? val.replace('-', '') : `-${val}`;

const badgeStyle = computed(() => {
  const style: Record<string, string | undefined> = {};

  if (props.color) {
    style.background = props.color;
  }

  if (props.offset) {
    const [x, y] = props.offset;
    const { position } = props;
    const [offsetY, offsetX] = position.split('-') as [
      'top' | 'bottom',
      'left' | 'right',
    ];

    if (slots.default) {
      if (typeof y === 'number') {
        style[offsetY] = addUnit(offsetY === 'top' ? y : -y);
      } else {
        style[offsetY] =
          offsetY === 'top' ? addUnit(y) : getOffsetWithMinusString(y);
      }

      if (typeof x === 'number') {
        style[offsetX] = addUnit(offsetX === 'left' ? x : -x);
      } else {
        style[offsetX] =
          offsetX === 'left' ? addUnit(x) : getOffsetWithMinusString(x);
      }
    } else {
      style.marginTop = addUnit(y);
      style.marginLeft = addUnit(x);
    }
  }

  return style;
});

const badgeClass = computed(() =>
  bem([
    props.position,
    { dot: props.dot, fixed: isFixed.value },
  ]),
);
</script>

<template>
  <!-- Positioned mode: wraps default slot content -->
  <view v-if="isFixed" :class="bem('wrapper')">
    <slot />
    <view
      v-if="shouldShowBadge"
      :class="badgeClass"
      :style="badgeStyle"
    >
      <slot name="content">
        <text v-if="renderContent">{{ renderContent }}</text>
      </slot>
    </view>
  </view>

  <!-- Standalone mode: badge rendered inline without wrapper -->
  <view
    v-else-if="shouldShowBadge"
    :class="badgeClass"
    :style="badgeStyle"
  >
    <slot name="content">
      <text v-if="renderContent">{{ renderContent }}</text>
    </slot>
  </view>
</template>
