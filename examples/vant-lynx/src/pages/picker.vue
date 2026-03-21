<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Picker from '../components/Picker/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

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
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Picker</text>
    </view>

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
  </view>
</template>
