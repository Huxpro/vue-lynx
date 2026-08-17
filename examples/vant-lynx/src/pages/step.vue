<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Steps from '../components/Steps/index.vue';
import Step from '../components/Step/index.vue';

const activeStep = ref(1);

function nextStep() {
  activeStep.value = (activeStep.value + 1) % 4;
}
</script>

<template>
  <DemoPage title="Step">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 24 }">
        <Steps :active="activeStep">
          <Step :index="0">Step 1</Step>
          <Step :index="1">Step 2</Step>
          <Step :index="2">Step 3</Step>
          <Step :index="3">Step 4</Step>
        </Steps>
        <view
          :style="{
            marginTop: 16,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 16,
            paddingRight: 16,
            backgroundColor: '#1989fa',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
          @tap="nextStep"
        >
          <text :style="{ color: '#fff', fontSize: 14 }">Next Step</text>
        </view>
      </view>

      <!-- Vertical Direction -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Vertical Direction</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <Steps :active="1" direction="vertical">
          <Step :index="0">Order placed</Step>
          <Step :index="1">Processing</Step>
          <Step :index="2">Shipped</Step>
          <Step :index="3">Delivered</Step>
        </Steps>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ marginBottom: 24 }">
        <Steps :active="1" active-color="#ee0a24" inactive-color="#c8c9cc">
          <Step :index="0">Step 1</Step>
          <Step :index="1">Step 2</Step>
          <Step :index="2">Step 3</Step>
        </Steps>
      </view>

      <!-- All Finished -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">All Finished</text>
      <view :style="{ marginBottom: 24 }">
        <Steps :active="3">
          <Step :index="0">Order placed</Step>
          <Step :index="1">Paid</Step>
          <Step :index="2">Shipped</Step>
          <Step :index="3">Received</Step>
        </Steps>
      </view>

      <!-- First Step Active -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">First Step Active</text>
      <view :style="{ marginBottom: 24 }">
        <Steps :active="0">
          <Step :index="0">Pending</Step>
          <Step :index="1">Processing</Step>
          <Step :index="2">Completed</Step>
        </Steps>
      </view>

      <!-- Vertical with Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Vertical with Custom Color</text>
      <view :style="{ marginBottom: 24, backgroundColor: '#fff', padding: 16, borderRadius: 8 }">
        <Steps :active="2" direction="vertical" active-color="#1989fa" inactive-color="#ebedf0">
          <Step :index="0">Sign up</Step>
          <Step :index="1">Verify email</Step>
          <Step :index="2">Set password</Step>
          <Step :index="3">Complete profile</Step>
        </Steps>
      </view>
    </view>
  </DemoPage>
</template>
