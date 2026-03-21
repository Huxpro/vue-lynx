<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface SearchProps {
  modelValue?: string;
  label?: string;
  shape?: 'square' | 'round';
  background?: string;
  placeholder?: string;
  clearable?: boolean;
  showAction?: boolean;
  actionText?: string;
  disabled?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<SearchProps>(), {
  modelValue: '',
  shape: 'square',
  background: '#f2f3f5',
  clearable: true,
  showAction: false,
  actionText: 'Cancel',
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [value: string];
  focus: [event: any];
  blur: [event: any];
  clear: [];
  cancel: [];
}>();

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  backgroundColor: props.background,
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 12,
  paddingRight: 12,
}));

const searchBoxStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: props.shape === 'round' ? 18 : 4,
  paddingLeft: 8,
  paddingRight: 8,
  height: 36,
}));

const inputStyle = computed(() => ({
  flex: 1,
  fontSize: 14,
  color: props.disabled ? '#c8c9cc' : '#323233',
  height: 36,
}));

const iconStyle = {
  fontSize: 14,
  color: '#969799',
  marginRight: 6,
};

const clearStyle = {
  fontSize: 16,
  color: '#c8c9cc',
  marginLeft: 4,
  padding: 2,
};

const actionStyle = {
  fontSize: 14,
  color: '#323233',
  marginLeft: 12,
  paddingTop: 4,
  paddingBottom: 4,
};

const labelStyle = {
  fontSize: 14,
  color: '#323233',
  marginRight: 8,
};

function onInput(event: any) {
  const value = event?.detail?.value ?? event?.target?.value ?? '';
  emit('update:modelValue', value);
}

function onFocus(event: any) {
  emit('focus', event);
}

function onBlur(event: any) {
  emit('blur', event);
}

function onClear() {
  emit('update:modelValue', '');
  emit('clear');
}

function onSearch() {
  emit('search', props.modelValue);
}

function onCancel() {
  emit('update:modelValue', '');
  emit('cancel');
}
</script>

<template>
  <view :style="containerStyle">
    <!-- Label -->
    <text v-if="label" :style="labelStyle">{{ label }}</text>

    <!-- Search box -->
    <view :style="searchBoxStyle">
      <!-- Search icon -->
      <text :style="iconStyle">&#9740;</text>

      <!-- Input -->
      <input
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled || readonly"
        :style="inputStyle"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @confirm="onSearch"
      />

      <!-- Clear button -->
      <text
        v-if="clearable && modelValue"
        :style="clearStyle"
        @tap="onClear"
      >&times;</text>
    </view>

    <!-- Action button -->
    <text
      v-if="showAction"
      :style="actionStyle"
      @tap="onCancel"
    >{{ actionText }}</text>
  </view>
</template>
