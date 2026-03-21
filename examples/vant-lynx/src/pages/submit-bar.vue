<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import SubmitBar from '../components/SubmitBar/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const submitted = ref('');

function onSubmit() {
  submitted.value = 'Order submitted at ' + new Date().toLocaleTimeString();
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">SubmitBar</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <SubmitBar
          :price="3050"
          button-text="Submit Order"
          @submit="onSubmit"
        />
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <SubmitBar
          :price="3050"
          button-text="Submit Order"
          :disabled="true"
          tip="Your address is not in the delivery area"
        />
      </view>

      <!-- Loading -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <SubmitBar
          :price="3050"
          button-text="Submit Order"
          :loading="true"
        />
      </view>

      <!-- Custom Price -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Price</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <SubmitBar
          :price="10050"
          label="Subtotal:"
          suffix-label="(tax included)"
          button-text="Pay Now"
          button-type="primary"
          :decimal-length="2"
          @submit="onSubmit"
        />
      </view>

      <!-- With Tip -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Tip</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <SubmitBar
          :price="8888"
          button-text="Submit"
          tip="Free shipping for orders over ¥100"
          @submit="onSubmit"
        />
      </view>

      <view v-if="submitted" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ submitted }}</text>
      </view>
    </view>
  </view>
</template>
