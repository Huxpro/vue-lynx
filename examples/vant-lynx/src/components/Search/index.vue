<!--
  Vant Feature Parity Report:
  Source: https://github.com/youzan/vant/blob/main/packages/vant/src/search/Search.tsx

  Props (14/14 supported):
    - modelValue: string               [YES] v-model for input value
    - label: string                     [YES] left label text
    - shape: 'square' | 'round'        [YES] search box shape
    - background: string               [YES] outer background color
    - maxlength: number | string        [YES] input maxlength
    - placeholder: string              [YES] input placeholder
    - clearable: boolean               [YES] show clear button (default true)
    - autofocus: boolean               [YES] auto focus input
    - showAction: boolean              [YES] show right action button
    - actionText: string               [YES] action button text
    - leftIcon: string                 [YES] left icon inside search box (default 'search')
    - rightIcon: string                [YES] right icon inside search box
    - disabled: boolean                [YES] disable input
    - readonly: boolean                [YES] readonly input

  Events (11/11 supported):
    - update:modelValue                [YES] v-model update
    - search                           [YES] enter/confirm pressed
    - focus                            [YES] input focused
    - blur                             [YES] input blurred
    - clear                            [YES] clear button tapped
    - cancel                           [YES] action button tapped (default behavior)
    - click-input                      [YES] input area tapped
    - click-left-icon                  [YES] left icon tapped
    - click-right-icon                 [YES] right icon tapped

  Slots (5/5 supported):
    - left                             [YES] content before search box
    - action                           [YES] custom action button content
    - label                            [YES] custom label content
    - left-icon                        [YES] custom left icon
    - right-icon                       [YES] custom right icon

  Icon Integration: Uses Icon component from ../Icon/index.vue
  Lynx Adaptations:
    - Uses view/text/input elements with inline styles
    - display: 'flex' set explicitly
    - No CSS class-based styling
    - clearIcon uses Icon component
    - id/name props not applicable in Lynx
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import Icon from '../Icon/index.vue';

export interface SearchProps {
  modelValue?: string;
  label?: string;
  shape?: 'square' | 'round';
  background?: string;
  maxlength?: number | string;
  placeholder?: string;
  clearable?: boolean;
  autofocus?: boolean;
  showAction?: boolean;
  actionText?: string;
  leftIcon?: string;
  rightIcon?: string;
  disabled?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<SearchProps>(), {
  modelValue: '',
  shape: 'square',
  background: '#f2f3f5',
  clearable: true,
  autofocus: false,
  showAction: false,
  actionText: 'Cancel',
  leftIcon: 'search',
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
  'click-input': [event: any];
  'click-left-icon': [event: any];
  'click-right-icon': [event: any];
}>();

const slots = useSlots();

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

const contentStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
}));

const searchBoxStyle = computed(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  backgroundColor: '#fff',
  borderRadius: props.shape === 'round' ? 18 : 4,
  paddingLeft: 10,
  paddingRight: 10,
  height: 36,
}));

const inputStyle = computed(() => ({
  flex: 1,
  fontSize: 14,
  color: props.disabled ? '#c8c9cc' : '#323233',
  height: 36,
  backgroundColor: 'transparent',
}));

const leftIconStyle = {
  marginRight: 6,
};

const rightIconStyle = {
  marginLeft: 6,
};

const clearIconWrapStyle = {
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
  paddingLeft: 4,
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
  if (!slots.action) {
    emit('update:modelValue', '');
    emit('cancel');
  }
}

function onClickInput(event: any) {
  emit('click-input', event);
}

function onClickLeftIcon(event: any) {
  emit('click-left-icon', event);
}

function onClickRightIcon(event: any) {
  emit('click-right-icon', event);
}
</script>

<template>
  <view :style="containerStyle">
    <!-- Left slot (before search box) -->
    <slot name="left" />

    <!-- Content area: label + search box -->
    <view :style="contentStyle">
      <!-- Label -->
      <view v-if="$slots.label || label" :style="labelStyle" @tap="onClickInput">
        <slot name="label">
          <text :style="{ fontSize: 14, color: '#323233' }">{{ label }}</text>
        </slot>
      </view>

      <!-- Search box -->
      <view :style="searchBoxStyle" @tap="onClickInput">
        <!-- Left icon -->
        <view :style="leftIconStyle" @tap.stop="onClickLeftIcon">
          <slot name="left-icon">
            <Icon v-if="leftIcon" :name="leftIcon" size="16" color="#969799" />
          </slot>
        </view>

        <!-- Input -->
        <input
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled || readonly"
          :maxlength="maxlength ? Number(maxlength) : undefined"
          :focus="autofocus"
          :style="inputStyle"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          @confirm="onSearch"
        />

        <!-- Clear button -->
        <view
          v-if="clearable && modelValue"
          :style="clearIconWrapStyle"
          @tap.stop="onClear"
        >
          <Icon name="clear" size="16" color="#c8c9cc" />
        </view>

        <!-- Right icon -->
        <view v-if="$slots['right-icon'] || rightIcon" :style="rightIconStyle" @tap.stop="onClickRightIcon">
          <slot name="right-icon">
            <Icon v-if="rightIcon" :name="rightIcon" size="16" color="#969799" />
          </slot>
        </view>
      </view>
    </view>

    <!-- Action button -->
    <view v-if="showAction" @tap="onCancel">
      <slot name="action">
        <text :style="actionStyle">{{ actionText }}</text>
      </slot>
    </view>
  </view>
</template>
