<!--
  Vant Feature Parity Report:
  - Props: 8/11 supported (text, icon, iconPrefix, iconColor, dot, badge, badgeProps, clickable override via parent)
    - Missing: to, url, replace (Vue Router / browser navigation not applicable in Lynx)
  - Events: 1/1 supported (click — always emitted, not gated by clickable)
  - Slots: 3/3 supported (default, icon, text)
  - Badge integration: Uses shared Icon component with dot/badge/badgeProps (matches Vant)
  - Icon integration: Uses shared Icon component with iconColor, iconPrefix support (matches Vant)
  - Direction: Supports 'horizontal' (row) and 'vertical' (column) layout from parent Grid
  - Reverse: Supports reversed content order (column-reverse / row-reverse) from parent Grid
  - Square mode: Uses paddingTop percentage for 1:1 aspect ratio with absolute content (matches Vant)
  - Gutter mode: Uses paddingRight + index-based marginTop for rows after first (matches Vant)
  - Border mode: Hairline right+bottom when border=true & no gutter; full surround when both
  - Clickable: Active state feedback via overlay on touch (matches Vant active-color behavior)
  - Gaps:
    - No to/url/replace (Lynx has no browser navigation / Vue Router)
    - No CSS variable theming (Lynx uses inline styles)
    - No cursor:pointer for clickable (Lynx is touch-only)
-->
<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import type { BadgeProps } from '../Badge/index.vue';

export type GridDirection = 'horizontal' | 'vertical';

export interface GridItemProps {
  /** Display text below (or beside) the icon */
  text?: string;
  /** Icon name (Vant icon name, unicode char, or image URL containing '/') */
  icon?: string;
  /** Icon class prefix (passed to Icon component) */
  iconPrefix?: string;
  /** Icon color */
  iconColor?: string;
  /** Whether to show a red dot on the icon */
  dot?: boolean;
  /** Badge content (number or string) on the icon */
  badge?: string | number;
  /** Extra props for the Badge component on the icon */
  badgeProps?: Partial<BadgeProps>;
}

const props = withDefaults(defineProps<GridItemProps>(), {
  dot: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const grid = inject<{
  columnNum: Ref<number>;
  iconSize: Ref<number | string>;
  gutter: Ref<number | string>;
  border: Ref<boolean>;
  center: Ref<boolean>;
  square: Ref<boolean>;
  clickable: Ref<boolean>;
  direction: Ref<GridDirection>;
  reverse: Ref<boolean>;
  registerChild: () => number;
}>('grid')!;

// Register this item and get its index (used for gutter marginTop logic)
const index = grid.registerChild();

/** Parse a numeric or string value to a number (px) */
function parseNumeric(val: number | string): number {
  if (typeof val === 'number') return val;
  return parseFloat(val) || 0;
}

/** Percentage width for each column */
const percent = computed(() => `${100 / grid.columnNum.value}%`);

/**
 * Root item style — the outer wrapper.
 * Matches Vant's .van-grid-item: flexBasis sets column width.
 * - Square mode: height=0, paddingTop=percent for 1:1 aspect ratio
 * - Gutter mode: paddingRight=gutter, marginTop=gutter for rows after first
 */
const rootStyle = computed(() => {
  const gutterNum = parseNumeric(grid.gutter.value);
  const colNum = grid.columnNum.value;

  const style: Record<string, any> = {
    position: 'relative',
    flexBasis: percent.value,
    boxSizing: 'border-box',
  };

  if (grid.square.value) {
    // Square: zero height, paddingTop creates the 1:1 aspect ratio
    style.height = 0;
    style.paddingTop = percent.value;
  } else if (gutterNum) {
    // Gutter: horizontal spacing via paddingRight on each item
    style.paddingRight = gutterNum;

    // Vertical spacing: only items past the first row get marginTop
    // Matches Vant: index >= columnNum
    if (index >= colNum) {
      style.marginTop = gutterNum;
    }
  }

  return style;
});

/**
 * Content wrapper style — the inner content area.
 * Matches Vant's .van-grid-item__content.
 * Contains the icon + text with proper flex direction.
 */
const contentStyle = computed(() => {
  const gutterNum = parseNumeric(grid.gutter.value);
  const hasBorder = grid.border.value && !gutterNum;
  const hasSurround = grid.border.value && !!gutterNum;
  const isHorizontal = grid.direction.value === 'horizontal';
  const isReverse = grid.reverse.value;

  // Determine flexDirection based on direction + reverse
  let flexDir: string;
  if (isHorizontal && isReverse) {
    flexDir = 'row-reverse';
  } else if (isHorizontal) {
    flexDir = 'row';
  } else if (isReverse) {
    flexDir = 'column-reverse';
  } else {
    flexDir = 'column';
  }

  const style: Record<string, any> = {
    display: 'flex',
    flexDirection: flexDir,
    alignItems: grid.center.value ? 'center' : 'flex-start',
    justifyContent: grid.center.value ? 'center' : 'flex-start',
    height: '100%',
    // Vant uses padding: 16px 8px (--van-padding-md --van-padding-xs)
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 8,
    paddingRight: 8,
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  };

  // Square mode: absolute positioning to fill the paddingTop-based parent
  if (grid.square.value) {
    style.position = 'absolute';
    style.top = 0;
    style.right = 0;
    style.bottom = 0;
    style.left = 0;

    if (gutterNum) {
      // When both square and gutter, inset right/bottom by gutter amount
      style.right = gutterNum;
      style.bottom = gutterNum;
      style.height = 'auto';
    }
  }

  // Border styles
  if (hasBorder) {
    // Hairline right + bottom border (Grid wrapper provides top + left)
    style.borderRightWidth = 0.5;
    style.borderRightStyle = 'solid';
    style.borderRightColor = '#ebedf0';
    style.borderBottomWidth = 0.5;
    style.borderBottomStyle = 'solid';
    style.borderBottomColor = '#ebedf0';
  } else if (hasSurround) {
    // Full surround border when both border and gutter are set
    style.borderWidth = 0.5;
    style.borderStyle = 'solid';
    style.borderColor = '#ebedf0';
  }

  return style;
});

/**
 * Spacing style applied to the text element.
 * Creates the gap between icon and text, respecting direction and reverse.
 */
const textSpacingStyle = computed(() => {
  const isHorizontal = grid.direction.value === 'horizontal';
  const isReverse = grid.reverse.value;

  if (isHorizontal && isReverse) {
    // row-reverse: text appears before icon visually, so margin-right pushes away from icon
    return { marginRight: 8 };
  } else if (isHorizontal) {
    // row: icon then text, margin-left on text
    return { marginLeft: 8 };
  } else if (isReverse) {
    // column-reverse: text appears above icon visually, so margin-bottom pushes away from icon
    return { marginBottom: 8 };
  } else {
    // column (default): icon above text, margin-top on text
    return { marginTop: 8 };
  }
});

const iconSizeNum = computed(() => parseNumeric(grid.iconSize.value));

const textStyle = computed(() => ({
  fontSize: 12,
  color: '#646566',
  lineHeight: 18,
  textAlign: 'center' as const,
}));

// Active state for clickable items (visual press feedback)
const isActive = ref(false);

const activeOverlayStyle = computed(() => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.1)',
}));

function onTouchStart() {
  if (grid.clickable.value) {
    isActive.value = true;
  }
}

function onTouchEnd() {
  isActive.value = false;
}

/** Click always emits (Vant behavior). Clickable prop only controls visual feedback. */
function onTap(event: any) {
  emit('click', event);
}

/** Whether icon content exists (for text spacing logic) */
const hasIcon = computed(() => !!props.icon);
</script>

<template>
  <!-- Root wrapper: sets column width, square aspect ratio, gutter spacing -->
  <view :style="rootStyle">
    <!-- Content wrapper: flex layout, border, background, padding -->
    <view
      :style="contentStyle"
      @tap="onTap"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <!-- Default slot replaces the entire content (icon + text) -->
      <template v-if="$slots.default">
        <slot />
      </template>

      <template v-else>
        <!-- Icon area: uses shared Icon component with Badge integration -->
        <!-- In reverse mode, flex-direction handles visual ordering -->
        <slot name="icon">
          <Icon
            v-if="icon"
            :name="icon"
            :size="iconSizeNum"
            :color="iconColor || '#323233'"
            :dot="dot"
            :badge="badge"
            :class-prefix="iconPrefix"
            :badge-props="badgeProps"
          />
        </slot>

        <!-- Text area with directional spacing relative to icon -->
        <slot name="text">
          <text
            v-if="text"
            :style="{ ...textStyle, ...(hasIcon || $slots.icon ? textSpacingStyle : {}) }"
          >{{ text }}</text>
        </slot>
      </template>

      <!-- Active overlay for clickable items (press feedback) -->
      <view
        v-if="isActive && grid.clickable.value"
        :style="activeOverlayStyle"
      />
    </view>
  </view>
</template>
