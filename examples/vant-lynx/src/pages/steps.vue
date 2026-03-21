<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Steps from '../components/Steps/index.vue';
import Step from '../components/Step/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const active = ref(1);
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Steps</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Steps :active="active">
          <Step :index="0">Placed</Step>
          <Step :index="1">Processing</Step>
          <Step :index="2">Shipped</Step>
          <Step :index="3">Delivered</Step>
        </Steps>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Switch Step</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'row' }">
        <text :style="{ fontSize: 14, color: '#1989fa', marginRight: 16 }" @tap="active = Math.max(0, active - 1)">Prev</text>
        <text :style="{ fontSize: 14, color: '#1989fa' }" @tap="active = Math.min(3, active + 1)">Next</text>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Steps :active="1" active-color="#ee0a24">
          <Step :index="0">Step 1</Step>
          <Step :index="1">Step 2</Step>
          <Step :index="2">Step 3</Step>
        </Steps>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Vertical Steps</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Steps :active="1" direction="vertical">
          <Step :index="0">Step 1: Order placed</Step>
          <Step :index="1">Step 2: Processing</Step>
          <Step :index="2">Step 3: Completed</Step>
        </Steps>
      </view>
    </view>
  </view>
</template>
