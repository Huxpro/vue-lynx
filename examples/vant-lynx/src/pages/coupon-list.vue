<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import CouponList from '../components/CouponList/index.vue';
import Cell from '../components/Cell/index.vue';
import Popup from '../components/Popup/index.vue';
import Button from '../components/Button/index.vue';
import type { CouponInfo } from '../components/Coupon/types';

const showList = ref(false);
const showListArray = ref(false);
const chosenCoupon = ref(-1);
const chosenCouponArray = ref<number[]>([]);
const chosenCouponArrayResult = ref<number[]>([]);
const exchangedCoupons = ref<CouponInfo[]>([]);

const coupon: CouponInfo = {
  id: 1,
  condition: '无门槛\n最多优惠12元',
  reason: '',
  value: 150,
  name: '优惠券名称',
  description: '描述信息',
  startAt: 1489104000,
  endAt: 1514592000,
  valueDesc: '1.5',
  unitDesc: '元',
};

const discountCoupon: CouponInfo = {
  ...coupon,
  id: 2,
  value: 12,
  valueDesc: '8.8',
  unitDesc: '折',
};

const disabledCoupon: CouponInfo = {
  ...coupon,
  id: 3,
  reason: '优惠券不可用原因',
};

const disabledDiscountCoupon: CouponInfo = {
  ...discountCoupon,
  valueDesc: '1',
  unitDesc: '折',
  id: 4,
  reason: '优惠券不可用原因',
};

const coupons = computed(() => [
  coupon,
  discountCoupon,
  ...exchangedCoupons.value,
]);

const disabledCoupons = computed(() => [
  disabledCoupon,
  disabledDiscountCoupon,
]);

const chosenCouponText = computed(() => {
  if (chosenCoupon.value >= 0) {
    const c = coupons.value[chosenCoupon.value];
    return c ? `-¥${(c.value / 100).toFixed(2)}` : '无可用';
  }
  return '无可用';
});

const chosenCouponArrayText = computed(() => {
  if (chosenCouponArrayResult.value.length > 0) {
    return `已选 ${chosenCouponArrayResult.value.length} 张`;
  }
  return '无可用';
});

function onChange(index: number) {
  showList.value = false;
  chosenCoupon.value = index;
}

function onChangeArray(chosen: number[]) {
  chosenCouponArray.value = chosen;
}

function onSubmit() {
  showListArray.value = false;
  chosenCouponArrayResult.value = chosenCouponArray.value;
}

function onExchange() {
  exchangedCoupons.value.push({
    ...coupon,
    id: Math.floor(Math.random() * 999999) + 1,
  });
}
</script>

<template>
  <DemoPage title="Coupon 优惠券">
    <!-- 基础用法 -->
    <view :style="{ marginBottom: '12px' }">
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', marginBottom: '8px' }">基础用法</text>
      <Cell title="优惠券" :value="chosenCouponText" is-link @tap="showList = true" />
      <Popup v-model:show="showList" round position="bottom" :style="{ height: '90%', paddingTop: '4px' }">
        <CouponList
          :coupons="coupons"
          :chosen-coupon="chosenCoupon"
          :disabled-coupons="disabledCoupons"
          @change="onChange"
          @exchange="onExchange"
        />
      </Popup>
    </view>

    <!-- 多选用法 -->
    <view>
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', marginBottom: '8px' }">多选用法</text>
      <Cell title="优惠券" :value="chosenCouponArrayText" is-link @tap="showListArray = true" />
      <Popup v-model:show="showListArray" round position="bottom" :style="{ height: '90%', paddingTop: '4px' }">
        <CouponList
          :coupons="coupons"
          :chosen-coupon="chosenCouponArray"
          :disabled-coupons="disabledCoupons"
          :show-close-button="false"
          @change="onChangeArray"
          @exchange="onExchange"
        >
          <template #list-button>
            <Button
              round
              block
              type="primary"
              text="确定"
              :style="{ height: '40px' }"
              @click="onSubmit"
            />
          </template>
        </CouponList>
      </Popup>
    </view>
  </DemoPage>
</template>
