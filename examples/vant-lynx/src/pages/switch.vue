<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Switch from '../components/Switch/index.vue';
import Cell from '../components/Cell/index.vue';
const basicValue = ref(true);
const disabledValue = ref(true);
const loadingValue = ref(true);
const customColorValue = ref(true);
const customSizeValue = ref(true);
const customNodeValue = ref(true);
const asyncValue = ref(false);
const cellValue = ref(true);
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
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch v-model="customSizeValue" :size="40" />
        <text :style="{ fontSize: 14, color: '#323233', marginLeft: 12 }">Size: 40</text>
      </view>

      <!-- Custom Node -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Node</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch v-model="customNodeValue" :size="36" active-color="#4a90e2">
          <template #node>
            <view :style="{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: 10, color: '#4a90e2' }">ON</text>
            </view>
          </template>
        </Switch>
        <text :style="{ fontSize: 14, color: '#323233', marginLeft: 12 }">Custom thumb content</text>
      </view>

      <!-- Async Control -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Async Control</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Switch
          :model-value="asyncValue"
          @change="(val: unknown) => {
            setTimeout(() => { asyncValue.value = val as boolean; }, 1000);
          }"
        />
        <text :style="{ fontSize: 14, color: '#969799', marginLeft: 12 }">1s delay before toggle</text>
      </view>

      <!-- Inside a Cell -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Inside a Cell</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <Cell title="Switch inside cell">
          <template #right-icon>
            <Switch v-model="cellValue" :size="24" />
          </template>
        </Cell>
      </view>
    </view>
  </DemoPage>
</template>
