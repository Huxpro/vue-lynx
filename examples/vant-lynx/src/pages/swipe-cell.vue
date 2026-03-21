<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import SwipeCell from '../components/SwipeCell/index.vue';
import Button from '../components/Button/index.vue';

function beforeClose({ position }: { name: string | number; position: string }) {
  if (position === 'right') {
    return false;
  }
  return true;
}
</script>

<template>
  <DemoPage title="SwipeCell">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <SwipeCell :right-width="65">
          <view :style="{ padding: 16 }">
            <text :style="{ fontSize: 14, color: '#323233' }">Swipe Left to reveal Delete</text>
          </view>
          <template #right>
            <view :style="{ width: 65, height: '100%', backgroundColor: '#ee0a24', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: 14, color: '#fff' }">Delete</text>
            </view>
          </template>
        </SwipeCell>
      </view>

      <!-- Left and Right Actions -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Left and Right Actions</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <SwipeCell :left-width="65" :right-width="130">
          <template #left>
            <view :style="{ width: 65, height: '100%', backgroundColor: '#07c160', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
              <text :style="{ fontSize: 14, color: '#fff' }">Select</text>
            </view>
          </template>
          <view :style="{ padding: 16 }">
            <text :style="{ fontSize: 14, color: '#323233' }">Swipe both directions</text>
          </view>
          <template #right>
            <view :style="{ display: 'flex', flexDirection: 'row', height: '100%' }">
              <view :style="{ width: 65, height: '100%', backgroundColor: '#1989fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                <text :style="{ fontSize: 14, color: '#fff' }">Edit</text>
              </view>
              <view :style="{ width: 65, height: '100%', backgroundColor: '#ee0a24', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                <text :style="{ fontSize: 14, color: '#fff' }">Delete</text>
              </view>
            </view>
          </template>
        </SwipeCell>
      </view>

      <!-- Before Close -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Before Close (right blocked)</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <SwipeCell :right-width="65" :before-close="beforeClose">
          <view :style="{ padding: 16 }">
            <text :style="{ fontSize: 14, color: '#323233' }">Tap delete won't close</text>
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
