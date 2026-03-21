<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import PullRefresh from '../components/PullRefresh/index.vue';
const loading1 = ref(false);
const count1 = ref(0);
const loading2 = ref(false);
const count2 = ref(0);
const loading3 = ref(false);
const count3 = ref(0);
const loading4 = ref(false);
const count4 = ref(0);

function onRefresh1() {
  setTimeout(() => {
    count1.value++;
    loading1.value = false;
  }, 1000);
}

function onRefresh2() {
  setTimeout(() => {
    count2.value++;
    loading2.value = false;
  }, 1000);
}

function onRefresh3() {
  setTimeout(() => {
    count3.value++;
    loading3.value = false;
  }, 1500);
}

function onRefresh4() {
  setTimeout(() => {
    count4.value++;
    loading4.value = false;
  }, 1500);
}
</script>

<template>
  <DemoPage title="PullRefresh">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <PullRefresh v-model="loading1" @refresh="onRefresh1">
          <view :style="{ padding: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 14, color: '#969799' }">Pull down to refresh. Count: {{ count1 }}</text>
          </view>
        </PullRefresh>
      </view>

      <!-- Success Tip -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Success Tip</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <PullRefresh v-model="loading2" success-text="Refresh success" @refresh="onRefresh2">
          <view :style="{ padding: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 14, color: '#969799' }">Pull down to refresh. Count: {{ count2 }}</text>
          </view>
        </PullRefresh>
      </view>

      <!-- Custom Text -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Text</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <PullRefresh
          v-model="loading3"
          pulling-text="Pull down..."
          loosing-text="Release now..."
          loading-text="Refreshing..."
          success-text="Done!"
          @refresh="onRefresh3"
        >
          <view :style="{ padding: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 14, color: '#969799' }">Custom text hints. Count: {{ count3 }}</text>
          </view>
        </PullRefresh>
      </view>

      <!-- Custom Tips (slots) -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Tips</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <PullRefresh
          v-model="loading4"
          :head-height="80"
          @refresh="onRefresh4"
        >
          <template #pulling="{ distance }">
            <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
              <text :style="{ fontSize: 24, marginBottom: 4 }">👇</text>
              <text :style="{ fontSize: 12, color: '#969799' }">Pull ({{ Math.round(distance) }}px)</text>
            </view>
          </template>
          <template #loosing>
            <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
              <text :style="{ fontSize: 24, marginBottom: 4 }">🔄</text>
              <text :style="{ fontSize: 12, color: '#969799' }">Release to refresh</text>
            </view>
          </template>
          <template #loading>
            <view :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center' }">
              <text :style="{ fontSize: 24, marginBottom: 4 }">⏳</text>
              <text :style="{ fontSize: 12, color: '#969799' }">Loading...</text>
            </view>
          </template>
          <view :style="{ padding: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
            <text :style="{ fontSize: 14, color: '#969799' }">Custom slot tips. Count: {{ count4 }}</text>
          </view>
        </PullRefresh>
      </view>
    </view>
  </DemoPage>
</template>
