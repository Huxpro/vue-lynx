<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import FloatingPanel from '../components/FloatingPanel/index.vue';

const heightLog = ref('');

function onHeightChange(params: { height: number }) {
  heightLog.value = `Height: ${Math.round(params.height)}`;
}
</script>

<template>
  <DemoPage title="FloatingPanel">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">Drag the handle to resize the panel</text>
    </view>

    <FloatingPanel :anchors="[100, 250, 400]" :height="100" @height-change="onHeightChange">
      <view :style="{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 14, color: '#323233' }">Panel Content</text>
        <text :style="{ fontSize: 12, color: '#969799', marginTop: 8 }">Drag the handle to resize</text>
        <text v-if="heightLog" :style="{ fontSize: 12, color: '#1989fa', marginTop: 8 }">{{ heightLog }}</text>
      </view>
    </FloatingPanel>
  </DemoPage>
</template>
