<!--
  Lynx Limitations:
  - role/aria-*: Lynx has no ARIA attributes (role="group", role="spinbutton", aria-valuemin/max/now)
  - ::before/::after pseudo-elements: Uses inner <view> elements for +/- icon lines
  - input type/inputmode: Lynx input doesn't support type="tel" or inputmode
  - cursor styling: Lynx is touch-only, no cursor: not-allowed/default
  - user-select: none: Not applicable in Lynx
  - -webkit-appearance: Not applicable in Lynx
  - -webkit-text-fill-color: Not applicable in Lynx
  - resetScroll: No browser scroll reset needed in Lynx
  - onMousedown: No mouse events in Lynx
  - v-show: Uses v-if (Lynx display:none behavior differs)
-->
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue-lynx';
import { createNamespace, addUnit, isDef } from '../../utils';
import type { Numeric } from '../../utils';
import type { StepperTheme, StepperThemeVars } from './types';
import './index.less';

export type { StepperThemeVars };

export interface StepperProps {
  modelValue?: Numeric;
  min?: Numeric;
  max?: Numeric;
  step?: Numeric;
  name?: Numeric;
  theme?: StepperTheme;
  integer?: boolean;
  disabled?: boolean;
  showPlus?: boolean;
  showMinus?: boolean;
  showInput?: boolean;
  longPress?: boolean;
  autoFixed?: boolean;
  allowEmpty?: boolean;
  inputWidth?: Numeric;
  buttonSize?: Numeric;
  placeholder?: string;
  disablePlus?: boolean;
  disableMinus?: boolean;
  disableInput?: boolean;
  beforeChange?: (...args: unknown[]) => unknown;
  defaultValue?: Numeric;
  decimalLength?: Numeric;
}

const [, bem] = createNamespace('stepper');

const LONG_PRESS_START_TIME = 600;
const LONG_PRESS_INTERVAL = 200;

const props = withDefaults(defineProps<StepperProps>(), {
  modelValue: undefined,
  min: 1,
  max: Infinity,
  step: 1,
  name: '',
  theme: undefined,
  integer: false,
  disabled: false,
  showPlus: true,
  showMinus: true,
  showInput: true,
  longPress: true,
  autoFixed: true,
  allowEmpty: false,
  inputWidth: undefined,
  buttonSize: undefined,
  placeholder: undefined,
  disablePlus: false,
  disableMinus: false,
  disableInput: false,
  beforeChange: undefined,
  defaultValue: 1,
  decimalLength: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: Numeric];
  change: [value: Numeric, detail: { name: Numeric }];
  plus: [];
  minus: [];
  overlimit: [actionType: 'plus' | 'minus'];
  focus: [event: Event];
  blur: [event: Event];
}>();

// --- Helpers ---

function trimExtraChar(value: string, char: string, regExp: RegExp): string {
  const index = value.indexOf(char);
  if (index === -1) return value;
  if (char === '-' && index !== 0) {
    return value.slice(0, index) + value.slice(index).replace(regExp, '');
  }
  return (
    value.slice(0, index + 1) + value.slice(index + 1).replace(regExp, '')
  );
}

function formatNumber(value: string, allowDot = true): string {
  if (allowDot) {
    value = trimExtraChar(value, '.', /\./g);
  } else {
    value = value.split('.')[0];
  }
  value = trimExtraChar(value, '-', /-/g);
  const regExp = allowDot ? /[^-0-9.]/g : /[^-0-9]/g;
  return value.replace(regExp, '');
}

function addNumber(num1: number, num2: number): number {
  const cardinal = 10 ** 10;
  return Math.round((num1 + num2) * cardinal) / cardinal;
}

const isEqual = (value1?: Numeric, value2?: Numeric) =>
  String(value1) === String(value2);

function callInterceptor(
  interceptor: ((...args: unknown[]) => unknown) | undefined,
  args: unknown[],
  done: () => void,
) {
  if (!interceptor) {
    done();
    return;
  }
  const result = interceptor(...args);
  if (result === false) return;
  if (
    result &&
    typeof result === 'object' &&
    typeof (result as Promise<unknown>).then === 'function'
  ) {
    (result as Promise<unknown>)
      .then((val: unknown) => {
        if (val !== false) done();
      })
      .catch(() => {
        // rejected = cancelled
      });
  } else {
    done();
  }
}

// --- Value formatting ---

function format(value: Numeric, autoFixed = true): Numeric {
  const { min, max, allowEmpty, decimalLength } = props;

  if (allowEmpty && value === '') return value;

  // format scientific number
  if (typeof value === 'number' && String(value).includes('e')) {
    value = value.toFixed(isDef(decimalLength) ? +decimalLength : 17);
  }

  value = formatNumber(String(value), !props.integer);
  value = value === '' ? 0 : +value;
  value = Number.isNaN(value) ? +min : value;

  // clamp to min/max
  value = autoFixed ? Math.max(Math.min(+max, value as number), +min) : value;

  // format decimal
  if (isDef(decimalLength)) {
    value = (value as number).toFixed(+decimalLength);
  }

  return value;
}

// --- State ---

function getInitialValue(): Numeric {
  const defaultValue = props.modelValue ?? props.defaultValue;
  const value = format(defaultValue);
  if (!isEqual(value, props.modelValue)) {
    emit('update:modelValue', value);
  }
  return value;
}

let actionType: 'plus' | 'minus' = 'plus';
const current = ref<Numeric>(getInitialValue());

// --- Computed ---

const minusDisabled = computed(
  () => props.disabled || props.disableMinus || +current.value <= +props.min,
);

const plusDisabled = computed(
  () => props.disabled || props.disablePlus || +current.value >= +props.max,
);

const inputStyle = computed(() => ({
  width: addUnit(props.inputWidth),
  height: addUnit(props.buttonSize),
}));

const buttonStyle = computed(() => {
  if (!props.buttonSize) return undefined;
  const size = addUnit(props.buttonSize);
  return { width: size, height: size };
});

// --- Actions ---

function check() {
  const value = format(current.value);
  if (!isEqual(value, current.value)) {
    current.value = value;
  }
}

function setValue(value: Numeric) {
  if (props.beforeChange) {
    callInterceptor(props.beforeChange, [value], () => {
      current.value = value;
    });
  } else {
    current.value = value;
  }
}

function onChange() {
  if (
    (actionType === 'plus' && plusDisabled.value) ||
    (actionType === 'minus' && minusDisabled.value)
  ) {
    emit('overlimit', actionType);
    return;
  }

  const diff = actionType === 'minus' ? -props.step : +props.step;
  const value = format(addNumber(+current.value, +diff));

  setValue(value);
  emit(actionType);
}

function onInput(event: any) {
  // Lynx provides value via event.detail.value; web via event.target.value
  const value = event?.detail?.value ?? event?.target?.value ?? '';
  const { decimalLength } = props;

  let formatted = formatNumber(String(value), !props.integer);

  // limit max decimal length
  if (isDef(decimalLength) && formatted.includes('.')) {
    const pair = formatted.split('.');
    formatted = `${pair[0]}.${pair[1].slice(0, +decimalLength)}`;
  }

  if (props.beforeChange) {
    // Don't update displayed value, keep current
  } else if (!isEqual(value, formatted) && event?.target) {
    event.target.value = formatted;
  }

  // prefer number type
  const isNumericVal = formatted === String(+formatted);
  setValue(isNumericVal ? +formatted : formatted);
}

function onFocus(event: any) {
  if (props.disableInput) {
    // Skip focus emit when input is disabled
  } else {
    emit('focus', event);
  }
}

function onBlur(event: any) {
  const inputValue = event?.detail?.value ?? event?.target?.value ?? String(current.value);
  const value = format(inputValue, props.autoFixed);
  if (event?.target) {
    event.target.value = String(value);
  }
  current.value = value;
  emit('blur', event);
}

// --- Long press ---

let isLongPress = false;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

function longPressStep() {
  longPressTimer = setTimeout(() => {
    onChange();
    longPressStep();
  }, LONG_PRESS_INTERVAL);
}

function onTouchStart(type: 'plus' | 'minus') {
  actionType = type;
  if (!props.longPress) return;
  isLongPress = false;
  clearLongPressTimer();
  longPressTimer = setTimeout(() => {
    isLongPress = true;
    onChange();
    longPressStep();
  }, LONG_PRESS_START_TIME);
}

function onTouchEnd() {
  if (!props.longPress) return;
  clearLongPressTimer();
}

function clearLongPressTimer() {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function onMinusTap() {
  if (props.longPress && isLongPress) return;
  actionType = 'minus';
  onChange();
}

function onPlusTap() {
  if (props.longPress && isLongPress) return;
  actionType = 'plus';
  onChange();
}

// --- Watchers ---

watch(
  () => [props.max, props.min, props.integer, props.decimalLength],
  check,
);

watch(
  () => props.modelValue,
  (value) => {
    if (!isEqual(value, current.value)) {
      current.value = format(value!);
    }
  },
);

watch(current, (value) => {
  emit('update:modelValue', value);
  emit('change', value, { name: props.name });
});

onBeforeUnmount(() => {
  clearLongPressTimer();
});
</script>

<template>
  <!-- Minus button -->
  <view :class="bem([theme])">
    <view
      v-if="showMinus"
      :style="buttonStyle"
      :class="bem('minus', { disabled: minusDisabled })"
      @tap="onMinusTap"
      @touchstart="() => onTouchStart('minus')"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <!-- Horizontal line (minus icon) -->
      <view :class="`${bem('icon-line')} ${bem('icon-line', ['h'])}`" />
    </view>

    <!-- Input -->
    <input
      v-if="showInput"
      :class="bem('input', { disabled })"
      :value="String(current)"
      :style="inputStyle"
      :disabled="disabled"
      :readonly="disableInput"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />

    <!-- Plus button -->
    <view
      v-if="showPlus"
      :style="buttonStyle"
      :class="bem('plus', { disabled: plusDisabled })"
      @tap="onPlusTap"
      @touchstart="() => onTouchStart('plus')"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <!-- Horizontal line -->
      <view :class="`${bem('icon-line')} ${bem('icon-line', ['h'])}`" />
      <!-- Vertical line (plus icon) -->
      <view :class="`${bem('icon-line')} ${bem('icon-line', ['v'])}`" />
    </view>
  </view>
</template>
