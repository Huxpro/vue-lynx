<!--
  Vant Feature Parity Report (Progress):
  Source: https://github.com/youzan/vant/blob/main/packages/vant/src/progress/Progress.tsx
  - Props: 9/9 supported (percentage, strokeWidth, color, trackColor, pivotText, pivotColor, textColor, inactive, showPivot)
  - Events: 0/0 (none in Vant)
  - Slots: 1/1 supported (pivot - custom pivot content, receives { percentage })
  - Layout: Track with portion fill + pivot badge absolutely positioned at percentage point
  - Inactive state: Grey color (#cacaca) overrides color for both portion and pivot
  - Percentage clamped to 0-100, accepts both number and string
  - Pivot: Positioned at left: X% with marginLeft offset to center on the percentage point,
    matching Vant's transform: translate(-X%, -50%) behavior
  - Gaps:
    - No CSS transition on width change (Lynx does not support CSS transitions)
    - No CSS variable theming (inline styles only in Lynx)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface ProgressProps {
  /** Current percentage (0-100), accepts number or numeric string */
  percentage?: number | string;
  /** Height of the progress bar in px */
  strokeWidth?: number | string;
  /** Color of the progress portion */
  color?: string;
  /** Background color of the track */
  trackColor?: string;
  /** Custom text displayed on the pivot */
  pivotText?: string;
  /** Background color of the pivot badge */
  pivotColor?: string;
  /** Text color of the pivot label */
  textColor?: string;
  /** Whether the progress bar is inactive (grey) */
  inactive?: boolean;
  /** Whether to show the pivot label */
  showPivot?: boolean;
}

const props = withDefaults(defineProps<ProgressProps>(), {
  percentage: 0,
  strokeWidth: 4,
  color: '#1989fa',
  trackColor: '#e5e5e5',
  showPivot: true,
  inactive: false,
});

const INACTIVE_COLOR = '#cacaca';

const clampedPercentage = computed(() => {
  const val = typeof props.percentage === 'string'
    ? parseFloat(props.percentage)
    : props.percentage;
  return Math.min(100, Math.max(0, isNaN(val) ? 0 : val));
});

const resolvedStrokeWidth = computed(() => {
  const val = typeof props.strokeWidth === 'string'
    ? parseFloat(props.strokeWidth)
    : props.strokeWidth;
  return isNaN(val) ? 4 : val;
});

/** Resolved bar color, respecting inactive state */
const background = computed(() =>
  props.inactive ? INACTIVE_COLOR : props.color
);

/** Resolved pivot background: pivotColor > bar color > inactive color */
const pivotBackground = computed(() =>
  props.pivotColor || background.value
);

/** Text shown in pivot (default: "XX%") */
const displayText = computed(() =>
  props.pivotText !== undefined ? props.pivotText : `${clampedPercentage.value}%`
);

// Vant layout: the root element IS the track. The portion and pivot are
// absolutely positioned inside it. The pivot is vertically centered on the
// track (top: 50%, translate -50% Y) and horizontally placed at the
// percentage point (left: X%, translate -X% X).
//
// In Lynx we replicate this with position: relative on the track and
// position: absolute on portion + pivot.
// For the pivot's horizontal centering, Vant uses `transform: translate(-X%, -50%)`.
// Lynx does not support percentage-based transforms, so we approximate with
// a negative marginLeft. The pivot min-width is ~36px (3.6em at 10px font),
// so we shift by roughly half that. This is an acceptable approximation.

const PIVOT_MIN_WIDTH = 36;
const PIVOT_HEIGHT = 20; // approximate: fontSize 10 * lineHeight 1.6 + padding

const trackStyle = computed(() => ({
  width: '100%',
  height: resolvedStrokeWidth.value,
  backgroundColor: props.trackColor,
  borderRadius: resolvedStrokeWidth.value / 2,
  position: 'relative' as const,
}));

const portionStyle = computed(() => ({
  position: 'absolute' as const,
  left: 0,
  top: 0,
  width: `${clampedPercentage.value}%`,
  height: '100%',
  backgroundColor: background.value,
  borderRadius: resolvedStrokeWidth.value / 2,
}));

/**
 * Pivot positioning: matches Vant's approach.
 * Vant uses: left: X%, transform: translate(-X%, -50%)
 * We approximate: left: X%, marginLeft: -(X% of PIVOT_MIN_WIDTH), top offset for vertical centering.
 */
const pivotStyle = computed(() => {
  const pct = clampedPercentage.value;
  // Approximate horizontal shift: at 0% pivot is left-aligned, at 100% it's right-aligned
  const horizontalShift = -(pct / 100) * PIVOT_MIN_WIDTH;
  // Vertical centering: center pivot on the track midpoint
  const verticalOffset = -(PIVOT_HEIGHT - resolvedStrokeWidth.value) / 2;

  return {
    position: 'absolute' as const,
    left: `${pct}%`,
    top: verticalOffset,
    marginLeft: horizontalShift,
    minWidth: PIVOT_MIN_WIDTH,
    height: PIVOT_HEIGHT,
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: pivotBackground.value,
    borderRadius: 999,
    paddingLeft: 5,
    paddingRight: 5,
  };
});

const pivotTextStyle = computed(() => ({
  fontSize: 10,
  color: props.textColor || '#fff',
  lineHeight: 16,
  textAlign: 'center' as const,
}));

/**
 * Outer container: provides enough vertical space for the pivot to overflow
 * the track without clipping. Vant's track itself is position:relative and
 * the pivot overflows it naturally. In Lynx, we add vertical padding to
 * ensure the pivot (which is taller than the track) is not clipped.
 */
const containerStyle = computed(() => {
  const overflow = Math.max(0, (PIVOT_HEIGHT - resolvedStrokeWidth.value) / 2);
  return {
    width: '100%',
    paddingTop: overflow,
    paddingBottom: overflow,
  };
});
</script>

<template>
  <view :style="containerStyle">
    <view :style="trackStyle">
      <!-- Filled portion -->
      <view :style="portionStyle" />

      <!-- Pivot badge: absolutely positioned at the percentage point -->
      <view v-if="showPivot" :style="pivotStyle">
        <slot name="pivot" :percentage="clampedPercentage">
          <text :style="pivotTextStyle">{{ displayText }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
