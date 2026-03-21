<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import ShareSheet from '../components/ShareSheet/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const show = ref(false);
const options = [
  { name: 'WeChat', icon: '\uD83D\uDCAC' },
  { name: 'Weibo', icon: '\uD83C\uDF10' },
  { name: 'Link', icon: '\uD83D\uDD17' },
  { name: 'QR Code', icon: '\uD83D\uDCF1' },
];
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">ShareSheet</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @click="show = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Show ShareSheet</text>
        </Button>
      </view>
    </view>

    <ShareSheet v-model:show="show" title="Share To" :options="options" />
  </view>
</template>
