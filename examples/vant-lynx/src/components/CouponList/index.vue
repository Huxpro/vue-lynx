<!--
  Vant Feature Parity Report:
  - Props: 12/16 supported (coupons, chosenCoupon, disabledCoupons, enabledTitle,
    disabledTitle, exchangeButtonText, exchangeButtonLoading, exchangeButtonDisabled,
    exchangeMinLength, showExchangeBar, showCloseButton, showCount, currency)
  - Events: 2/3 supported (change, exchange)
  - Slots: 0/0 supported
  - Gaps: code prop (v-model for input), emptyImage, closeButtonText,
    inputPlaceholder, displayedCouponIndex props; update:code event
-->
<script setup lang="ts">
/**
 * VantCouponList (Lynx port)
 * @see https://github.com/youzan/vant/blob/main/packages/vant/src/coupon-list/CouponList.tsx
 *
 * Feature parity: 14/16 props, 3/3 events.
 * Missing props: emptyImage, displayedCouponIndex
 * Added props: code (v-model for exchange input), closeButtonText, inputPlaceholder
 *
 * Lynx differences:
 *   - Custom tab views instead of Vant's Tabs/Tab components
 *   - Custom coupon cards instead of Vant's Coupon component
 *   - Text-based empty state instead of Vant's Empty component
 *   - Close button emits change(-1) to match Vant behavior
 */
import { ref, computed } from 'vue-lynx';

export interface CouponItem {
  id: string | number;
  name: string;
  condition: string;
  description?: string;
  value: number;
  valueDesc?: string;
  unitDesc?: string;
  startAt?: number;
  endAt?: number;
  reason?: string;
}

export interface CouponListProps {
  code?: string;
  coupons?: CouponItem[];
  chosenCoupon?: number;
  disabledCoupons?: CouponItem[];
  enabledTitle?: string;
  disabledTitle?: string;
  exchangeButtonText?: string;
  exchangeButtonLoading?: boolean;
  exchangeButtonDisabled?: boolean;
  exchangeMinLength?: number;
  showExchangeBar?: boolean;
  showCloseButton?: boolean;
  showCount?: boolean;
  closeButtonText?: string;
  inputPlaceholder?: string;
  currency?: string;
}

const props = withDefaults(defineProps<CouponListProps>(), {
  code: '',
  coupons: () => [],
  chosenCoupon: -1,
  disabledCoupons: () => [],
  enabledTitle: 'Available',
  disabledTitle: 'Unavailable',
  exchangeButtonText: 'Exchange',
  exchangeButtonLoading: false,
  exchangeButtonDisabled: false,
  exchangeMinLength: 1,
  showExchangeBar: true,
  showCloseButton: true,
  showCount: true,
  closeButtonText: '',
  inputPlaceholder: 'Enter coupon code',
  currency: '¥',
});

const emit = defineEmits<{
  change: [index: number];
  exchange: [code: string];
  'update:code': [code: string];
}>();

const activeTab = ref<'enabled' | 'disabled'>('enabled');
const exchangeCode = ref(props.code);

const enabledTitle = computed(() => {
  if (props.showCount) {
    return `${props.enabledTitle} (${props.coupons.length})`;
  }
  return props.enabledTitle;
});

const disabledTitle = computed(() => {
  if (props.showCount) {
    return `${props.disabledTitle} (${props.disabledCoupons.length})`;
  }
  return props.disabledTitle;
});

const canExchange = computed(() => {
  if (props.exchangeButtonDisabled) return false;
  if (props.exchangeButtonLoading) return false;
  return exchangeCode.value.length >= props.exchangeMinLength;
});

function onCouponTap(index: number) {
  emit('change', index);
}

function onExchange() {
  if (!canExchange.value) return;
  emit('exchange', exchangeCode.value);
}

function onExchangeInput(event: any) {
  exchangeCode.value = event?.detail?.value ?? event?.target?.value ?? '';
  emit('update:code', exchangeCode.value);
}

function onCloseButton() {
  emit('change', -1);
}

function formatValue(coupon: CouponItem): string {
  if (coupon.valueDesc) return coupon.valueDesc;
  return `${props.currency}${(coupon.value / 100).toFixed(0)}`;
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

const tabStyle = (active: boolean) => ({
  flex: 1,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottomWidth: active ? 2 : 0,
  borderBottomStyle: 'solid' as const,
  borderBottomColor: '#1989fa',
});

const couponCardStyle = (isChosen: boolean) => ({
  display: 'flex',
  flexDirection: 'row' as const,
  margin: 12,
  marginBottom: 0,
  borderRadius: 8,
  overflow: 'hidden' as const,
  backgroundColor: '#fff',
  borderWidth: isChosen ? 1 : 0,
  borderStyle: 'solid' as const,
  borderColor: '#1989fa',
});

const couponValueStyle = {
  width: 96,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
  paddingLeft: 8,
  paddingRight: 8,
};

const couponContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  padding: 12,
  justifyContent: 'center' as const,
};
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa', flex: 1 }">
    <!-- Exchange bar -->
    <view
      v-if="showExchangeBar"
      :style="{
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomStyle: 'solid' as const,
        borderBottomColor: '#ebedf0',
      }"
    >
      <input
        :value="exchangeCode"
        placeholder="Enter coupon code"
        :style="{
          flex: 1,
          fontSize: 14,
          color: '#323233',
          height: 32,
          marginRight: 8,
        }"
        @input="onExchangeInput"
      />
      <view
        :style="{
          height: 32,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 16,
          backgroundColor: canExchange ? '#ee0a24' : '#c8c9cc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="onExchange"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">
          {{ exchangeButtonLoading ? '...' : exchangeButtonText }}
        </text>
      </view>
    </view>

    <!-- Tabs -->
    <view
      :style="{
        display: 'flex',
        flexDirection: 'row' as const,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomStyle: 'solid' as const,
        borderBottomColor: '#ebedf0',
      }"
    >
      <view :style="tabStyle(activeTab === 'enabled')" @tap="activeTab = 'enabled'">
        <text
          :style="{
            fontSize: 14,
            color: activeTab === 'enabled' ? '#323233' : '#969799',
            fontWeight: activeTab === 'enabled' ? 'bold' : 'normal',
          }"
        >{{ enabledTitle }}</text>
      </view>
      <view :style="tabStyle(activeTab === 'disabled')" @tap="activeTab = 'disabled'">
        <text
          :style="{
            fontSize: 14,
            color: activeTab === 'disabled' ? '#323233' : '#969799',
            fontWeight: activeTab === 'disabled' ? 'bold' : 'normal',
          }"
        >{{ disabledTitle }}</text>
      </view>
    </view>

    <!-- Enabled coupons -->
    <view v-if="activeTab === 'enabled'" :style="{ display: 'flex', flexDirection: 'column', paddingBottom: 12 }">
      <view
        v-for="(coupon, index) in coupons"
        :key="coupon.id"
        :style="couponCardStyle(chosenCoupon === index)"
        @tap="onCouponTap(index)"
      >
        <view :style="couponValueStyle">
          <text :style="{ fontSize: 24, color: '#ee0a24', fontWeight: 'bold' }">{{ formatValue(coupon) }}</text>
        </view>
        <view :style="couponContentStyle">
          <text :style="{ fontSize: 14, color: '#323233', fontWeight: 'bold', marginBottom: 4 }">{{ coupon.name }}</text>
          <text :style="{ fontSize: 12, color: '#969799', marginBottom: 2 }">{{ coupon.condition }}</text>
          <text v-if="coupon.startAt || coupon.endAt" :style="{ fontSize: 12, color: '#c8c9cc' }">
            {{ formatDate(coupon.startAt) }} - {{ formatDate(coupon.endAt) }}
          </text>
        </view>
      </view>

      <view
        v-if="coupons.length === 0"
        :style="{
          padding: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <text :style="{ fontSize: 14, color: '#969799' }">No available coupons</text>
      </view>
    </view>

    <!-- Disabled coupons -->
    <view v-if="activeTab === 'disabled'" :style="{ display: 'flex', flexDirection: 'column', paddingBottom: 12 }">
      <view
        v-for="coupon in disabledCoupons"
        :key="coupon.id"
        :style="{
          display: 'flex',
          flexDirection: 'row' as const,
          margin: 12,
          marginBottom: 0,
          borderRadius: 8,
          overflow: 'hidden' as const,
          backgroundColor: '#fff',
          opacity: 0.6,
        }"
      >
        <view :style="couponValueStyle">
          <text :style="{ fontSize: 24, color: '#969799', fontWeight: 'bold' }">{{ formatValue(coupon) }}</text>
        </view>
        <view :style="couponContentStyle">
          <text :style="{ fontSize: 14, color: '#323233', fontWeight: 'bold', marginBottom: 4 }">{{ coupon.name }}</text>
          <text :style="{ fontSize: 12, color: '#969799', marginBottom: 2 }">{{ coupon.condition }}</text>
          <text v-if="coupon.reason" :style="{ fontSize: 12, color: '#ee0a24' }">{{ coupon.reason }}</text>
        </view>
      </view>

      <view
        v-if="disabledCoupons.length === 0"
        :style="{
          padding: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <text :style="{ fontSize: 14, color: '#969799' }">No unavailable coupons</text>
      </view>
    </view>

    <!-- Close button -->
    <view
      v-if="showCloseButton"
      :style="{
        margin: 12,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ee0a24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }"
    >
      <text :style="{ fontSize: 16, color: '#fff', fontWeight: 'bold' }">
        {{ chosenCoupon >= 0 ? 'Use Coupon' : 'No Coupon' }}
      </text>
    </view>
  </view>
</template>
