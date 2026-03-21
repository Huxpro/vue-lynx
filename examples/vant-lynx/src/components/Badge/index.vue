<!--
  Vant Feature Parity Report:
  - Props: 7/8 supported (content, color, dot, max, showZero, offset, position)
    - Missing: tag (always 'view' in Lynx, HTML tag prop not applicable)
  - Slots: 2/2 supported (default, content)
  - Standalone mode: Supported (badge renders inline when no default slot)
  - Positioned mode: Supported (badge overlays on slotted content)
  - Max number cap: Supported (e.g., max=99 shows "99+")
  - Show zero: Supported (defaults to true, matching Vant)
  - Offset: Supported (fine-tune [x, y] positioning for all 4 positions)
  - Position: 4 positions supported (top-left, top-right, bottom-left, bottom-right)
  - CSS Variables: Not applicable (Lynx uses inline styles)
  - Gaps:
    - No tag prop (Lynx always uses view elements)
    - No CSS variable theming (Lynx limitation)
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';

export interface BadgeProps {
  content?: string | number;
  color?: string;
  dot?: boolean;
  max?: number | string;
  showZero?: boolean;
  offset?: [number | string, number | string];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const props = withDefaults(defineProps<BadgeProps>(), {
  color: '#ee0a24',
  dot: false,
  showZero: true,
  position: 'top-right',
});

const slots = useSlots();

const hasContent = computed(() => {
  if (slots.content) {
    return true;
  }
  const { content, showZero } = props;
  if (content === undefined || content === '') return false;
  if (!showZero && (content === 0 || content === '0')) return false;
  return true;
});

const displayContent = computed(() => {
  const { dot, max, content } = props;

  if (dot) return '';

  if (!hasContent.value) return '';

  // content slot is handled in template
  if (slots.content) return '';

  if (
    max !== undefined &&
    content !== undefined &&
    content !== '' &&
    !isNaN(Number(content)) &&
    Number(content) > Number(max)
  ) {
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

const badgeStyle = computed(() => {
  const style: Record<string, any> = {
    backgroundColor: props.color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: props.dot ? 4 : 8,
    minWidth: props.dot ? 8 : 16,
    height: props.dot ? 8 : 16,
    paddingLeft: props.dot ? 0 : 3,
    paddingRight: props.dot ? 0 : 3,
  };

  if (!props.dot) {
    // White border around content badge
    style.borderWidth = 1;
    style.borderStyle = 'solid';
    style.borderColor = '#fff';
  }

  if (isFixed.value) {
    // Positioned mode: absolute overlay on the wrapper
    style.position = 'absolute';

    const [offsetY, offsetX] = props.position.split('-') as [
      'top' | 'bottom',
      'left' | 'right',
    ];

    const offset = props.offset;
    const offsetXVal = offset ? offset[0] : 0;
    const offsetYVal = offset ? offset[1] : 0;

    // Parse offset values (support both number and string like "5px")
    const parseOffset = (val: number | string): number => {
      if (typeof val === 'number') return val;
      return parseFloat(val) || 0;
    };

    const xNum = parseOffset(offsetXVal);
    const yNum = parseOffset(offsetYVal);

    // Vant positions the badge at the corner and uses transform to center it.
    // In Lynx, transform translate isn't well supported, so we use negative
    // offsets to simulate the overlap effect.
    if (offsetY === 'top') {
      style.top = -8 + yNum;
    } else {
      style.bottom = -8 - yNum;
    }

    if (offsetX === 'right') {
      style.right = -8 - xNum;
    } else {
      style.left = -8 + xNum;
    }
  }

  return style;
});

const wrapperStyle = computed(() => ({
  position: 'relative' as const,
  display: 'inline-flex' as const,
}));

const textStyle = computed(() => ({
  fontSize: 10,
  color: '#fff',
  lineHeight: 14,
  fontWeight: 'bold' as const,
}));
</script>

<template>
  <!-- Positioned mode: wraps default slot content -->
  <view v-if="isFixed" :style="wrapperStyle">
    <slot />
    <view v-if="shouldShowBadge" :style="badgeStyle">
      <slot name="content">
        <text v-if="!dot && hasContent && displayContent" :style="textStyle">{{ displayContent }}</text>
      </slot>
    </view>
  </view>

  <!-- Standalone mode: badge rendered inline without wrapper -->
  <view v-else-if="shouldShowBadge" :style="badgeStyle">
    <slot name="content">
      <text v-if="!dot && hasContent && displayContent" :style="textStyle">{{ displayContent }}</text>
    </slot>
  </view>
</template>
