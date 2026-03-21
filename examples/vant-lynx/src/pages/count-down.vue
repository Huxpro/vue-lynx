<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import CountDown from '../components/CountDown/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const time1 = ref(30 * 1000);
const time2 = ref(30 * 60 * 60 * 1000);
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">CountDown</text>
    </view>

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
  </view>
</template>
