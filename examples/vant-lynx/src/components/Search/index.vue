<!--
  Lynx Limitations:
  - id/for: Lynx has no HTML label-for binding; id prop accepted for API compat
  - autocomplete: Not applicable in Lynx native input
  - type="search": Lynx input has no search type; uses text type
  - ::-webkit-search-* pseudo-elements: Not applicable in Lynx
  - cursor/user-select: Not applicable in Lynx
  - :active pseudo-class: Lynx has no :active; action tap feedback not available
  - form submission: Lynx has no <form> element; enter key emits search event
-->
<script setup lang="ts">
import { computed, ref, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Field from '../Field/index.vue';
import type { SearchShape } from './types';
import type { FieldTextAlign } from '../Field/types';
import './index.less';

export interface SearchProps {
  modelValue?: string;
  label?: string;
  shape?: SearchShape;
  leftIcon?: string;
  clearable?: boolean;
  actionText?: string;
  background?: string;
  showAction?: boolean;
  // Field shared props passed through
  id?: string;
  name?: string;
  disabled?: boolean | null;
  readonly?: boolean | null;
  placeholder?: string;
  inputAlign?: FieldTextAlign;
  errorMessage?: string;
  maxlength?: number | string;
  autofocus?: boolean;
  clearIcon?: string;
  rightIcon?: string;
  autocomplete?: string;
}

const props = withDefaults(defineProps<SearchProps>(), {
  modelValue: '',
  shape: 'square',
  leftIcon: 'search',
  clearable: true,
  showAction: false,
  disabled: null,
  readonly: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  search: [value: string];
  cancel: [];
  blur: [event: any];
  focus: [event: any];
  clear: [event: any];
  clickInput: [event: any];
  clickLeftIcon: [event: any];
  clickRightIcon: [event: any];
}>();

const slots = useSlots();

const [, bem] = createNamespace('search');

const fieldRef = ref<InstanceType<typeof Field> | null>(null);

const onCancel = () => {
  if (!slots.action) {
    emit('update:modelValue', '');
    emit('cancel');
  }
};

const onSearch = () => {
  emit('search', props.modelValue);
};

const onInput = (value: string) => {
  emit('update:modelValue', value);
};

const onBlur = (event: any) => emit('blur', event);
const onFocus = (event: any) => emit('focus', event);
const onClear = (event: any) => emit('clear', event);
const onClickInput = (event: any) => emit('clickInput', event);
const onClickLeftIcon = (event: any) => emit('clickLeftIcon', event);
const onClickRightIcon = (event: any) => emit('clickRightIcon', event);

const blur = () => fieldRef.value?.blur();
const focus = () => fieldRef.value?.focus();

defineExpose({ focus, blur });

const rootClass = computed(() => {
  return bem([{ 'show-action': props.showAction }]);
});

const contentClass = computed(() => {
  return bem('content', [props.shape]);
});

const fieldClass = computed(() => {
  return bem('field', [{ 'with-message': !!props.errorMessage }]);
});
</script>

<template>
  <view
    :class="rootClass"
    :style="background ? { background } : undefined"
  >
    <!-- Left slot -->
    <slot name="left" />

    <!-- Content area -->
    <view :class="contentClass">
      <!-- Label -->
      <view v-if="$slots.label || label" :class="bem('label')">
        <slot name="label">
          <text>{{ label }}</text>
        </slot>
      </view>

      <!-- Field -->
      <Field
        ref="fieldRef"
        type="search"
        :class="fieldClass"
        :border="false"
        :model-value="modelValue"
        :left-icon="leftIcon"
        :right-icon="rightIcon"
        :clearable="clearable"
        :clear-icon="clearIcon"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :autofocus="autofocus"
        :input-align="inputAlign"
        :error-message="errorMessage"
        label-align="left"
        @update:model-value="onInput"
        @blur="onBlur"
        @focus="onFocus"
        @clear="onClear"
        @click-input="onClickInput"
        @click-left-icon="onClickLeftIcon"
        @click-right-icon="onClickRightIcon"
        @confirm="onSearch"
      >
        <template v-if="$slots['left-icon']" #left-icon>
          <slot name="left-icon" />
        </template>
        <template v-if="$slots['right-icon']" #right-icon>
          <slot name="right-icon" />
        </template>
      </Field>
    </view>

    <!-- Action button -->
    <view v-if="showAction" :class="bem('action')" @tap="onCancel">
      <slot name="action">
        <text>{{ actionText || '取消' }}</text>
      </slot>
    </view>
  </view>
</template>
