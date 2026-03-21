<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Switch from '../components/Switch/index.vue';
const basicValue = ref(true);
const disabledValue = ref(true);
const loadingValue = ref(true);
const customColorValue = ref(true);
const customSizeValue = ref(true);
</script>

<template>
  <DemoPage title="Switch">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch v-model="basicValue" />
        <text :style="{ fontSize: 14, color: '#323233', marginLeft: 12 }">{{ basicValue ? 'ON' : 'OFF' }}</text>
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch v-model="disabledValue" disabled />
        <text :style="{ fontSize: 14, color: '#969799', marginLeft: 12 }">Disabled</text>
      </view>

      <!-- Loading -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch v-model="loadingValue" loading />
        <text :style="{ fontSize: 14, color: '#969799', marginLeft: 12 }">Loading</text>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch v-model="customColorValue" active-color="#07c160" inactive-color="#ee0a24" />
        <text :style="{ fontSize: 14, color: '#323233', marginLeft: 12 }">Active: green / Inactive: red</text>
      </view>

      <!-- Custom Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Size</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch v-model="customSizeValue" :size="40" />
        <text :style="{ fontSize: 14, color: '#323233', marginLeft: 12 }">Size: 40</text>
      </view>
    </view>
  </DemoPage>
</template>
