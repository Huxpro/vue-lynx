<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import BackTop from '../components/BackTop/index.vue';
const backTopRef = ref<InstanceType<typeof BackTop> | null>(null);

const items = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);

function simulateScroll() {
  // Simulate scroll event to make BackTop visible
  backTopRef.value?.handleScroll({ detail: { scrollTop: 300 } });
}
</script>

<template>
  <DemoPage title="BackTop">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">Scroll down to see the BackTop button appear.</text>

      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <text :style="{ fontSize: 14, color: '#1989fa' }" @tap="simulateScroll">Tap to simulate scroll (show BackTop)</text>
      </view>

      <!-- Content items -->
      <view
        v-for="item in items"
        :key="item"
        :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 }"
      >
        <text :style="{ fontSize: 14, color: '#323233' }">{{ item }}</text>
      </view>

      <!-- Custom Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Custom Position</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">Use right and bottom props to set position.</text>

      <!-- Custom Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Custom Content</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">Use default slot to customize button content.</text>
    </view>

    <!-- BackTop Button (default) -->
    <BackTop ref="backTopRef" :offset="200" />

    <!-- BackTop with custom position and content -->
    <BackTop :right="15" :bottom="100" :offset="200">
      <view :style="{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1989fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 12, color: '#fff' }">Top</text>
      </view>
    </BackTop>
  </DemoPage>
</template>
