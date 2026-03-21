<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import SubmitBar from '../components/SubmitBar/index.vue';
const submitted = ref('');

function onSubmit() {
  submitted.value = 'Order submitted at ' + new Date().toLocaleTimeString();
}
</script>

<template>
  <DemoPage title="SubmitBar">
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
  </DemoPage>
</template>
