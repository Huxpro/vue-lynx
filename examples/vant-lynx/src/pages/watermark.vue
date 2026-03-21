<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Watermark from '../components/Watermark/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Watermark</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Text Watermark -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Text Watermark</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, height: 200, position: 'relative', overflow: 'hidden' }">
        <text :style="{ fontSize: 14, color: '#323233' }">This area has a text watermark overlay. The watermark helps protect content from unauthorized use.</text>
        <Watermark content="Vant Lynx" :full-page="false" :opacity="0.1" />
      </view>

      <!-- Custom Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Style</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, height: 200, position: 'relative', overflow: 'hidden' }">
        <text :style="{ fontSize: 14, color: '#323233' }">Watermark with custom font size, color and rotation angle.</text>
        <Watermark
          content="Custom"
          :full-page="false"
          :font-size="18"
          font-color="#1989fa"
          :rotate="-30"
          :opacity="0.12"
        />
      </view>

      <!-- Custom Gap -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Gap</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, height: 200, position: 'relative', overflow: 'hidden' }">
        <text :style="{ fontSize: 14, color: '#323233' }">Watermark with custom gap between items.</text>
        <Watermark
          content="Gap"
          :full-page="false"
          :gap-x="50"
          :gap-y="50"
          :opacity="0.15"
        />
      </view>
    </view>
  </view>
</template>
