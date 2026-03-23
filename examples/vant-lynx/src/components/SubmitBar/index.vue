<!--
  Lynx Limitations:
  - placeholder prop: Lynx has no getBoundingClientRect for placeholder height measurement
  - position: fixed: Lynx fixed positioning works differently; use within page layout
  - usePlaceholder composable: depends on DOM measurement, not available in Lynx
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Button from '../Button/index.vue';
import Icon from '../Icon/index.vue';
import type { SubmitBarProps } from './types';
import './index.less';

const [, bem] = createNamespace('submit-bar');

const props = withDefaults(defineProps<SubmitBarProps>(), {
  currency: '¥',
  buttonType: 'danger',
  decimalLength: 2,
  safeAreaInsetBottom: true,
});

const emit = defineEmits<{
  submit: [];
}>();

const slots = useSlots();

const hasPrice = computed(() => typeof props.price === 'number');

const pricePair = computed(() => {
  if (!hasPrice.value) return ['', ''];
  return (props.price! / 100).toFixed(+props.decimalLength).split('.');
});

const priceInteger = computed(() => pricePair.value[0]);
const priceDecimal = computed(() => {
  if (!+props.decimalLength) return '';
  return `.${pricePair.value[1]}`;
});

const textClass = computed(() => {
  const classes = [bem('text')];
  if (props.textAlign === 'left') {
    classes.push(bem('text', { left: true }));
  }
  return classes.join(' ');
});

function onSubmit() {
  emit('submit');
}
</script>

<template>
  <view :class="[bem(), { 'van-safe-area-bottom': safeAreaInsetBottom }]">
    <!-- Top slot -->
    <slot name="top" />

    <!-- Tip -->
    <view v-if="tip || slots.tip" :class="bem('tip')">
      <Icon
        v-if="tipIcon"
        :name="tipIcon"
        :class="bem('tip-icon')"
      />
      <text v-if="tip" :class="bem('tip-text')">{{ tip }}</text>
      <slot name="tip" />
    </view>

    <!-- Main bar -->
    <view :class="bem('bar')">
      <!-- Default slot (left content) -->
      <slot />

      <!-- Price text area -->
      <view v-if="hasPrice" :class="textClass">
        <text :class="bem('label')">{{ label || '合计：' }}</text>
        <view :class="bem('price')">
          <text :class="bem('currency')">{{ currency }}</text>
          <text :class="bem('price-integer')">{{ priceInteger }}</text>
          <text v-if="priceDecimal" :class="bem('decimal')">{{ priceDecimal }}</text>
        </view>
        <text v-if="suffixLabel" :class="bem('suffix-label')">{{ suffixLabel }}</text>
      </view>

      <!-- Submit button -->
      <slot name="button">
        <Button
          round
          :type="buttonType"
          :text="buttonText"
          :class="bem('button')"
          :color="buttonColor"
          :loading="loading"
          :disabled="disabled"
          @click="onSubmit"
        />
      </slot>
    </view>
  </view>
</template>
