<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import NoticeBar from '../components/NoticeBar/index.vue';
</script>

<template>
  <DemoPage title="NoticeBar">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <NoticeBar text="Notice: This is a notification message that may be long enough to scroll." />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Closeable Mode</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <NoticeBar mode="closeable" text="This is a closeable notice bar. Tap the close icon to dismiss." />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Link Mode</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <NoticeBar mode="link" text="This is a link notice bar. Tap to navigate." />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <NoticeBar text="Custom color notice bar." color="#1989fa" background="#ecf9ff" />
      </view>
    </view>
  </DemoPage>
</template>
