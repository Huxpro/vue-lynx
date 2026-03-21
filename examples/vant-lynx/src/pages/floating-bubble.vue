<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import FloatingBubble from '../components/FloatingBubble/index.vue';

const clickCount = ref(0);

function onBubbleClick() {
  clickCount.value++;
}
</script>

<template>
  <DemoPage title="FloatingBubble">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">A draggable floating bubble (drag freely on both axes)</text>

      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">Magnetic Position</text>
      <text :style="{ fontSize: 12, color: '#969799', marginBottom: 12 }">The bubble snaps to the nearest edge</text>

      <text :style="{ fontSize: 14, color: '#969799', marginTop: 16, marginBottom: 12 }">Click Event</text>
      <view v-if="clickCount" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Clicked {{ clickCount }} times</text>
      </view>
    </view>

    <FloatingBubble axis="xy" icon="chat-o" @click="onBubbleClick" />
  </DemoPage>
</template>
