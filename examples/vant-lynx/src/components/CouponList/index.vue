<!--
  Lynx Limitations:
  - scrollIntoView: No DOM scrollIntoView API in Lynx; displayedCouponIndex accepted but scroll not implemented
  - window resize: No window resize event in Lynx; list height is static
  - overflow-y: auto: Lynx uses <scroll-view> instead of CSS overflow
  - v-show: Uses v-if instead
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue-lynx';
import { createNamespace } from '../../utils';
import Tabs from '../Tabs/index.vue';
import Tab from '../Tab/index.vue';
import Button from '../Button/index.vue';
import Field from '../Field/index.vue';
import Empty from '../Empty/index.vue';
import Coupon from '../Coupon/index.vue';
import type { CouponInfo } from '../Coupon/types';
import './index.less';

export type { CouponInfo };

const [, bem] = createNamespace('coupon-list');

export interface CouponListProps {
  code?: string;
  coupons?: CouponInfo[];
  currency?: string;
  showCount?: boolean;
  emptyImage?: string;
  enabledTitle?: string;
  disabledTitle?: string;
  disabledCoupons?: CouponInfo[];
  showExchangeBar?: boolean;
  showCloseButton?: boolean;
  closeButtonText?: string;
  inputPlaceholder?: string;
  exchangeMinLength?: number;
  exchangeButtonText?: string;
  displayedCouponIndex?: number;
  exchangeButtonLoading?: boolean;
  exchangeButtonDisabled?: boolean;
  chosenCoupon?: number | number[];
}

const props = withDefaults(defineProps<CouponListProps>(), {
  code: '',
  coupons: () => [],
  currency: '¥',
  showCount: true,
  enabledTitle: '',
  disabledTitle: '',
  disabledCoupons: () => [],
  showExchangeBar: true,
  showCloseButton: true,
  closeButtonText: '',
  inputPlaceholder: '',
  exchangeMinLength: 1,
  exchangeButtonText: '',
  displayedCouponIndex: -1,
  exchangeButtonLoading: false,
  exchangeButtonDisabled: false,
  chosenCoupon: -1,
});

const emit = defineEmits<{
  change: [index: number | number[]];
  exchange: [code: string];
  'update:code': [code: string];
}>();

const activeTab = ref(0);
const currentCode = ref(props.code);

watch(() => props.code, (val) => {
  currentCode.value = val;
});

watch(currentCode, (val) => {
  emit('update:code', val);
});

const buttonDisabled = computed(() => {
  return (
    !currentCode.value ||
    props.exchangeButtonDisabled ||
    props.exchangeButtonLoading ||
    currentCode.value.length < props.exchangeMinLength
  );
});

const enabledTitleText = computed(() => {
  const title = props.enabledTitle || '可用';
  const count = props.showCount ? ` (${props.coupons.length})` : '';
  return title + count;
});

const disabledTitleText = computed(() => {
  const title = props.disabledTitle || '不可用';
  const count = props.showCount ? ` (${props.disabledCoupons.length})` : '';
  return title + count;
});

const closeText = computed(() => {
  return props.closeButtonText || '不使用优惠';
});

function isChosenCoupon(index: number): boolean {
  const { chosenCoupon } = props;
  if (Array.isArray(chosenCoupon)) {
    return chosenCoupon.includes(index);
  }
  return chosenCoupon === index;
}

function updateChosenCoupon(currentValues: number[], value: number): number[] {
  if (currentValues.includes(value)) {
    return currentValues.filter((item) => item !== value);
  }
  return [...currentValues, value];
}

function onCouponClick(index: number) {
  const { chosenCoupon } = props;
  if (Array.isArray(chosenCoupon)) {
    emit('change', updateChosenCoupon(chosenCoupon, index));
  } else {
    emit('change', index);
  }
}

function onExchange() {
  emit('exchange', currentCode.value);
  if (!props.code) {
    currentCode.value = '';
  }
}

function onCloseClick() {
  if (Array.isArray(props.chosenCoupon)) {
    emit('change', []);
  } else {
    emit('change', -1);
  }
}

function onInputChange(val: string) {
  currentCode.value = val;
}
</script>

<template>
  <view :class="bem()">
    <!-- Exchange Bar -->
    <view v-if="showExchangeBar" :class="bem('exchange-bar')">
      <Field
        :class="bem('field')"
        :model-value="currentCode"
        clearable
        :border="false"
        :placeholder="inputPlaceholder || '请输入优惠码'"
        @update:model-value="onInputChange"
      />
      <Button
        :class="bem('exchange')"
        size="small"
        type="primary"
        plain
        :disabled="buttonDisabled"
        :loading="exchangeButtonLoading"
        :text="exchangeButtonText || '兑换'"
        @click="onExchange"
      />
    </view>

    <!-- Tabs -->
    <Tabs v-model:active="activeTab" :class="bem('tab')">
      <Tab :title="enabledTitleText">
        <scroll-view scroll-orientation="vertical" :class="bem('list', { 'with-bottom': showCloseButton })">
          <template v-if="coupons.length > 0">
            <view
              v-for="(coupon, index) in coupons"
              :key="coupon.id"
              @tap="onCouponClick(index)"
            >
              <Coupon
                :coupon="coupon"
                :chosen="isChosenCoupon(index)"
                :currency="currency"
              />
            </view>
          </template>
          <template v-else>
            <Empty :image="emptyImage">
              <text :class="bem('empty-tip')">暂无优惠券</text>
            </Empty>
          </template>
          <slot name="list-footer" />
        </scroll-view>
      </Tab>
      <Tab :title="disabledTitleText">
        <scroll-view scroll-orientation="vertical" :class="bem('list', { 'with-bottom': showCloseButton })">
          <template v-if="disabledCoupons.length > 0">
            <view
              v-for="(coupon, index) in disabledCoupons"
              :key="coupon.id"
            >
              <Coupon
                :coupon="coupon"
                :currency="currency"
                disabled
              />
            </view>
          </template>
          <template v-else>
            <Empty :image="emptyImage">
              <text :class="bem('empty-tip')">暂无优惠券</text>
            </Empty>
          </template>
          <slot name="disabled-list-footer" />
        </scroll-view>
      </Tab>
    </Tabs>

    <!-- Bottom Button -->
    <view :class="bem('bottom')">
      <slot name="list-button">
        <Button
          v-if="showCloseButton"
          :class="bem('close')"
          round
          block
          type="primary"
          :text="closeText"
          @click="onCloseClick"
        />
      </slot>
    </view>
  </view>
</template>
