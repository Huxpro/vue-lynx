<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import CouponList from '../components/CouponList/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const chosenCoupon = ref(-1);

const coupons = [
  {
    id: '1',
    name: 'Full Reduction Coupon',
    condition: 'No minimum spend',
    value: 500,
    startAt: 1672531200,
    endAt: 1735689600,
  },
  {
    id: '2',
    name: 'Discount Coupon',
    condition: 'Min spend ¥100',
    value: 2000,
    startAt: 1672531200,
    endAt: 1735689600,
  },
  {
    id: '3',
    name: 'Shipping Coupon',
    condition: 'Min spend ¥50',
    value: 1200,
    startAt: 1672531200,
    endAt: 1735689600,
  },
];

const disabledCoupons = [
  {
    id: '4',
    name: 'Expired Coupon',
    condition: 'Min spend ¥200',
    value: 3000,
    reason: 'This coupon has expired',
  },
  {
    id: '5',
    name: 'Region Coupon',
    condition: 'Min spend ¥300',
    value: 5000,
    reason: 'Not available in your region',
  },
];

function onChange(index: number) {
  chosenCoupon.value = index;
}

function onExchange(code: string) {
  // handle exchange
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">CouponList</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <view :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">
          Chosen Coupon: {{ chosenCoupon >= 0 ? coupons[chosenCoupon]?.name : 'None' }}
        </text>
      </view>
    </view>

    <CouponList
      :coupons="coupons"
      :chosen-coupon="chosenCoupon"
      :disabled-coupons="disabledCoupons"
      @change="onChange"
      @exchange="onExchange"
    />
  </view>
</template>
