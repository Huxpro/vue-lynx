<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Picker from '../components/Picker/index.vue';
const cityColumns = [['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou']];
const cityResult = ref('');

const dateColumns = [
  ['2022', '2023', '2024', '2025'],
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
];
const dateResult = ref('');

function onCityConfirm(values: string[]) {
  cityResult.value = values.join(', ');
}

function onDateConfirm(values: string[]) {
  dateResult.value = values.join(' ');
}
</script>

<template>
  <DemoPage title="Picker">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Single Column -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Single Column</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Select City"
          :columns="cityColumns"
          @confirm="onCityConfirm"
        />
      </view>
      <view v-if="cityResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ cityResult }}</text>
      </view>

      <!-- Multi-column -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Multiple Columns</text>
      <view :style="{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Select Date"
          :columns="dateColumns"
          @confirm="onDateConfirm"
        />
      </view>
      <view v-if="dateResult" :style="{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Selected: {{ dateResult }}</text>
      </view>

      <!-- Loading -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Loading State</text>
      <view :style="{ borderRadius: 8, overflow: 'hidden' }">
        <Picker
          title="Loading..."
          :columns="cityColumns"
          :loading="true"
        />
      </view>
    </view>
  </DemoPage>
</template>
