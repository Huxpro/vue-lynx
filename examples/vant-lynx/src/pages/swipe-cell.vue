<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import SwipeCell from '../components/SwipeCell/index.vue';
import Button from '../components/Button/index.vue';
</script>

<template>
  <DemoPage title="SwipeCell">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8 }">
        <SwipeCell :right-width="65">
          <view :style="{ padding: 16 }">
            <text :style="{ fontSize: 14, color: '#323233' }">Swipe Left</text>
          </view>
          <template #right>
            <view :style="{ width: 65, height: '100%', backgroundColor: '#ee0a24', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: 14, color: '#fff' }">Delete</text>
            </view>
          </template>
        </SwipeCell>
      </view>
    </view>
  </DemoPage>
</template>
