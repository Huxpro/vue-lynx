<!--
  Vant Feature Parity Report:
  - Props: 13/14 supported (price, decimalLength, label, suffixLabel, textAlign,
    buttonText, buttonType, buttonColor, tip, tipIcon, currency, disabled, loading,
    safeAreaInsetBottom)
  - Events: 1/1 supported (submit)
  - Slots: 4/4 supported (default, top, tip, button)
  - Gaps: placeholder prop (renders placeholder element for fixed positioning)
-->
<script setup lang="ts">
/**
 * VantSubmitBar (Lynx port)
 * @see https://github.com/youzan/vant/blob/main/packages/vant/src/submit-bar/SubmitBar.tsx
 *
 * Feature parity: 13/14 props, 1/1 events, 4/4 slots.
 * Missing: placeholder prop (Vant renders a placeholder div for fixed-position bars).
 *
 * Lynx differences:
 *   - Custom button view instead of Vant's Button component
 *   - Tip icon shown as text (Vant uses Icon component)
 *   - Price split into integer + decimal with different font sizes
 *   - No fixed positioning (Lynx handles layout differently)
 */
import { computed } from 'vue-lynx';

export interface SubmitBarProps {
  price?: number;
  decimalLength?: number;
  label?: string;
  suffixLabel?: string;
  textAlign?: 'left' | 'right';
  buttonText?: string;
  buttonType?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  buttonColor?: string;
  tip?: string;
  tipIcon?: string;
  currency?: string;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: boolean;
  safeAreaInsetBottom?: boolean;
}

const props = withDefaults(defineProps<SubmitBarProps>(), {
  decimalLength: 2,
  label: 'Total:',
  textAlign: 'right',
  buttonText: 'Submit',
  buttonType: 'danger',
  currency: '¥',
  disabled: false,
  loading: false,
  safeAreaInsetBottom: true,
});

const emit = defineEmits<{
  submit: [];
}>();

const buttonTypeConfig: Record<string, { bg: string; color: string }> = {
  default: { bg: '#fff', color: '#323233' },
  primary: { bg: '#1989fa', color: '#fff' },
  success: { bg: '#07c160', color: '#fff' },
  warning: { bg: '#ff976a', color: '#fff' },
  danger: { bg: '#ee0a24', color: '#fff' },
};

const priceText = computed(() => {
  if (props.price === undefined || props.price === null) return '';
  const integerPart = Math.floor(props.price / 100);
  const decimalPart = (props.price % 100).toString().padStart(2, '0');
  if (props.decimalLength === 0) {
    return `${props.currency}${integerPart}`;
  }
  return `${props.currency}${integerPart}.${decimalPart.slice(0, props.decimalLength)}`;
});

const priceIntegerPart = computed(() => {
  if (props.price === undefined || props.price === null) return '';
  return `${props.currency}${Math.floor(props.price / 100)}`;
});

const priceDecimalPart = computed(() => {
  if (props.price === undefined || props.price === null) return '';
  if (props.decimalLength === 0) return '';
  const decimalPart = (props.price % 100).toString().padStart(2, '0');
  return `.${decimalPart.slice(0, props.decimalLength)}`;
});

const buttonBg = computed(() => {
  if (props.buttonColor) return props.buttonColor;
  return buttonTypeConfig[props.buttonType]?.bg ?? '#ee0a24';
});

const buttonTextColor = computed(() => {
  if (props.buttonColor) return '#fff';
  return buttonTypeConfig[props.buttonType]?.color ?? '#fff';
});

function onSubmit() {
  if (props.disabled || props.loading) return;
  emit('submit');
}

const barStyle = computed(() => ({
  display: 'flex',
  flexDirection: 'column' as const,
  backgroundColor: '#fff',
  paddingBottom: props.safeAreaInsetBottom ? 16 : 0,
}));

const contentStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: 'center',
  height: 50,
  paddingLeft: 16,
  paddingRight: 16,
};

const buttonStyle = computed(() => ({
  height: 40,
  paddingLeft: 24,
  paddingRight: 24,
  borderRadius: 20,
  backgroundColor: props.disabled ? '#c8c9cc' : buttonBg.value,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: props.loading ? 0.7 : 1,
}));
</script>

<template>
  <view :style="barStyle">
    <!-- Top slot -->
    <slot name="top" />

    <!-- Tip -->
    <view
      v-if="tip || $slots.tip"
      :style="{
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 8,
        backgroundColor: '#fff7cc',
      }"
    >
      <text v-if="tipIcon" :style="{ fontSize: 14, color: '#f56723', marginRight: 4 }">{{ tipIcon }}</text>
      <slot name="tip">
        <text :style="{ fontSize: 12, color: '#f56723' }">{{ tip }}</text>
      </slot>
    </view>

    <!-- Main bar -->
    <view :style="contentStyle">
      <!-- Default slot (left content) -->
      <slot />

      <!-- Price area -->
      <view
        :style="{
          flex: 1,
          display: 'flex',
          flexDirection: 'row' as const,
          alignItems: 'center',
          justifyContent: textAlign === 'right' ? 'flex-end' : 'flex-start',
          marginRight: 12,
        }"
      >
        <text v-if="label" :style="{ fontSize: 14, color: '#323233', marginRight: 4 }">{{ label }}</text>
        <text
          v-if="price !== undefined && price !== null"
          :style="{ fontSize: 20, color: '#ee0a24', fontWeight: 'bold' }"
        >{{ priceIntegerPart }}</text>
        <text
          v-if="priceDecimalPart"
          :style="{ fontSize: 12, color: '#ee0a24', fontWeight: 'bold' }"
        >{{ priceDecimalPart }}</text>
        <text v-if="suffixLabel" :style="{ fontSize: 12, color: '#323233', marginLeft: 4 }">{{ suffixLabel }}</text>
      </view>

      <!-- Submit button -->
      <slot name="button">
        <view :style="buttonStyle" @tap="onSubmit">
          <text :style="{ fontSize: 14, color: buttonTextColor, fontWeight: 'bold' }">
            {{ loading ? '...' : buttonText }}
          </text>
        </view>
      </slot>
    </view>
  </view>
</template>
