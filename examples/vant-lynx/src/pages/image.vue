<script setup lang="ts">
import { useRouter } from 'vue-router';
import VanImage from '../components/Image/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }

const imgSrc = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg';
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Image</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" round />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Radius</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" :radius="8" />
      </view>
    </view>
  </view>
</template>
