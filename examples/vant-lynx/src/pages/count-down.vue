<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import CountDown from '../components/CountDown/index.vue';
const time1 = ref(30 * 1000);
const time2 = ref(30 * 60 * 60 * 1000);
</script>

<template>
  <DemoPage title="CountDown">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage (30s)</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown :time="time1" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Format</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown :time="time2" format="DD Day, HH:mm:ss" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Millisecond</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <CountDown :time="time1" format="HH:mm:ss:SSS" millisecond />
      </view>
    </view>
  </DemoPage>
</template>
