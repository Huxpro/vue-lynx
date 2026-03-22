<!--
  Lynx Limitations:
  - ::before touch area expansion: Lynx has no ::before pseudo-element; touch area uses padding on container
  - cursor styles: Lynx has no cursor support (grab, not-allowed)
  - aria attributes: Lynx has no ARIA accessibility support
  - click event for track tap: uses @tap instead of onClick
  - passive touchmove: uses @touchmove directly
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit } from '../../utils/format';
import type { SliderValue } from './types';
import './index.less';

const [name, bem] = createNamespace('slider');

type NumberRange = [number, number];

export interface SliderProps {
  modelValue?: SliderValue;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  barHeight?: number | string;
  buttonSize?: number | string;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
  readonly?: boolean;
  vertical?: boolean;
  range?: boolean;
  reverse?: boolean;
}

const props = withDefaults(defineProps<SliderProps>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  readonly: false,
  vertical: false,
  range: false,
  reverse: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: SliderValue];
  change: [value: SliderValue];
  dragStart: [event: any];
  dragEnd: [event: any];
}>();

let buttonIndex: 0 | 1 = 0;
let current: SliderValue = 0;
let startValue: SliderValue = 0;
let startPos = 0;
let trackSizeVal = 0;

const dragStatus = ref<'start' | 'dragging' | ''>('');

const scope = computed(() => Number(props.max) - Number(props.min));

const isRange = (val: unknown): val is NumberRange =>
  props.range && Array.isArray(val);

// Wrapper style: only dynamic props (inactiveColor, barHeight)
const wrapperStyle = computed(() => {
  const crossAxis = props.vertical ? 'width' : 'height';
  const style: Record<string, any> = {};
  if (props.inactiveColor) {
    style.background = props.inactiveColor;
  }
  if (props.barHeight) {
    style[crossAxis] = addUnit(props.barHeight);
  }
  return Object.keys(style).length ? style : undefined;
});

const calcMainAxis = () => {
  const { modelValue, min } = props;
  if (isRange(modelValue)) {
    return `${((modelValue[1] - modelValue[0]) * 100) / scope.value}%`;
  }
  return `${(((modelValue as number) - Number(min)) * 100) / scope.value}%`;
};

const calcOffset = () => {
  const { modelValue, min } = props;
  if (isRange(modelValue)) {
    return `${((modelValue[0] - Number(min)) * 100) / scope.value}%`;
  }
  return '0%';
};

const barStyle = computed(() => {
  const mainAxis = props.vertical ? 'height' : 'width';
  const style: Record<string, any> = {
    [mainAxis]: calcMainAxis(),
  };

  if (props.activeColor) {
    style.background = props.activeColor;
  }

  if (dragStatus.value) {
    style.transition = 'none';
  }

  const getPositionKey = () => {
    if (props.vertical) {
      return props.reverse ? 'bottom' : 'top';
    }
    return props.reverse ? 'right' : 'left';
  };

  style[getPositionKey()] = calcOffset();
  return style;
});

const buttonSizeStyle = computed(() => {
  if (!props.buttonSize) return undefined;
  const size = addUnit(props.buttonSize);
  return { width: size, height: size };
});

function addNumber(num1: number, num2: number) {
  const cardinal = 10 ** 10;
  return Math.round((num1 + num2) * cardinal) / cardinal;
}

const format = (value: number) => {
  const min = +props.min;
  const max = +props.max;
  const step = +props.step;
  value = Math.min(max, Math.max(min, value));
  const diff = Math.round((value - min) / step) * step;
  return addNumber(min, diff);
};

function isSameValue(a: SliderValue, b: SliderValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a[0] === b[0] && a[1] === b[1];
  }
  return a === b;
}

const handleRangeValue = (value: NumberRange): NumberRange => {
  const left = value[0] ?? Number(props.min);
  const right = value[1] ?? Number(props.max);
  return left > right ? [right, left] : [left, right];
};

const updateStartValue = () => {
  const cur = props.modelValue;
  if (isRange(cur)) {
    startValue = cur.map(format) as NumberRange;
  } else {
    startValue = format(cur as number);
  }
};

const updateValue = (value: SliderValue, end?: boolean) => {
  if (isRange(value)) {
    value = handleRangeValue(value).map(format) as NumberRange;
  } else {
    value = format(value as number);
  }

  if (!isSameValue(value, props.modelValue)) {
    emit('update:modelValue', value);
  }

  if (end && !isSameValue(value, startValue)) {
    emit('change', value);
  }
};

const onTrackLayout = (event: any) => {
  const size = props.vertical
    ? (event?.detail?.height ?? 0)
    : (event?.detail?.width ?? 0);
  if (size) {
    trackSizeVal = size;
  }
};

const onTrackTap = (event: any) => {
  if (props.disabled || props.readonly) return;

  updateStartValue();

  const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
  const target = event.currentTarget || event.target;
  const rect = target?.getBoundingClientRect?.() || {
    left: 0,
    top: 0,
    right: trackSizeVal,
    bottom: trackSizeVal,
    width: trackSizeVal || 200,
    height: trackSizeVal || 200,
  };

  const getDelta = () => {
    if (props.vertical) {
      if (props.reverse) {
        return (rect.bottom || (rect.top + rect.height)) - (touch.clientY || touch.pageY || 0);
      }
      return (touch.clientY || touch.pageY || 0) - (rect.top || 0);
    }
    if (props.reverse) {
      return (rect.right || (rect.left + rect.width)) - (touch.clientX || touch.pageX || 0);
    }
    return (touch.clientX || touch.pageX || 0) - (rect.left || 0);
  };

  const total = props.vertical ? (rect.height || trackSizeVal || 200) : (rect.width || trackSizeVal || 200);
  const value = Number(props.min) + (getDelta() / total) * scope.value;

  if (isRange(props.modelValue)) {
    const [left, right] = props.modelValue;
    const middle = (left + right) / 2;
    if (value <= middle) {
      updateValue([value, right], true);
    } else {
      updateValue([left, value], true);
    }
  } else {
    updateValue(value, true);
  }
};

const onTouchStart = (event: any, index?: 0 | 1) => {
  if (props.disabled || props.readonly) return;

  if (typeof index === 'number') {
    buttonIndex = index;
  }

  const touch = event.touches?.[0] || event;
  startPos = props.vertical
    ? (touch.clientY || touch.pageY || 0)
    : (touch.clientX || touch.pageX || 0);

  current = props.modelValue;
  updateStartValue();
  dragStatus.value = 'start';
};

const onTouchMove = (event: any) => {
  if (props.disabled || props.readonly) return;
  if (!dragStatus.value) return;

  if (dragStatus.value === 'start') {
    emit('dragStart', event);
  }

  const touch = event.touches?.[0] || event;
  const currentPos = props.vertical
    ? (touch.clientY || touch.pageY || 0)
    : (touch.clientX || touch.pageX || 0);
  const delta = currentPos - startPos;

  dragStatus.value = 'dragging';

  const total = trackSizeVal || 200;
  let diff = (delta / total) * scope.value;
  if (props.reverse) {
    diff = -diff;
  }

  if (isRange(startValue)) {
    const idx = props.reverse ? (1 - buttonIndex) as 0 | 1 : buttonIndex;
    const newRange = [...startValue] as NumberRange;
    newRange[idx] = (startValue as NumberRange)[idx] + diff;
    current = newRange;
  } else {
    current = (startValue as number) + diff;
  }

  updateValue(current);
};

const onTouchEnd = (event: any) => {
  if (props.disabled || props.readonly) return;

  if (dragStatus.value === 'dragging') {
    updateValue(current, true);
    emit('dragEnd', event);
  }

  dragStatus.value = '';
};

const getButtonClassName = (index?: 0 | 1) => {
  if (typeof index === 'number') {
    const position = ['left', 'right'];
    return bem('button-wrapper', position[index]);
  }
  return bem('button-wrapper', props.reverse ? 'left' : 'right');
};

// Format initial value
watch(
  () => props.modelValue,
  (val) => {
    // Only format on initial mount if value is out of step
    if (val !== undefined) {
      const formatted = isRange(val)
        ? handleRangeValue(val).map(format) as NumberRange
        : format(val as number);
      if (!isSameValue(formatted, val)) {
        emit('update:modelValue', formatted);
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <view
    :class="bem([{ vertical, disabled }])"
    :style="wrapperStyle"
    @tap="onTrackTap"
    @layout="onTrackLayout"
  >
    <view class="van-slider__bar" :style="barStyle">
      <!-- Single mode button -->
      <view
        v-if="!range"
        :class="getButtonClassName()"
        @touchstart="(e: any) => onTouchStart(e)"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <slot name="button" :value="modelValue" :dragging="dragStatus === 'dragging'">
          <view class="van-slider__button" :style="buttonSizeStyle" />
        </slot>
      </view>

      <!-- Range mode: left button -->
      <view
        v-if="range"
        :class="getButtonClassName(0)"
        @touchstart="(e: any) => onTouchStart(e, 0)"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <slot
          name="left-button"
          :value="Array.isArray(modelValue) ? modelValue[0] : modelValue"
          :dragging="dragStatus === 'dragging'"
          :drag-index="dragStatus === 'dragging' && Array.isArray(current) ? (current[0] > current[1] ? (buttonIndex === 0 ? 1 : 0) : buttonIndex) : undefined"
        >
          <view class="van-slider__button" :style="buttonSizeStyle" />
        </slot>
      </view>

      <!-- Range mode: right button -->
      <view
        v-if="range"
        :class="getButtonClassName(1)"
        @touchstart="(e: any) => onTouchStart(e, 1)"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <slot
          name="right-button"
          :value="Array.isArray(modelValue) ? modelValue[1] : modelValue"
          :dragging="dragStatus === 'dragging'"
          :drag-index="dragStatus === 'dragging' && Array.isArray(current) ? (current[0] > current[1] ? (buttonIndex === 0 ? 1 : 0) : buttonIndex) : undefined"
        >
          <view class="van-slider__button" :style="buttonSizeStyle" />
        </slot>
      </view>
    </view>
  </view>
</template>
