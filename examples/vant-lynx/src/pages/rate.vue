<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Rate from '../components/Rate/index.vue';
const value1 = ref(3);
const value2 = ref(3);
const value3 = ref(3.5);
const value4 = ref(3);
const value5 = ref(3);
const value6 = ref(4);
const value7 = ref(3);
const valueClearable = ref(3);
const changeResult = ref('');
</script>

<template>
  <DemoPage title="Rate">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="value1" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="value2" color="#ffd21e" void-color="#eee" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Half Star</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="value3" allow-half />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Size</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="value4" :size="30" :gutter="8" color="#ee0a24" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Count</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="value6" :count="8" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Clearable</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="valueClearable" clearable />
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Tap current rating again to clear. Value: {{ valueClearable }}</text>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="value5" disabled />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Readonly</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate :model-value="3" readonly />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Readonly Half Star</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate :model-value="3.3" readonly allow-half />
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Value: 3.3 (fractional display)</text>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Change Event</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Rate v-model="value7" @change="(val: number) => changeResult = `Rating changed to ${val}`" />
        <text v-if="changeResult" :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">{{ changeResult }}</text>
      </view>
    </view>
  </DemoPage>
</template>
