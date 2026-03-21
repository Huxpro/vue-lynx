<!--
  Vant Feature Parity Report:
  - Props: 14/14 supported (modelValue, count, size, gutter, color, voidColor, disabledColor,
    icon, voidIcon, allowHalf, readonly, disabled, touchable, clearable, iconPrefix)
  - Events: 2/2 supported (update:modelValue, change)
  - Slots: 0/0 (Vant Rate has no slots)
  - Notes: When iconPrefix is set, uses Icon component; otherwise uses Unicode characters
-->
<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface RateProps {
  modelValue?: number;
  count?: number;
  size?: number;
  gutter?: number;
  color?: string;
  voidColor?: string;
  disabledColor?: string;
  icon?: string;
  voidIcon?: string;
  allowHalf?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  touchable?: boolean;
  clearable?: boolean;
  iconPrefix?: string;
}

const props = withDefaults(defineProps<RateProps>(), {
  modelValue: 0,
  count: 5,
  size: 20,
  gutter: 4,
  color: '#ee0a24',
  voidColor: '#c8c9cc',
  disabledColor: '#c8c9cc',
  icon: '\u2605',
  voidIcon: '\u2606',
  allowHalf: false,
  readonly: false,
  disabled: false,
  touchable: true,
  clearable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

type StarStatus = 'full' | 'half' | 'void';

interface StarItem {
  status: StarStatus;
  index: number;
  /** For half stars in readonly mode, the fractional fill (0..1). For non-readonly: 0.5. */
  halfFill: number;
}

const unselectable = computed(() => props.readonly || props.disabled);
const untouchable = computed(() => unselectable.value || !props.touchable);

/**
 * Computes star list with status, matching Vant's getRateStatus logic.
 * In readonly mode, half stars render fractional widths (e.g., value 3.7 shows
 * 70% fill on the 4th star). In interactive mode, half stars are always 50%.
 */
const stars = computed<StarItem[]>(() => {
  const result: StarItem[] = [];
  for (let i = 1; i <= props.count; i++) {
    if (props.modelValue >= i) {
      result.push({ status: 'full', index: i, halfFill: 1 });
    } else if (props.allowHalf && !props.readonly && props.modelValue + 0.5 >= i) {
      // Interactive half-star: always 50%
      result.push({ status: 'half', index: i, halfFill: 0.5 });
    } else if (props.allowHalf && props.readonly && props.modelValue + 1 >= i) {
      // Readonly fractional half-star: use precise fraction
      const cardinal = 10 ** 10;
      const fraction = Math.round((props.modelValue - i + 1) * cardinal) / cardinal;
      if (fraction > 0) {
        result.push({ status: 'half', index: i, halfFill: fraction });
      } else {
        result.push({ status: 'void', index: i, halfFill: 0 });
      }
    } else {
      result.push({ status: 'void', index: i, halfFill: 0 });
    }
  }
  return result;
});

function getStarColor(status: StarStatus): string {
  if (props.disabled) {
    return props.disabledColor;
  }
  return status === 'void' ? props.voidColor : props.color;
}

function getHalfStarColor(isActive: boolean): string {
  if (props.disabled) {
    return props.disabledColor;
  }
  return isActive ? props.color : props.voidColor;
}

function select(value: number) {
  if (unselectable.value || value === props.modelValue) return;
  emit('update:modelValue', value);
  emit('change', value);
}

function onSelectFull(index: number) {
  if (unselectable.value) return;
  let newValue = index;
  if (props.clearable && newValue === props.modelValue) {
    newValue = 0;
  }
  select(newValue);
}

function onSelectHalf(index: number) {
  if (unselectable.value) return;
  let newValue = index - 0.5;
  if (props.clearable && newValue === props.modelValue) {
    newValue = 0;
  }
  select(newValue);
}

// --- Touch/drag support ---
const touchStartX = ref(0);
const dragging = ref(false);

function onTouchStart(event: any) {
  if (untouchable.value) return;
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  if (!touch) return;
  touchStartX.value = touch.clientX;
  dragging.value = true;
}

function onTouchMove(event: any) {
  if (untouchable.value || !dragging.value) return;
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  if (!touch) return;
  // Calculate score based on horizontal position relative to the container
  // In Lynx, we estimate star positions from props
  const score = getScoreFromTouch(touch.clientX);
  if (score !== props.modelValue) {
    select(score);
  }
}

function onTouchEnd() {
  dragging.value = false;
}

/**
 * Estimates the score from the touch X position.
 * Since Lynx doesn't easily expose element rects during touch events,
 * we compute positions relative to the initial touch and known star dimensions.
 */
function getScoreFromTouch(clientX: number): number {
  // Each star takes size + gutter (except last which has no gutter)
  const starWidth = props.size;
  const totalStarWidth = starWidth + props.gutter;

  // Use the initial tap position as reference for the starting star
  // Compute offset from touch start
  const offsetFromStart = clientX - touchStartX.value;

  // Figure out which star the initial touch was on
  // We approximate: initial star = current modelValue (clamped to 1..count)
  const initialStar = Math.max(1, Math.min(props.count, Math.round(props.modelValue) || 1));

  // Calculate position relative to that star
  const pixelOffset = (initialStar - 1) * totalStarWidth + starWidth / 2 + offsetFromStart;

  let score: number;
  if (props.allowHalf) {
    // For half-star mode, resolve to 0.5 increments
    const rawScore = pixelOffset / totalStarWidth + 0.5;
    score = Math.round(rawScore * 2) / 2;
  } else {
    score = Math.round(pixelOffset / totalStarWidth + 0.5);
  }

  // Clamp to valid range
  const minScore = props.allowHalf ? 0.5 : 1;
  return Math.max(minScore, Math.min(props.count, score));
}

// --- Computed styles ---
const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  flexWrap: 'wrap' as const,
  alignItems: 'center',
  opacity: props.disabled ? 0.5 : 1,
}));

function getStarWrapStyle(star: StarItem) {
  return {
    position: 'relative' as const,
    paddingRight: star.index < props.count ? props.gutter : 0,
  };
}

function getStarTextStyle(status: StarStatus) {
  return {
    fontSize: props.size,
    color: getStarColor(status),
    lineHeight: props.size,
  };
}

function getHalfOverlayStyle(star: StarItem) {
  // In readonly mode, use fractional width; in interactive mode, use 50%
  const widthFraction = star.halfFill;
  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: props.size * widthFraction,
    height: props.size,
    overflow: 'hidden' as const,
  };
}

function getHalfTextStyle(isActive: boolean) {
  return {
    fontSize: props.size,
    color: getHalfStarColor(isActive),
    lineHeight: props.size,
  };
}
</script>

<template>
  <view
    :style="containerStyle"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <view
      v-for="star in stars"
      :key="star.index"
      :style="getStarWrapStyle(star)"
      @tap="onSelectFull(star.index)"
    >
      <!-- Base star (full icon for full/half, void icon for void) -->
      <template v-if="iconPrefix">
        <Icon
          :name="star.status === 'void' ? voidIcon : (star.status === 'full' ? icon : voidIcon)"
          :class-prefix="iconPrefix"
          :size="size"
          :color="getStarColor(star.status)"
        />
      </template>
      <text
        v-else
        :style="getStarTextStyle(star.status)"
      >{{ star.status === 'void' ? voidIcon : (star.status === 'full' ? icon : voidIcon) }}</text>

      <!-- Half-star overlay: positioned absolutely on top, clipped to fractional width -->
      <view
        v-if="allowHalf && star.status === 'half'"
        :style="getHalfOverlayStyle(star)"
      >
        <template v-if="iconPrefix">
          <Icon
            :name="icon"
            :class-prefix="iconPrefix"
            :size="size"
            :color="getHalfStarColor(true)"
          />
        </template>
        <text
          v-else
          :style="getHalfTextStyle(true)"
        >{{ icon }}</text>
      </view>

      <!-- Interactive half-star tap zone (only in non-readonly, non-disabled mode) -->
      <view
        v-if="allowHalf && !readonly && !disabled"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size / 2,
          height: size,
        }"
        @tap.stop="onSelectHalf(star.index)"
      />
    </view>
  </view>
</template>
