<script setup lang="ts">
import { useRouter } from 'vue-router';
import FloatingBubble from '../components/FloatingBubble/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">FloatingBubble</text>
    </view>

    <view :style="{ padding: 16 }">
      <text :style="{ fontSize: 14, color: '#969799' }">A draggable floating bubble</text>
    </view>

    <FloatingBubble axis="xy" />
  </view>
</template>
