<script setup lang="ts">
import { useRouter } from 'vue-router';
import SwipeCell from '../components/SwipeCell/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">SwipeCell</text>
    </view>

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
  </view>
</template>
