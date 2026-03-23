<!--
  Lynx Limitations:
  - :active pseudo-class: No :active CSS state in Lynx (touch feedback not automatic)
  - ::after/::before pseudo-elements: Not available in Lynx
  - ellipsis mixin: Uses overflow/text-overflow/white-space CSS properties directly
  - <h2>/<p> HTML tags: Replaced with <view>/<text> for Lynx
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils';
import { getDate, formatAmount, formatDiscount } from './utils';
import Checkbox from '../Checkbox/index.vue';
import type { CouponInfo } from './types';
import './index.less';

const [, bem] = createNamespace('coupon');

export interface CouponProps {
  chosen?: boolean;
  coupon: CouponInfo;
  disabled?: boolean;
  currency?: string;
}

const props = withDefaults(defineProps<CouponProps>(), {
  chosen: false,
  disabled: false,
  currency: '¥',
});

const validPeriod = computed(() => {
  const { startAt, endAt } = props.coupon;
  return `${getDate(startAt)} - ${getDate(endAt)}`;
});

const faceAmount = computed(() => {
  const { coupon, currency } = props;

  if (coupon.valueDesc) {
    return { type: 'valueDesc' as const, text: coupon.valueDesc, unit: coupon.unitDesc || '' };
  }

  if (coupon.denominations) {
    const denominations = formatAmount(coupon.denominations);
    return { type: 'denominations' as const, text: denominations, currency };
  }

  if (coupon.discount) {
    return { type: 'discount' as const, text: formatDiscount(coupon.discount) + '折' };
  }

  return { type: 'empty' as const, text: '' };
});

const conditionMessage = computed(() => {
  const condition = formatAmount(props.coupon.originCondition || 0);
  return condition === '0' ? '无门槛' : `满${condition}元可用`;
});

const description = computed(() => {
  const { disabled, coupon } = props;
  return (disabled && coupon.reason) || coupon.description;
});
</script>

<template>
  <view :class="bem([{ disabled }])">
    <view :class="bem('content')">
      <view :class="bem('head')">
        <view :class="bem('amount')">
          <text v-if="faceAmount.type === 'valueDesc'" :class="bem('amount')">
            {{ faceAmount.text }}
          </text>
          <text v-else-if="faceAmount.type === 'denominations'" :class="bem('amount')">
            <text :class="bem('currency')">{{ faceAmount.currency }}</text> {{ faceAmount.text }}
          </text>
          <text v-else-if="faceAmount.type === 'discount'" :class="bem('amount')">
            {{ faceAmount.text }}
          </text>
        </view>
        <view v-if="faceAmount.type === 'valueDesc' && faceAmount.unit">
          <text :class="bem('currency')">{{ faceAmount.unit }}</text>
        </view>
        <view :class="bem('condition')">
          <text :class="bem('condition')">{{ coupon.condition || conditionMessage }}</text>
        </view>
      </view>
      <view :class="bem('body')">
        <text :class="bem('name')">{{ coupon.name }}</text>
        <text :class="bem('valid')">{{ validPeriod }}</text>
        <Checkbox
          v-if="!disabled"
          :class="bem('corner')"
          :model-value="chosen"
        />
      </view>
    </view>
    <view v-if="description" :class="bem('description')">
      <text :class="bem('description')">{{ description }}</text>
    </view>
  </view>
</template>
