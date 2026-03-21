<!--
  Vant Feature Parity Report:
  - Props: 18/35+ supported (modelValue, type, label, placeholder, disabled, readonly,
    clearable, maxlength, error, required, border, leftIcon, rightIcon, errorMessage,
    inputAlign, labelWidth, labelAlign, colon, showWordLimit, clearIcon)
  - Events: 7/10 (update:modelValue, input, change, focus, blur, clear, click-input;
    missing: clickLeftIcon, clickRightIcon, keypress)
  - Slots: 6/10 (label, input, left-icon, right-icon, button, extra;
    missing: error-message, word-limit)
  - Gaps:
    - No form validation (rules, validate methods)
    - No autosize textarea
    - No formatter/formatTrigger
    - No clearTrigger (always shows when value present)
    - No autocomplete/inputmode/enterkeyhint
-->
<script setup lang="ts">
import { computed, ref } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface FieldProps {
  modelValue?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  clearIcon?: string;
  maxlength?: number;
  error?: boolean;
  errorMessage?: string;
  required?: boolean;
  border?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  inputAlign?: 'left' | 'center' | 'right';
  labelWidth?: string | number;
  labelAlign?: 'left' | 'center' | 'right' | 'top';
  colon?: boolean;
  showWordLimit?: boolean;
}

const props = withDefaults(defineProps<FieldProps>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  readonly: false,
  clearable: false,
  clearIcon: 'clear',
  error: false,
  required: false,
  border: true,
  inputAlign: 'left',
  colon: false,
  showWordLimit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  input: [value: string];
  change: [value: string];
  focus: [event: any];
  blur: [event: any];
  clear: [];
  'click-input': [event: any];
}>();

const focused = ref(false);

const isTopLabel = computed(() => props.labelAlign === 'top');

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: isTopLabel.value ? ('column' as const) : ('row' as const),
  alignItems: isTopLabel.value ? 'flex-start' : 'center',
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: props.border ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

const resolvedLabelWidth = computed(() => {
  if (props.labelWidth) {
    return typeof props.labelWidth === 'number' ? props.labelWidth : parseInt(props.labelWidth, 10) || 88;
  }
  return 88;
});

const labelStyle = computed(() => ({
  fontSize: 14,
  color: '#323233',
  width: isTopLabel.value ? undefined : resolvedLabelWidth.value,
  marginRight: isTopLabel.value ? 0 : 12,
  marginBottom: isTopLabel.value ? 8 : 0,
  textAlign: (props.labelAlign === 'top' ? 'left' : props.labelAlign || 'left') as 'left' | 'center' | 'right',
}));

const inputStyle = computed(() => ({
  flex: 1,
  fontSize: 14,
  color: props.disabled ? '#c8c9cc' : (props.error ? '#ee0a24' : '#323233'),
  height: 24,
  textAlign: props.inputAlign,
}));

const wordCount = computed(() => {
  return (props.modelValue || '').length;
});

function onInput(event: any) {
  const value = event?.detail?.value ?? event?.target?.value ?? '';
  emit('update:modelValue', value);
  emit('input', value);
}

function onFocus(event: any) {
  focused.value = true;
  emit('focus', event);
}

function onBlur(event: any) {
  focused.value = false;
  emit('blur', event);
  emit('change', props.modelValue);
}

function onClear() {
  emit('update:modelValue', '');
  emit('clear');
}

function onClickInput(event: any) {
  emit('click-input', event);
}
</script>

<template>
  <view :style="containerStyle">
    <!-- Label row -->
    <view v-if="label || required || $slots.label || $slots['left-icon'] || leftIcon" :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: isTopLabel ? undefined : resolvedLabelWidth, marginRight: isTopLabel ? 0 : 12 }">
      <slot name="left-icon">
        <Icon v-if="leftIcon" :name="leftIcon" :size="16" color="#323233" :style="{ marginRight: 4 }" />
      </slot>
      <text v-if="required" :style="{ color: '#ee0a24', fontSize: 14, marginRight: 2 }">*</text>
      <slot name="label">
        <text v-if="label" :style="labelStyle">{{ label }}{{ colon ? ':' : '' }}</text>
      </slot>
    </view>

    <!-- Input area -->
    <view :style="{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center' }">
      <slot name="input">
        <input
          :value="modelValue"
          :type="type"
          :placeholder="placeholder"
          :disabled="disabled"
          :maxlength="maxlength"
          :style="inputStyle"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @tap="onClickInput"
        />
      </slot>

      <!-- Clear icon -->
      <view v-if="clearable && modelValue" :style="{ marginLeft: 8, padding: 4 }" @tap="onClear">
        <Icon :name="clearIcon" :size="16" color="#c8c9cc" />
      </view>

      <!-- Right icon -->
      <slot name="right-icon">
        <Icon v-if="rightIcon" :name="rightIcon" :size="16" color="#969799" :style="{ marginLeft: 8 }" />
      </slot>

      <!-- Button slot -->
      <slot name="button" />
    </view>

    <!-- Error message -->
    <text v-if="errorMessage" :style="{ fontSize: 12, color: '#ee0a24', marginTop: 4, width: '100%' }">{{ errorMessage }}</text>

    <!-- Word limit -->
    <text v-if="showWordLimit && maxlength" :style="{ fontSize: 12, color: '#969799', textAlign: 'right', marginTop: 4, width: '100%' }">{{ wordCount }}/{{ maxlength }}</text>

    <!-- Extra slot -->
    <slot name="extra" />
  </view>
</template>
