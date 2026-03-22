<!--
  Lynx Limitations:
  - tag prop: accepted for API compat but always renders as view (Lynx has no HTML tags)
  - CSS class-based styling: Lynx uses inline styles, not CSS class selectors
  - transform: translate(): not reliably supported in Lynx, using offset positioning instead
  - font-family: --van-badge-font not applied (Lynx has limited font-family support)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';

export type BadgePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface BadgeProps {
  dot?: boolean;
  max?: number | string;
  tag?: string;
  color?: string;
  offset?: [number | string, number | string];
  content?: string | number;
  showZero?: boolean;
  position?: BadgePosition;
}

const props = withDefaults(defineProps<BadgeProps>(), {
  dot: false,
  tag: 'div',
  showZero: true,
  position: 'top-right',
});

const slots = useSlots();

const addUnit = (value?: string | number): string | undefined => {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

const isNumeric = (val: string | number): boolean => {
  return typeof val === 'number' || /^\d+(\.\d+)?$/.test(val);
};

const isDef = <T>(val: T): val is NonNullable<T> => {
  return val !== undefined && val !== null;
};

const hasContent = computed(() => {
  if (slots.content) {
    return true;
  }
  const { content, showZero } = props;
  return (
    isDef(content) &&
    content !== '' &&
    (showZero || (content !== 0 && content !== '0'))
  );
});

const showContent = computed(() => {
  return !props.dot && hasContent.value && !slots.content;
});

const displayContent = computed(() => {
  const { max, content } = props;

  if (!showContent.value) return '';

  if (isDef(max) && isNumeric(content!) && +content! > +max) {
    return `${max}+`;
  }

  return String(content);
});

const shouldShowBadge = computed(() => {
  return hasContent.value || props.dot;
});

const isFixed = computed(() => {
  return !!slots.default;
});

const getOffsetWithMinusString = (val: string) =>
  val.startsWith('-') ? val.replace('-', '') : `-${val}`;

const badgeStyle = computed(() => {
  const style: Record<string, any> = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: props.dot ? '0px' : '16px',
    height: props.dot ? '8px' : '16px',
    paddingLeft: props.dot ? '0px' : '3px',
    paddingRight: props.dot ? '0px' : '3px',
    fontSize: '10px',
    fontWeight: 'bold',
    lineHeight: '14px',
    textAlign: 'center',
    backgroundColor: props.color || '#ee0a24',
    borderRadius: props.dot ? '4px' : '9999px',
  };

  if (props.dot) {
    style.width = '8px';
  }

  if (!props.dot) {
    style.borderWidth = '1px';
    style.borderStyle = 'solid';
    style.borderColor = '#fff';
  }

  if (isFixed.value) {
    style.position = 'absolute';

    const { position } = props;
    const [offsetY, offsetX] = position.split('-') as [
      'top' | 'bottom',
      'left' | 'right',
    ];

    if (props.offset) {
      const [x, y] = props.offset;

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
      style[offsetY] = '0px';
      style[offsetX] = '0px';
    }
  } else if (props.offset) {
    const [x, y] = props.offset;
    style.marginTop = addUnit(y);
    style.marginLeft = addUnit(x);
  }

  return style;
});

const wrapperStyle = computed(() => ({
  position: 'relative' as const,
  display: 'inline-flex' as const,
}));

const textStyle = computed(() => ({
  fontSize: '10px',
  color: '#fff',
  lineHeight: '14px',
  fontWeight: 'bold' as const,
}));
</script>

<template>
  <!-- Positioned mode: wraps default slot content -->
  <view v-if="isFixed" :style="wrapperStyle">
    <slot />
    <view v-if="shouldShowBadge" :style="badgeStyle">
      <slot name="content">
        <text v-if="showContent" :style="textStyle">{{ displayContent }}</text>
      </slot>
    </view>
  </view>

  <!-- Standalone mode: badge rendered inline without wrapper -->
  <view v-else-if="shouldShowBadge" :style="badgeStyle">
    <slot name="content">
      <text v-if="showContent" :style="textStyle">{{ displayContent }}</text>
    </slot>
  </view>
</template>
