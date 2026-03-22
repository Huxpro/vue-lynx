<!--
  Lynx Limitations:
  - autosize: Lynx has no scrollHeight API, so textarea auto-resize is not supported
  - id/for: Lynx has no HTML label-for binding; id prop accepted for API compat
  - autocomplete/autocapitalize/autocorrect/spellcheck: Not applicable in Lynx native input
  - enterkeyhint: Not applicable in Lynx native input
  - inputmode: Not applicable in Lynx native input
  - IME composition: No compositionstart/compositionend in Lynx
  - cursor position correction: No selectionStart/selectionEnd APIs in Lynx
  - ::before required mark: Uses <text> element instead of CSS pseudo-element
  - resetScroll: No window.scrollTo in Lynx
  - label for click-to-focus: No label element in Lynx
-->
<script setup lang="ts">
import { computed, ref, reactive, watch, onMounted, nextTick, provide } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { addUnit, isDef } from '../../utils/format';
import Icon from '../Icon/index.vue';
import Cell from '../Cell/index.vue';
import type {
  FieldType,
  FieldTextAlign,
  FieldClearTrigger,
  FieldFormatTrigger,
  FieldValidateTrigger,
  FieldRule,
  FieldAutosizeConfig,
  FieldValidationStatus,
  FieldValidateError,
  FieldExpose,
  FieldEnterKeyHint,
} from './types';
import {
  isEmptyValue,
  runSyncRule,
  runRuleValidator,
  getRuleMessage,
  getStringLength,
  cutString,
  formatNumber,
  clamp,
  toArray,
} from './utils';
import './index.less';

export interface FieldProps {
  // Cell shared props
  size?: 'normal' | 'large';
  center?: boolean;
  border?: boolean;
  isLink?: boolean;
  clickable?: boolean | null;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  iconPrefix?: string;
  // Cell label prop reused as field label
  label?: string | number;
  // Field shared props
  id?: string;
  name?: string;
  leftIcon?: string;
  rightIcon?: string;
  autofocus?: boolean;
  clearable?: boolean;
  maxlength?: number | string;
  max?: number;
  min?: number;
  formatter?: (value: string) => string;
  clearIcon?: string;
  modelValue?: string | number;
  inputAlign?: FieldTextAlign;
  placeholder?: string;
  autocomplete?: string;
  autocapitalize?: string;
  autocorrect?: string;
  errorMessage?: string;
  enterkeyhint?: FieldEnterKeyHint;
  clearTrigger?: FieldClearTrigger;
  formatTrigger?: FieldFormatTrigger;
  spellcheck?: boolean | null;
  error?: boolean | null;
  disabled?: boolean | null;
  readonly?: boolean | null;
  inputmode?: string;
  // Field-only props
  rows?: number | string;
  type?: FieldType;
  rules?: FieldRule[];
  autosize?: boolean | FieldAutosizeConfig;
  labelWidth?: number | string;
  labelClass?: unknown;
  labelAlign?: FieldTextAlign;
  showWordLimit?: boolean;
  errorMessageAlign?: FieldTextAlign;
  colon?: boolean | null;
  required?: boolean | 'auto' | null;
}

const props = withDefaults(defineProps<FieldProps>(), {
  type: 'text',
  modelValue: '',
  clearIcon: 'clear',
  clearTrigger: 'focus',
  formatTrigger: 'onChange',
  border: true,
  clickable: null,
  spellcheck: null,
  error: null,
  disabled: null,
  readonly: null,
  colon: null,
  required: null,
});

const emit = defineEmits<{
  blur: [event: any];
  focus: [event: any];
  clear: [event: any];
  keypress: [event: any];
  clickInput: [event: any];
  endValidate: [result: { status: FieldValidationStatus; message: string }];
  startValidate: [];
  clickLeftIcon: [event: any];
  clickRightIcon: [event: any];
  'update:modelValue': [value: string];
}>();

const slots = defineSlots<{
  default?: () => any;
  label?: () => any;
  input?: () => any;
  'left-icon'?: () => any;
  'right-icon'?: () => any;
  button?: () => any;
  extra?: () => any;
  'error-message'?: (props: { message: string }) => any;
  'word-limit'?: () => any;
}>();

const [, bem] = createNamespace('field');

const state = reactive({
  status: 'unvalidated' as FieldValidationStatus,
  focused: false,
  validateMessage: '',
});

const inputRef = ref<any>(null);

const getModelValue = () => String(props.modelValue ?? '');

// Get prop value, with form-level fallback in the future
const getProp = (key: string) => {
  const val = (props as any)[key];
  if (isDef(val)) {
    return val;
  }
  return undefined;
};

const showClear = computed(() => {
  const readonly = getProp('readonly');
  if (props.clearable && !readonly) {
    const hasValue = getModelValue() !== '';
    const trigger =
      props.clearTrigger === 'always' ||
      (props.clearTrigger === 'focus' && state.focused);
    return hasValue && trigger;
  }
  return false;
});

const formValue = computed(() => {
  return props.modelValue;
});

const showRequiredMark = computed(() => {
  const required = getProp('required');
  if (required === 'auto') {
    return props.rules?.some((rule: FieldRule) => rule.required);
  }
  return required;
});

const showError = computed(() => {
  if (typeof props.error === 'boolean') {
    return props.error;
  }
  if (state.status === 'failed') {
    return true;
  }
  return false;
});

const labelStyle = computed(() => {
  const labelWidth = getProp('labelWidth');
  const labelAlign = getProp('labelAlign');
  if (labelWidth && labelAlign !== 'top') {
    return { width: addUnit(labelWidth) };
  }
  return undefined;
});

// Validation
const runRules = (rules: FieldRule[]) =>
  rules.reduce(
    (promise, rule) =>
      promise.then(() => {
        if (state.status === 'failed') {
          return;
        }

        let { value } = formValue;

        if (rule.formatter) {
          value = rule.formatter(value, rule);
        }

        if (!runSyncRule(value, rule)) {
          state.status = 'failed';
          state.validateMessage = getRuleMessage(value, rule);
          return;
        }

        if (rule.validator) {
          if (isEmptyValue(value) && rule.validateEmpty === false) {
            return;
          }

          return runRuleValidator(value, rule).then((result) => {
            if (result && typeof result === 'string') {
              state.status = 'failed';
              state.validateMessage = result;
            } else if (result === false) {
              state.status = 'failed';
              state.validateMessage = getRuleMessage(value, rule);
            }
          });
        }
      }),
    Promise.resolve(),
  );

const resetValidation = () => {
  state.status = 'unvalidated';
  state.validateMessage = '';
};

const endValidate = () =>
  emit('endValidate', {
    status: state.status,
    message: state.validateMessage,
  });

const validate = (rules = props.rules) =>
  new Promise<FieldValidateError | void>((resolve) => {
    resetValidation();
    if (rules) {
      emit('startValidate');
      runRules(rules).then(() => {
        if (state.status === 'failed') {
          resolve({
            name: props.name,
            message: state.validateMessage,
          });
          endValidate();
        } else {
          state.status = 'passed';
          resolve();
          endValidate();
        }
      });
    } else {
      resolve();
    }
  });

const validateWithTrigger = (trigger: FieldValidateTrigger) => {
  if (props.rules) {
    const rules = props.rules.filter((rule) => {
      if (rule.trigger) {
        return toArray(rule.trigger).includes(trigger);
      }
      return true;
    });

    if (rules.length) {
      validate(rules);
    }
  }
};

const limitValueLength = (value: string) => {
  const { maxlength } = props;
  if (isDef(maxlength) && getStringLength(value) > +maxlength) {
    const modelValue = getModelValue();
    if (modelValue && getStringLength(modelValue) === +maxlength) {
      return modelValue;
    }
    return cutString(value, +maxlength);
  }
  return value;
};

const updateValue = (
  value: string,
  trigger: FieldFormatTrigger = 'onChange',
) => {
  value = limitValueLength(value);

  if (props.type === 'number' || props.type === 'digit') {
    const isNumber = props.type === 'number';
    value = formatNumber(value, isNumber, isNumber);

    if (
      trigger === 'onBlur' &&
      value !== '' &&
      (props.min !== undefined || props.max !== undefined)
    ) {
      const adjustedValue = clamp(
        +value,
        props.min ?? -Infinity,
        props.max ?? Infinity,
      );

      if (+value !== adjustedValue) {
        value = adjustedValue.toString();
      }
    }
  }

  if (props.formatter && trigger === props.formatTrigger) {
    const { formatter, maxlength } = props;
    value = formatter(value);
    if (isDef(maxlength) && getStringLength(value) > +maxlength) {
      value = cutString(value, +maxlength);
    }
  }

  if (value !== String(props.modelValue ?? '')) {
    emit('update:modelValue', value);
  }
};

const blur = () => {
  // Lynx input blur not directly available via ref
};

const focus = () => {
  // Lynx input focus not directly available via ref
};

const onInput = (event: any) => {
  const value = event?.detail?.value ?? event?.target?.value ?? '';
  updateValue(value);
};

const onFocus = (event: any) => {
  state.focused = true;
  emit('focus', event);
};

const onBlur = (event: any) => {
  state.focused = false;
  updateValue(getModelValue(), 'onBlur');
  emit('blur', event);

  if (getProp('readonly')) {
    return;
  }

  validateWithTrigger('onBlur');
};

const onClickInput = (event: any) => emit('clickInput', event);
const onClickLeftIcon = (event: any) => emit('clickLeftIcon', event);
const onClickRightIcon = (event: any) => emit('clickRightIcon', event);

const onClear = (event: any) => {
  emit('update:modelValue', '');
  emit('clear', event);
};

const getValidationStatus = () => state.status;

// Watch modelValue changes
watch(
  () => props.modelValue,
  () => {
    updateValue(getModelValue());
    resetValidation();
    validateWithTrigger('onChange');
  },
);

onMounted(() => {
  updateValue(getModelValue(), props.formatTrigger);
});

defineExpose<FieldExpose>({
  blur,
  focus,
  validate,
  formValue,
  resetValidation,
  getValidationStatus,
});

// Provide for custom field injection (Form integration)
provide('CUSTOM_FIELD_INJECTION_KEY', {
  resetValidation,
  validateWithTrigger,
});

const controlClass = computed(() => {
  return bem('control', [
    getProp('inputAlign'),
    {
      error: showError.value,
      custom: !!slots.input,
      'min-height': props.type === 'textarea' && !props.autosize,
      disabled: !!getProp('disabled'),
    },
  ]);
});

const fieldClass = computed(() => {
  const disabled = getProp('disabled');
  const labelAlign = getProp('labelAlign');
  return bem([
    {
      error: showError.value,
      disabled: !!disabled,
    },
    labelAlign ? `label-${labelAlign}` : '',
  ].filter(Boolean) as any);
});

const labelClasses = computed(() => {
  const labelAlign = getProp('labelAlign');
  return [
    bem('label', [
      labelAlign,
      { required: !!showRequiredMark.value },
    ]),
    props.labelClass,
  ];
});
</script>

<template>
  <Cell
    :size="size"
    :class="fieldClass"
    :center="center"
    :border="border"
    :is-link="isLink"
    :clickable="clickable"
    :title-style="labelStyle"
    :value-class="bem('value')"
    :title-class="labelClasses"
    :arrow-direction="arrowDirection"
    :required="null"
  >
    <!-- Cell icon slot: left icon (when not label-top) -->
    <template v-if="(leftIcon || $slots['left-icon']) && labelAlign !== 'top'" #icon>
      <view :class="bem('left-icon')" @tap="onClickLeftIcon">
        <slot name="left-icon">
          <Icon v-if="leftIcon" :name="leftIcon" :class-prefix="iconPrefix" />
        </slot>
      </view>
    </template>

    <!-- Cell title slot: label -->
    <template #title>
      <!-- Left icon inside label when label-align is top -->
      <view v-if="(leftIcon || $slots['left-icon']) && labelAlign === 'top'" :class="bem('left-icon')" @tap="onClickLeftIcon">
        <slot name="left-icon">
          <Icon v-if="leftIcon" :name="leftIcon" :class-prefix="iconPrefix" />
        </slot>
      </view>
      <!-- Required mark (replaces ::before pseudo-element) -->
      <text v-if="showRequiredMark" :class="bem('required-mark')">*</text>
      <slot name="label">
        <text v-if="label">{{ label }}{{ getProp('colon') ? ':' : '' }}</text>
      </slot>
    </template>

    <!-- Cell value slot: field body -->
    <template #value>
      <view :class="bem('body')">
        <!-- Input slot or actual input -->
        <slot name="input">
          <textarea
            v-if="type === 'textarea'"
            ref="inputRef"
            :value="getModelValue()"
            :class="controlClass"
            :placeholder="placeholder"
            :disabled="!!getProp('disabled')"
            :readonly="!!getProp('readonly')"
            :maxlength="maxlength ? +maxlength : undefined"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
            @tap="onClickInput"
          />
          <input
            v-else
            ref="inputRef"
            :value="getModelValue()"
            :type="type === 'digit' ? 'number' : type === 'number' ? 'text' : type"
            :class="controlClass"
            :placeholder="placeholder"
            :disabled="!!getProp('disabled')"
            :readonly="!!getProp('readonly')"
            :maxlength="maxlength ? +maxlength : undefined"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
            @tap="onClickInput"
          />
        </slot>

        <!-- Clear icon -->
        <view v-if="showClear" :class="bem('clear')" @tap="onClear">
          <Icon :name="clearIcon" />
        </view>

        <!-- Right icon -->
        <view v-if="rightIcon || $slots['right-icon']" :class="bem('right-icon')" @tap="onClickRightIcon">
          <slot name="right-icon">
            <Icon v-if="rightIcon" :name="rightIcon" :class-prefix="iconPrefix" />
          </slot>
        </view>

        <!-- Button slot -->
        <view v-if="$slots.button" :class="bem('button')">
          <slot name="button" />
        </view>
      </view>

      <!-- Word limit -->
      <slot name="word-limit">
        <view v-if="showWordLimit && maxlength" :class="bem('word-limit')">
          <text :class="bem('word-num')">{{ getStringLength(getModelValue()) }}</text>
          <text>/{{ maxlength }}</text>
        </view>
      </slot>

      <!-- Error message -->
      <slot name="error-message" :message="errorMessage || state.validateMessage">
        <view
          v-if="errorMessage || state.validateMessage"
          :class="bem('error-message', getProp('errorMessageAlign'))"
        >
          <text>{{ errorMessage || state.validateMessage }}</text>
        </view>
      </slot>
    </template>

    <!-- Extra slot -->
    <template v-if="$slots.extra" #extra>
      <slot name="extra" />
    </template>
  </Cell>
</template>
