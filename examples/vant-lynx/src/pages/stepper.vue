<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Stepper from '../components/Stepper/index.vue';
const value1 = ref(1);
const value2 = ref(1);
const value3 = ref(1);
const value4 = ref(1);
const value5 = ref(1);
const value6 = ref(1);
const value7 = ref(1.0);
const value8 = ref(1);
const value9 = ref(1);
const value10 = ref(1);
const value11 = ref(1.5);

const labelStyle = { fontSize: 14, color: '#969799', marginBottom: 12 };
const cardStyle = { marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' as const };

function beforeChange(value: number) {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(value <= 5), 500);
  });
}
</script>

<template>
  <DemoPage title="Stepper">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="labelStyle">Basic Usage</text>
      <view :style="cardStyle">
        <Stepper v-model="value1" />
      </view>

      <text :style="labelStyle">Step Size</text>
      <view :style="cardStyle">
        <Stepper v-model="value2" :step="2" />
      </view>

      <text :style="labelStyle">Range (min=5, max=8)</text>
      <view :style="cardStyle">
        <Stepper v-model="value3" :min="5" :max="8" />
      </view>

      <text :style="labelStyle">Disabled</text>
      <view :style="cardStyle">
        <Stepper v-model="value4" disabled />
      </view>

      <text :style="labelStyle">Round Theme</text>
      <view :style="cardStyle">
        <Stepper v-model="value5" theme="round" />
      </view>

      <text :style="labelStyle">Decimal Length (2)</text>
      <view :style="cardStyle">
        <Stepper v-model="value7" :step="0.1" :decimal-length="2" />
      </view>

      <text :style="labelStyle">Custom Size (inputWidth=40, buttonSize=32)</text>
      <view :style="cardStyle">
        <Stepper v-model="value6" :input-width="40" :button-size="32" />
      </view>

      <text :style="labelStyle">Disable Plus / Long Press</text>
      <view :style="cardStyle">
        <Stepper v-model="value8" disable-plus :long-press="true" />
      </view>

      <text :style="labelStyle">Integer</text>
      <view :style="cardStyle">
        <Stepper v-model="value10" integer />
      </view>

      <text :style="labelStyle">Disable Input</text>
      <view :style="cardStyle">
        <Stepper v-model="value11" :step="0.5" disable-input />
      </view>

      <text :style="labelStyle">Before Change (async, max 5)</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <Stepper v-model="value9" :before-change="beforeChange" />
      </view>
    </view>
  </DemoPage>
</template>
