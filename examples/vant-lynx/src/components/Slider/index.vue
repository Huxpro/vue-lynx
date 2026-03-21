<!--
  Vant Feature Parity Report:
  Source: https://github.com/youzan/vant/blob/main/packages/vant/src/slider/Slider.tsx

  Props (12/13 supported):
    - modelValue: number | [number, number]  [YES] current value (supports range)
    - min: number                            [YES] minimum value (default 0)
    - max: number                            [YES] maximum value (default 100)
    - step: number                           [YES] step size (default 1)
    - barHeight: number | string             [YES] track height
    - buttonSize: number | string            [YES] thumb button size
    - activeColor: string                    [YES] active track color
    - inactiveColor: string                  [YES] inactive track color
    - disabled: boolean                      [YES] disable slider
    - readonly: boolean                      [YES] readonly (no interaction)
    - vertical: boolean                      [YES] vertical layout
    - range: boolean                         [YES] dual-thumb range mode
    - reverse: boolean                       [YES] reverse direction

  Events (4/4 supported):
    - update:modelValue                      [YES] v-model update
    - change                                 [YES] value changed after drag end
    - drag-start                             [YES] drag started
    - drag-end                               [YES] drag ended

  Slots (3/3 supported):
    - button                                 [YES] custom thumb button (single mode)
    - left-button                            [YES] custom left thumb (range mode)
    - right-button                           [YES] custom right thumb (range mode)

  Lynx Adaptations:
    - Uses view elements with inline styles
    - display: 'flex' set explicitly
    - Touch-based interaction (touchstart/touchmove/touchend)
    - No CSS transition on drag (drag is immediate)
    - No CSS class-based styling
    - percentage-based positioning via left/top style properties
-->
<script setup lang="ts">
import { ref, computed } from 'vue-lynx';

type NumberRange = [number, number];
type SliderValue = number | NumberRange;

export interface SliderProps {
  modelValue?: SliderValue;
  max?: number;
  min?: number;
  step?: number;
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
  max: 100,
  min: 0,
  step: 1,
  barHeight: 2,
  buttonSize: 24,
  activeColor: '#1989fa',
  inactiveColor: '#e5e5e5',
  disabled: false,
  readonly: false,
  vertical: false,
  range: false,
  reverse: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: SliderValue];
  change: [value: SliderValue];
  'drag-start': [event: any];
  'drag-end': [event: any];
}>();

const dragging = ref(false);
const dragStatus = ref<'start' | 'dragging' | ''>('');
const trackSize = ref(0);
const startPos = ref(0);
const startValue = ref<SliderValue>(0);
const currentValue = ref<SliderValue>(0);
const buttonIndex = ref<0 | 1>(0);

const scope = computed(() => Number(props.max) - Number(props.min));

const resolvedBarHeight = computed(() => {
  if (typeof props.barHeight === 'string') return parseInt(props.barHeight, 10) || 2;
  return props.barHeight;
});

const resolvedButtonSize = computed(() => {
  if (typeof props.buttonSize === 'string') return parseInt(props.buttonSize, 10) || 24;
  return props.buttonSize;
});

const isRange = (val: unknown): val is NumberRange =>
  props.range && Array.isArray(val);

function format(value: number): number {
  const min = Number(props.min);
  const max = Number(props.max);
  const step = Number(props.step);
  value = Math.min(max, Math.max(min, value));
  const diff = Math.round((value - min) / step) * step;
  // Avoid floating-point issues
  return parseFloat((min + diff).toFixed(10));
}

function isSameValue(a: SliderValue, b: SliderValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a[0] === b[0] && a[1] === b[1];
  }
  return a === b;
}

function handleRangeValue(value: NumberRange): NumberRange {
  const left = value[0] ?? Number(props.min);
  const right = value[1] ?? Number(props.max);
  return left > right ? [right, left] : [left, right];
}

function updateValue(value: SliderValue, end?: boolean) {
  if (isRange(value)) {
    value = handleRangeValue(value).map(format) as NumberRange;
  } else {
    value = format(value as number);
  }

  if (!isSameValue(value, props.modelValue)) {
    emit('update:modelValue', value);
  }

  if (end && !isSameValue(value, startValue.value)) {
    emit('change', value);
  }
}

// Calculate the main-axis percentage of the active bar
const calcMainAxis = computed(() => {
  const { modelValue, min } = props;
  if (isRange(modelValue)) {
    return ((modelValue[1] - modelValue[0]) * 100) / scope.value;
  }
  return (((modelValue as number) - Number(min)) * 100) / scope.value;
});

// Calculate the offset of the active bar
const calcOffset = computed(() => {
  const { modelValue, min } = props;
  if (isRange(modelValue)) {
    return ((modelValue[0] - Number(min)) * 100) / scope.value;
  }
  return 0;
});

// Position of the left (or single) button
const buttonLeftPercent = computed(() => {
  if (isRange(props.modelValue)) {
    return ((props.modelValue[0] - Number(props.min)) * 100) / scope.value;
  }
  return (((props.modelValue as number) - Number(props.min)) * 100) / scope.value;
});

// Position of the right button (range mode)
const buttonRightPercent = computed(() => {
  if (isRange(props.modelValue)) {
    return ((props.modelValue[1] - Number(props.min)) * 100) / scope.value;
  }
  return 0;
});

const containerStyle = computed(() => {
  const btnSz = resolvedButtonSize.value;
  if (props.vertical) {
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      paddingTop: btnSz / 2,
      paddingBottom: btnSz / 2,
      paddingLeft: btnSz / 2,
      paddingRight: btnSz / 2,
      opacity: props.disabled ? 0.5 : 1,
    };
  }
  return {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingTop: btnSz / 2,
    paddingBottom: btnSz / 2,
    paddingLeft: btnSz / 2,
    paddingRight: btnSz / 2,
    opacity: props.disabled ? 0.5 : 1,
  };
});

const trackWrapStyle = computed(() => {
  if (props.vertical) {
    return {
      height: '100%',
      width: resolvedBarHeight.value,
      position: 'relative' as const,
    };
  }
  return {
    flex: 1,
    position: 'relative' as const,
  };
});

const trackStyle = computed(() => {
  const h = resolvedBarHeight.value;
  if (props.vertical) {
    return {
      width: h,
      height: '100%',
      backgroundColor: props.inactiveColor,
      borderRadius: h / 2,
      position: 'relative' as const,
    };
  }
  return {
    width: '100%',
    height: h,
    backgroundColor: props.inactiveColor,
    borderRadius: h / 2,
    position: 'relative' as const,
  };
});

const fillStyle = computed(() => {
  const h = resolvedBarHeight.value;
  const mainSize = `${calcMainAxis.value}%`;
  const offsetVal = `${calcOffset.value}%`;

  if (props.vertical) {
    const posKey = props.reverse ? 'bottom' : 'top';
    return {
      width: h,
      height: mainSize,
      backgroundColor: props.activeColor,
      borderRadius: h / 2,
      position: 'absolute' as const,
      left: 0,
      [posKey]: offsetVal,
    };
  }

  const posKey = props.reverse ? 'right' : 'left';
  return {
    height: h,
    width: mainSize,
    backgroundColor: props.activeColor,
    borderRadius: h / 2,
    position: 'absolute' as const,
    top: 0,
    [posKey]: offsetVal,
  };
});

function getButtonWrapStyle(percent: number) {
  const btnSz = resolvedButtonSize.value;
  const barH = resolvedBarHeight.value;

  if (props.vertical) {
    const posKey = props.reverse ? 'bottom' : 'top';
    return {
      position: 'absolute' as const,
      left: -(btnSz - barH) / 2,
      [posKey]: `${percent}%`,
      marginTop: -(btnSz / 2),
      width: btnSz,
      height: btnSz,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }

  const posKey = props.reverse ? 'right' : 'left';
  return {
    position: 'absolute' as const,
    top: -(btnSz - barH) / 2,
    [posKey]: `${percent}%`,
    marginLeft: -(btnSz / 2),
    width: btnSz,
    height: btnSz,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

const singleButtonWrapStyle = computed(() => {
  if (isRange(props.modelValue)) return {};
  return getButtonWrapStyle(buttonLeftPercent.value);
});

const leftButtonWrapStyle = computed(() => {
  if (!isRange(props.modelValue)) return {};
  return getButtonWrapStyle(buttonLeftPercent.value);
});

const rightButtonWrapStyle = computed(() => {
  if (!isRange(props.modelValue)) return {};
  return getButtonWrapStyle(buttonRightPercent.value);
});

const defaultButtonStyle = computed(() => {
  const btnSz = resolvedButtonSize.value;
  return {
    width: btnSz,
    height: btnSz,
    borderRadius: btnSz / 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: (props.disabled || props.readonly) ? '#c8c9cc' : props.activeColor,
  };
});

function onTrackLayout(event: any) {
  const size = props.vertical
    ? (event?.detail?.height ?? event?.currentTarget?.offsetHeight ?? 0)
    : (event?.detail?.width ?? event?.currentTarget?.offsetWidth ?? 0);
  if (size) {
    trackSize.value = size;
  }
}

function updateStartValue() {
  const current = props.modelValue;
  if (isRange(current)) {
    startValue.value = current.map(format) as NumberRange;
  } else {
    startValue.value = format(current as number);
  }
}

function onTouchStart(event: any, index?: 0 | 1) {
  if (props.disabled || props.readonly) return;

  if (typeof index === 'number') {
    buttonIndex.value = index;
  }

  const touch = event.touches?.[0] || event;
  startPos.value = props.vertical
    ? (touch.clientY || touch.pageY || 0)
    : (touch.clientX || touch.pageX || 0);

  currentValue.value = props.modelValue;
  updateStartValue();
  dragStatus.value = 'start';
  dragging.value = true;

  // Try to get track size
  const target = event.currentTarget || event.target;
  if (target) {
    const size = props.vertical ? target.offsetHeight : target.offsetWidth;
    if (size) trackSize.value = size;
  }
}

function onTouchMove(event: any) {
  if (props.disabled || props.readonly || !dragging.value) return;

  if (dragStatus.value === 'start') {
    emit('drag-start', event);
  }

  const touch = event.touches?.[0] || event;
  const currentPos = props.vertical
    ? (touch.clientY || touch.pageY || 0)
    : (touch.clientX || touch.pageX || 0);
  const delta = currentPos - startPos.value;

  dragStatus.value = 'dragging';

  const total = trackSize.value || 200;
  let diff = (delta / total) * scope.value;
  if (props.reverse) {
    diff = -diff;
  }

  if (isRange(startValue.value)) {
    const idx = props.reverse ? (1 - buttonIndex.value) as 0 | 1 : buttonIndex.value;
    const newRange = [...startValue.value] as NumberRange;
    newRange[idx] = (startValue.value as NumberRange)[idx] + diff;
    currentValue.value = newRange;
  } else {
    currentValue.value = (startValue.value as number) + diff;
  }

  updateValue(currentValue.value);
}

function onTouchEnd(event: any) {
  if (props.disabled || props.readonly) return;

  if (dragStatus.value === 'dragging') {
    updateValue(currentValue.value, true);
    emit('drag-end', event);
  }

  dragging.value = false;
  dragStatus.value = '';
}

function onTrackTap(event: any) {
  if (props.disabled || props.readonly) return;

  updateStartValue();

  const touch = event.touches?.[0] || event;
  const target = event.currentTarget || event.target;
  const rect = target?.getBoundingClientRect?.() || {
    left: 0, top: 0,
    width: trackSize.value || 200,
    height: trackSize.value || 200,
  };

  let delta: number;
  let total: number;

  if (props.vertical) {
    if (props.reverse) {
      delta = (rect.bottom || (rect.top + rect.height)) - (touch.clientY || touch.pageY || 0);
    } else {
      delta = (touch.clientY || touch.pageY || 0) - (rect.top || 0);
    }
    total = rect.height || trackSize.value || 200;
  } else {
    if (props.reverse) {
      delta = (rect.right || (rect.left + rect.width)) - (touch.clientX || touch.pageX || 0);
    } else {
      delta = (touch.clientX || touch.pageX || 0) - (rect.left || 0);
    }
    total = rect.width || trackSize.value || 200;
  }

  const value = Number(props.min) + (delta / total) * scope.value;

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
}
</script>

<template>
  <view :style="containerStyle">
    <view
      :style="trackWrapStyle"
      @layout="onTrackLayout"
      @tap="onTrackTap"
    >
      <!-- Track background -->
      <view :style="trackStyle">
        <!-- Active fill -->
        <view :style="fillStyle" />

        <!-- Single thumb button (non-range mode) -->
        <view
          v-if="!range"
          :style="singleButtonWrapStyle"
          @touchstart="(e: any) => onTouchStart(e)"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <slot name="button" :value="modelValue" :dragging="dragStatus === 'dragging'">
            <view :style="defaultButtonStyle" />
          </slot>
        </view>

        <!-- Left thumb (range mode) -->
        <view
          v-if="range"
          :style="leftButtonWrapStyle"
          @touchstart="(e: any) => onTouchStart(e, 0)"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <slot
            name="left-button"
            :value="Array.isArray(modelValue) ? modelValue[0] : modelValue"
            :dragging="dragStatus === 'dragging'"
          >
            <view :style="defaultButtonStyle" />
          </slot>
        </view>

        <!-- Right thumb (range mode) -->
        <view
          v-if="range"
          :style="rightButtonWrapStyle"
          @touchstart="(e: any) => onTouchStart(e, 1)"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <slot
            name="right-button"
            :value="Array.isArray(modelValue) ? modelValue[1] : modelValue"
            :dragging="dragStatus === 'dragging'"
          >
            <view :style="defaultButtonStyle" />
          </slot>
        </view>
      </view>
    </view>
  </view>
</template>
