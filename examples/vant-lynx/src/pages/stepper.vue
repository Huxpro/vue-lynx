<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Stepper from '../components/Stepper/index.vue';
const value1 = ref(1);
const value2 = ref(1);
const value3 = ref(1);
const value4 = ref(1);
const value5 = ref(1);
</script>

<template>
  <DemoPage title="Stepper">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value1" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Step Size</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value2" :step="2" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Range</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value3" :min="5" :max="8" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value4" disabled />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round Theme</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Stepper v-model="value5" theme="round" />
      </view>
    </view>
  </DemoPage>
</template>
