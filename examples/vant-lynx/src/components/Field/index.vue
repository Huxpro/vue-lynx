<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface FieldProps {
  modelValue?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  maxlength?: number;
  error?: boolean;
  required?: boolean;
  border?: boolean;
}

const props = withDefaults(defineProps<FieldProps>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  readonly: false,
  clearable: false,
  error: false,
  required: false,
  border: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  input: [value: string];
  change: [value: string];
  focus: [event: any];
  blur: [event: any];
  clear: [];
}>();

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  padding: 10,
  paddingLeft: 16,
  paddingRight: 16,
  backgroundColor: '#fff',
  borderBottomWidth: props.border ? 0.5 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#ebedf0',
}));

const labelStyle = computed(() => ({
  fontSize: 14,
  color: '#323233',
  width: 88,
  marginRight: 12,
}));

const inputStyle = computed(() => ({
  flex: 1,
  fontSize: 14,
  color: props.error ? '#ee0a24' : '#323233',
  height: 24,
}));

function onInput(event: any) {
  const value = event?.detail?.value ?? event?.target?.value ?? '';
  emit('update:modelValue', value);
  emit('input', value);
}

function onFocus(event: any) {
  emit('focus', event);
}

function onBlur(event: any) {
  emit('blur', event);
  emit('change', props.modelValue);
}

function onClear() {
  emit('update:modelValue', '');
  emit('clear');
}
</script>

<template>
  <view :style="containerStyle">
    <view v-if="label || required" :style="{ display: 'flex', flexDirection: 'row' }">
      <text v-if="required" :style="{ color: '#ee0a24', marginRight: 2 }">*</text>
      <text v-if="label" :style="labelStyle">{{ label }}</text>
    </view>

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
    />

    <text
      v-if="clearable && modelValue"
      :style="{ fontSize: 16, color: '#c8c9cc', marginLeft: 8, padding: 4 }"
      @tap="onClear"
    >&times;</text>
  </view>
</template>
