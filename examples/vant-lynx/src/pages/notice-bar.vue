<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import NoticeBar from '../components/NoticeBar/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">NoticeBar</text>
    </view>

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
  </view>
</template>
