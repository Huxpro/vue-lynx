<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Sticky from '../components/Sticky/index.vue';
</script>

<template>
  <DemoPage title="Sticky">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Sticky>
          <view :style="{ backgroundColor: '#1989fa', padding: 12, borderRadius: 4 }">
            <text :style="{ color: '#fff', fontSize: 14 }">Basic Sticky</text>
          </view>
        </Sticky>
      </view>

      <!-- Offset Top -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Offset Top</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Sticky :offset-top="50">
          <view :style="{ backgroundColor: '#07c160', padding: 12, borderRadius: 4 }">
            <text :style="{ color: '#fff', fontSize: 14 }">Sticky with 50px offset</text>
          </view>
        </Sticky>
      </view>

      <!-- Bottom Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Bottom Position</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Sticky position="bottom" :offset-bottom="50">
          <view :style="{ backgroundColor: '#ff976a', padding: 12, borderRadius: 4 }">
            <text :style="{ color: '#fff', fontSize: 14 }">Sticky Bottom</text>
          </view>
        </Sticky>
      </view>

      <!-- Custom Z-Index -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Z-Index</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Sticky :z-index="200">
          <view :style="{ backgroundColor: '#ee0a24', padding: 12, borderRadius: 4 }">
            <text :style="{ color: '#fff', fontSize: 14 }">Z-Index: 200</text>
          </view>
        </Sticky>
      </view>
    </view>
  </DemoPage>
</template>
