<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ShareSheet from '../components/ShareSheet/index.vue';
import Button from '../components/Button/index.vue';
const show = ref(false);
const options = [
  { name: 'WeChat', icon: '\uD83D\uDCAC' },
  { name: 'Weibo', icon: '\uD83C\uDF10' },
  { name: 'Link', icon: '\uD83D\uDD17' },
  { name: 'QR Code', icon: '\uD83D\uDCF1' },
];
</script>

<template>
  <DemoPage title="ShareSheet">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @click="show = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Show ShareSheet</text>
        </Button>
      </view>
    </view>

    <ShareSheet v-model:show="show" title="Share To" :options="options" />
  </DemoPage>
</template>
