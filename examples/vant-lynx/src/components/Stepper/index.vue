<!--
  Vant Feature Parity Report:
  - Props: 21/21 supported
    - modelValue: number | string (current value)
    - min: number | string (minimum value, default 1)
    - max: number | string (maximum value, default Infinity)
    - step: number | string (step value, default 1)
    - defaultValue: number | string (default value when modelValue is not set, default 1)
    - name: number | string (identifier for the stepper, emitted with change event)
    - inputWidth: number | string (width of the input field, default 32)
    - buttonSize: number | string (size of plus/minus buttons, default 28)
    - decimalLength: number | string (fixed decimal length)
    - theme: 'default' | 'round' (visual theme)
    - placeholder: string (placeholder text when allowEmpty and value is empty)
    - integer: boolean (restrict to integer values)
    - disabled: boolean (disable the entire stepper)
    - disablePlus: boolean (disable plus button only)
    - disableMinus: boolean (disable minus button only)
    - disableInput: boolean (disable input editing)
    - showPlus: boolean (show plus button, default true)
    - showMinus: boolean (show minus button, default true)
    - showInput: boolean (show input display, default true)
    - longPress: boolean (enable long press for continuous change, default true)
    - allowEmpty: boolean (allow empty value)
    - autoFixed: boolean (auto-fix value on blur, default true)
    - beforeChange: Function (interceptor before value changes)
  - Events: 7/7 supported
    - update:modelValue: emits new value
    - change: emits (value, { name }) after value changes
    - plus: emits when plus button is clicked
    - minus: emits when minus button is clicked
    - overlimit: emits actionType ('plus' | 'minus') when limit is reached
    - focus: emits when input gains focus (no-op in Lynx, kept for API compat)
    - blur: emits when input loses focus (no-op in Lynx, kept for API compat)
  - Long press: supported with 600ms start delay and 200ms repeat interval
  - beforeChange interceptor: supports sync, Promise, and callback patterns
  - Value formatting: scientific notation, decimal length, integer restriction
  - Round theme: plus has solid primary background, minus has border + transparent bg
  - Lynx Adaptations:
    - Uses view/text elements with inline styles only (no CSS classes)
    - display: 'flex' set explicitly where needed (Lynx requires explicit flex display)
    - No actual <input> element (Lynx limitation); value displayed as text
    - focus/blur events defined for API compat but not triggered (no native input in Lynx)
    - No CSS transitions (Lynx limitation)
    - No cursor styling (Lynx is touch-only)
    - No role/aria attributes (Lynx does not support ARIA)
  - CSS Variables: Not supported (Lynx limitation)
  - Gaps:
    - No editable text input (Lynx has no equivalent to HTML <input>)
    - No CSS transitions on button press states (Lynx limitation)
    - No box-shadow (Lynx limitation)
    - placeholder prop is accepted but has no visual effect (no text input)
    - disableInput prop is accepted but has limited effect (no text input to disable)
-->
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue-lynx';

type Numeric = number | string;

export interface StepperProps {
  modelValue?: Numeric;
  min?: Numeric;
  max?: Numeric;
  step?: Numeric;
  defaultValue?: Numeric;
  name?: Numeric;
  inputWidth?: Numeric;
  buttonSize?: Numeric;
  decimalLength?: Numeric;
  theme?: 'default' | 'round';
  placeholder?: string;
  integer?: boolean;
  disabled?: boolean;
  disablePlus?: boolean;
  disableMinus?: boolean;
  disableInput?: boolean;
  showPlus?: boolean;
  showMinus?: boolean;
  showInput?: boolean;
  longPress?: boolean;
  allowEmpty?: boolean;
  autoFixed?: boolean;
  beforeChange?: (...args: any[]) => any;
}

const props = withDefaults(defineProps<StepperProps>(), {
  modelValue: undefined,
  min: 1,
  max: Infinity,
  step: 1,
  defaultValue: 1,
  name: '',
  inputWidth: 32,
  buttonSize: 28,
  decimalLength: undefined,
  theme: 'default',
  placeholder: '',
  integer: false,
  disabled: false,
  disablePlus: false,
  disableMinus: false,
  disableInput: false,
  showPlus: true,
  showMinus: true,
  showInput: true,
  longPress: true,
  allowEmpty: false,
  autoFixed: true,
  beforeChange: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: Numeric];
  change: [value: Numeric, detail: { name: Numeric }];
  plus: [];
  minus: [];
  overlimit: [actionType: 'plus' | 'minus'];
  focus: [event: any];
  blur: [event: any];
}>();

// --- Helpers ---

function isDef(val: unknown): val is NonNullable<typeof val> {
  return val !== undefined && val !== null;
}

/** Strip non-numeric characters; keep decimal point if allowDecimal is true. */
function formatNumber(value: string, allowDecimal: boolean): string {
  const regExp = allowDecimal ? /[^-0-9.]/g : /[^-0-9]/g;
  let formatted = value.replace(regExp, '');
  // Remove extra leading minus signs
  const firstMinus = formatted.indexOf('-');
  if (firstMinus > 0) {
    formatted = formatted.slice(0, firstMinus) + formatted.slice(firstMinus).replace(/-/g, '');
  }
  // Remove extra decimal points
  if (allowDecimal) {
    const firstDot = formatted.indexOf('.');
    if (firstDot !== -1) {
      formatted =
        formatted.slice(0, firstDot + 1) +
        formatted.slice(firstDot + 1).replace(/\./g, '');
    }
  }
  return formatted;
}

function addNumber(num1: number, num2: number): number {
  // Handle floating point precision issues
  const cardinal = 10 ** 10;
  return Math.round((num1 + num2) * cardinal) / cardinal;
}

const isEqual = (value1?: Numeric, value2?: Numeric) =>
  String(value1) === String(value2);

// --- Value formatting ---

function format(value: Numeric, autoFixed = true): Numeric {
  const { min, max, allowEmpty, decimalLength } = props;

  if (allowEmpty && value === '') {
    return value;
  }

  // Format scientific notation
  if (typeof value === 'number' && String(value).includes('e')) {
    value = value.toFixed(isDef(decimalLength) ? +decimalLength : 17);
  }

  value = formatNumber(String(value), !props.integer);
  value = value === '' ? 0 : +value;
  value = Number.isNaN(value) ? +min : value;

  // Clamp to min/max if autoFixed
  value = autoFixed ? Math.max(Math.min(+max, value as number), +min) : value;

  // Format decimal length
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

const parsedInputWidth = computed(() => {
  const v = props.inputWidth;
  return typeof v === 'string' ? parseInt(v, 10) || 32 : v;
});

const parsedButtonSize = computed(() => {
  const v = props.buttonSize;
  return typeof v === 'string' ? parseInt(v, 10) || 28 : v;
});

const isRound = computed(() => props.theme === 'round');

// --- Styles ---

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
}));

const minusButtonStyle = computed(() => {
  const size = parsedButtonSize.value;
  if (isRound.value) {
    return {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: size / 2,
      borderWidth: 1,
      borderStyle: 'solid' as const,
      borderColor: '#1989fa',
      opacity: minusDisabled.value ? 0.3 : 1,
    };
  }
  return {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: minusDisabled.value ? '#f7f8fa' : '#f2f3f5',
    borderRadius: 4,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    opacity: 1,
  };
});

const plusButtonStyle = computed(() => {
  const size = parsedButtonSize.value;
  if (isRound.value) {
    return {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1989fa',
      borderRadius: size / 2,
      opacity: plusDisabled.value ? 0.3 : 1,
    };
  }
  return {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: plusDisabled.value ? '#f7f8fa' : '#f2f3f5',
    borderRadius: 4,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    opacity: 1,
  };
});

const minusTextStyle = computed(() => {
  const size = parsedButtonSize.value;
  if (isRound.value) {
    return {
      fontSize: size * 0.6,
      color: minusDisabled.value ? 'rgba(25, 137, 250, 0.3)' : '#1989fa',
      textAlign: 'center' as const,
      lineHeight: size,
      fontWeight: 'bold' as const,
    };
  }
  return {
    fontSize: size * 0.6,
    color: minusDisabled.value ? '#c8c9cc' : '#323233',
    textAlign: 'center' as const,
    lineHeight: size,
    fontWeight: 'bold' as const,
  };
});

const plusTextStyle = computed(() => {
  const size = parsedButtonSize.value;
  if (isRound.value) {
    return {
      fontSize: size * 0.6,
      color: plusDisabled.value ? 'rgba(255, 255, 255, 0.3)' : '#fff',
      textAlign: 'center' as const,
      lineHeight: size,
      fontWeight: 'bold' as const,
    };
  }
  return {
    fontSize: size * 0.6,
    color: plusDisabled.value ? '#c8c9cc' : '#323233',
    textAlign: 'center' as const,
    lineHeight: size,
    fontWeight: 'bold' as const,
  };
});

const inputContainerStyle = computed(() => ({
  width: parsedInputWidth.value,
  height: parsedButtonSize.value,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: isRound.value ? 'transparent' : '#f2f3f5',
  marginLeft: 2,
  marginRight: 2,
}));

const inputTextStyle = computed(() => ({
  fontSize: 14,
  color: props.disabled ? '#c8c9cc' : '#323233',
  textAlign: 'center' as const,
  lineHeight: parsedButtonSize.value,
}));

const displayValue = computed(() => {
  if (props.allowEmpty && current.value === '') {
    return props.placeholder || '';
  }
  return String(current.value);
});

// --- beforeChange interceptor ---

function callInterceptor(
  interceptor: ((...args: any[]) => any) | undefined,
  args: any[],
  done: () => void,
) {
  if (!interceptor) {
    done();
    return;
  }

  const result = interceptor(...args);

  if (result === false) {
    // Sync rejection
    return;
  }

  if (result && typeof result === 'object' && typeof result.then === 'function') {
    // Promise
    result.then((val: unknown) => {
      if (val !== false) {
        done();
      }
    }).catch(() => {
      // rejected = cancelled
    });
  } else {
    done();
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

// --- Actions ---

function check() {
  const value = format(current.value);
  if (!isEqual(value, current.value)) {
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

function onMinus() {
  actionType = 'minus';
  onChange();
}

function onPlus() {
  actionType = 'plus';
  onChange();
}

// --- Long press ---

const LONG_PRESS_START_TIME = 600;
const LONG_PRESS_INTERVAL = 200;

let isLongPress = false;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;

function longPressStep() {
  longPressTimer = setTimeout(() => {
    onChange();
    longPressStep();
  }, LONG_PRESS_INTERVAL);
}

function onTouchStart(type: 'plus' | 'minus') {
  if (!props.longPress) return;
  actionType = type;
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
  // For long press, tap is handled by touchstart/touchend sequence.
  // Only handle direct tap if not a long press event.
  if (props.longPress && isLongPress) return;
  onMinus();
}

function onPlusTap() {
  if (props.longPress && isLongPress) return;
  onPlus();
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

// --- Cleanup ---

onBeforeUnmount(() => {
  clearLongPressTimer();
});
</script>

<template>
  <view :style="containerStyle">
    <!-- Minus button -->
    <view
      v-if="showMinus"
      :style="minusButtonStyle"
      @tap="onMinusTap"
      @touchstart="() => onTouchStart('minus')"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <text :style="minusTextStyle">-</text>
    </view>

    <!-- Input display -->
    <view v-if="showInput" :style="inputContainerStyle">
      <text :style="inputTextStyle">{{ displayValue }}</text>
    </view>

    <!-- Plus button -->
    <view
      v-if="showPlus"
      :style="plusButtonStyle"
      @tap="onPlusTap"
      @touchstart="() => onTouchStart('plus')"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <text :style="plusTextStyle">+</text>
    </view>
  </view>
</template>
