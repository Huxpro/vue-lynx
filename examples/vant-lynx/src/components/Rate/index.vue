<!--
  Lynx Limitations:
  - role/aria-*: Lynx has no ARIA attributes
  - tabindex: Lynx has no keyboard focus model
  - cursor: Lynx is touch-only, no cursor styling
  - useRect/getBoundingClientRect: Touch drag scoring uses estimation instead of DOM rect measurement
  - useCustomFieldValue: No Vant Form integration yet
-->
<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import { createNamespace, addUnit } from '../../utils';
import Icon from '../Icon/index.vue';
import './index.less';

export type { RateThemeVars } from './types';

export interface RateProps {
  size?: string | number;
  icon?: string;
  color?: string;
  count?: number | string;
  gutter?: string | number;
  clearable?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  voidIcon?: string;
  allowHalf?: boolean;
  voidColor?: string;
  touchable?: boolean;
  iconPrefix?: string;
  modelValue?: number;
  disabledColor?: string;
}

const [, bem] = createNamespace('rate');

const props = withDefaults(defineProps<RateProps>(), {
  icon: 'star',
  count: 5,
  voidIcon: 'star-o',
  modelValue: 0,
  touchable: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

type RateStatus = 'full' | 'half' | 'void';

interface RateListItem {
  value: number;
  status: RateStatus;
}

function getRateStatus(
  value: number,
  index: number,
  allowHalf: boolean,
  readonly: boolean,
): RateListItem {
  if (value >= index) {
    return { status: 'full', value: 1 };
  }
  if (value + 0.5 >= index && allowHalf && !readonly) {
    return { status: 'half', value: 0.5 };
  }
  if (value + 1 >= index && allowHalf && readonly) {
    const cardinal = 10 ** 10;
    return {
      status: 'half',
      value: Math.round((value - index + 1) * cardinal) / cardinal,
    };
  }
  return { status: 'void', value: 0 };
}

const unselectable = computed(() => props.readonly || props.disabled);
const untouchable = computed(() => unselectable.value || !props.touchable);

const list = computed<RateListItem[]>(() =>
  Array(+props.count)
    .fill('')
    .map((_, i) =>
      getRateStatus(
        props.modelValue,
        i + 1,
        !!props.allowHalf,
        !!props.readonly,
      ),
    ),
);

// Touch tracking (simplified useTouch for Rate)
const startX = ref(0);
const startY = ref(0);
const deltaX = ref(0);
const deltaY = ref(0);
const isTap = ref(true);
const TAP_OFFSET = 5;

function select(value: number) {
  if (unselectable.value || value === props.modelValue) return;
  emit('update:modelValue', value);
  emit('change', value);
}

function getScoreByPosition(x: number): number {
  // Estimate star positions from props
  const iconSize = typeof props.size === 'number' ? props.size :
    props.size ? parseFloat(props.size) : 20;
  const gutterSize = typeof props.gutter === 'number' ? props.gutter :
    props.gutter ? parseFloat(props.gutter) : 4;
  const starWidth = iconSize + gutterSize;

  // Use offset from start position
  const offsetX = x - startX.value;
  // Estimate initial star center position
  const initialStar = Math.max(1, Math.min(+props.count, Math.round(props.modelValue) || 1));
  const pixelPos = (initialStar - 1) * starWidth + iconSize / 2 + offsetX;

  let score: number;
  if (props.allowHalf) {
    const raw = pixelPos / starWidth + 0.5;
    score = Math.round(raw * 2) / 2;
  } else {
    score = Math.round(pixelPos / starWidth + 0.5);
  }

  const minScore = props.allowHalf ? 0.5 : 1;
  return Math.max(minScore, Math.min(+props.count, score));
}

function onTouchStart(event: any) {
  if (untouchable.value) return;
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  if (!touch) return;
  startX.value = touch.clientX;
  startY.value = touch.clientY;
  deltaX.value = 0;
  deltaY.value = 0;
  isTap.value = true;
}

function onTouchMove(event: any) {
  if (untouchable.value) return;
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  if (!touch) return;
  deltaX.value = touch.clientX - startX.value;
  deltaY.value = touch.clientY - startY.value;

  const offsetX = Math.abs(deltaX.value);
  const offsetY = Math.abs(deltaY.value);

  // Determine if it's still a tap
  if (offsetX > TAP_OFFSET || offsetY > TAP_OFFSET) {
    isTap.value = false;
  }

  // Only respond to horizontal drag
  if (offsetX > offsetY && !isTap.value) {
    select(getScoreByPosition(touch.clientX));
  }
}

function onTouchEnd() {
  // noop - isTap state is used on click
}

function onItemClick(index: number) {
  if (unselectable.value) return;
  let value = index + 1;
  if (props.clearable && isTap.value && value === props.modelValue) {
    value = 0;
  }
  select(value);
}

function onHalfClick(index: number, event: any) {
  if (unselectable.value) return;
  // Stop propagation so the full star click doesn't fire
  event?.stopPropagation?.();
  let value = index + 0.5;
  if (props.clearable && isTap.value && value === props.modelValue) {
    value = 0;
  }
  select(value);
}

function getItemStyle(index: number) {
  if (props.gutter && index < +props.count - 1) {
    return { paddingRight: addUnit(props.gutter) };
  }
  return undefined;
}

function getHalfIconStyle(item: RateListItem) {
  return { width: item.value + 'em' };
}
</script>

<template>
  <view
    :class="bem([{ readonly, disabled }])"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <view
      v-for="(item, index) in list"
      :key="index"
      :class="bem('item')"
      :style="getItemStyle(index)"
      @tap="onItemClick(index)"
    >
      <Icon
        :size="size"
        :name="item.status === 'full' ? icon : voidIcon"
        :class="bem('icon', { disabled, full: item.status === 'full' })"
        :color="disabled ? disabledColor : (item.status === 'full' ? color : voidColor)"
        :class-prefix="iconPrefix"
      />
      <Icon
        v-if="allowHalf && item.value > 0 && item.value < 1"
        :size="size"
        :style="getHalfIconStyle(item)"
        :name="item.status === 'void' ? voidIcon : icon"
        :class="bem('icon', ['half', { disabled, full: item.status !== 'void' }])"
        :color="disabled ? disabledColor : (item.status === 'void' ? voidColor : color)"
        :class-prefix="iconPrefix"
      />
      <!-- Half-star tap zone for interactive mode -->
      <view
        v-if="allowHalf && !readonly && !disabled"
        :style="{
          position: 'absolute',
          top: '0px',
          left: '0px',
          width: '50%',
          height: '100%',
        }"
        @tap.stop="onHalfClick(index, $event)"
      />
    </view>
  </view>
</template>
