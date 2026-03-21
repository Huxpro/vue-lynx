<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Divider from '../components/Divider/index.vue';
</script>

<template>
  <DemoPage title="Divider">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Divider />
      </view>

      <!-- With Text -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Text</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Divider>
          <text :style="{ fontSize: 14, color: '#969799' }">Text</text>
        </Divider>
      </view>

      <!-- Content Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Content Position</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Divider content-position="left">
          <text :style="{ fontSize: 14, color: '#969799' }">Left Text</text>
        </Divider>
        <Divider content-position="right">
          <text :style="{ fontSize: 14, color: '#969799' }">Right Text</text>
        </Divider>
      </view>

      <!-- Dashed -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Dashed</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Divider dashed>
          <text :style="{ fontSize: 14, color: '#969799' }">Dashed</text>
        </Divider>
      </view>

      <!-- Custom Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Style</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Divider :hairline="false">
          <text :style="{ fontSize: 14, color: '#1989fa' }">Thicker Line</text>
        </Divider>
      </view>

      <!-- Vertical -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Vertical</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <text :style="{ fontSize: 14, color: '#1989fa' }">Text</text>
        <Divider vertical />
        <text :style="{ fontSize: 14, color: '#1989fa' }">Text</text>
        <Divider vertical />
        <text :style="{ fontSize: 14, color: '#1989fa' }">Text</text>
      </view>
    </view>
  </DemoPage>
</template>
