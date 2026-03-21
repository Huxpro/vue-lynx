<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Empty from '../components/Empty/index.vue';
</script>

<template>
  <DemoPage title="Empty">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Default</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Error</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="error" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Network</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="network" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Search</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="search" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Description</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Empty image="default" description="Custom description text" />
      </view>
    </view>
  </DemoPage>
</template>
