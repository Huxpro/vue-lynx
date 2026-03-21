<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Divider from '../components/Divider/index.vue';
</script>

<template>
  <DemoPage title="Divider">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', margin: 16, borderRadius: 8 }">
      <Divider />

      <Divider>
        <text :style="{ fontSize: 14, color: '#969799' }">Text</text>
      </Divider>

      <Divider content-position="left">
        <text :style="{ fontSize: 14, color: '#969799' }">Left Text</text>
      </Divider>

      <Divider content-position="right">
        <text :style="{ fontSize: 14, color: '#969799' }">Right Text</text>
      </Divider>

      <Divider dashed>
        <text :style="{ fontSize: 14, color: '#969799' }">Dashed</text>
      </Divider>
    </view>
  </DemoPage>
</template>
