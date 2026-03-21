<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Skeleton from '../components/Skeleton/index.vue';
const loading = ref(true);

function toggleLoading() {
  loading.value = !loading.value;
}
</script>

<template>
  <DemoPage title="Skeleton">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Basic Usage</text>
      <view :style="{ backgroundColor: '#fff', padding: 4 }">
        <Skeleton :row="3" title />
      </view>

      <!-- Show Avatar -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Show Avatar</text>
      <view :style="{ backgroundColor: '#fff', padding: 4 }">
        <Skeleton :row="3" title avatar />
      </view>

      <!-- Square Avatar -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Square Avatar</text>
      <view :style="{ backgroundColor: '#fff', padding: 4 }">
        <Skeleton :row="3" title avatar avatar-shape="square" :avatar-size="48" />
      </view>

      <!-- Custom Row Width -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Custom Row Width</text>
      <view :style="{ backgroundColor: '#fff', padding: 4 }">
        <Skeleton :row="3" :row-width="['100%', '80%', '60%']" title />
      </view>

      <!-- Toggle Loading -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">Toggle Loading</text>
      <view :style="{ backgroundColor: '#fff', padding: 4 }">
        <view :style="{ display: 'flex', flexDirection: 'row', padding: 12 }">
          <view
            :style="{
              backgroundColor: '#1989fa',
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 4,
            }"
            @tap="toggleLoading"
          >
            <text :style="{ fontSize: 14, color: '#fff' }">{{ loading ? 'Show Content' : 'Show Skeleton' }}</text>
          </view>
        </view>
        <Skeleton :row="3" title avatar :loading="loading">
          <view :style="{ display: 'flex', flexDirection: 'row', padding: 16 }">
            <view :style="{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#1989fa', marginRight: 16 }" />
            <view :style="{ display: 'flex', flexDirection: 'column' }">
              <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#323233', marginBottom: 8 }">About Vant</text>
              <text :style="{ fontSize: 14, color: '#969799' }">Vant is a lightweight, customizable Vue UI library for mobile web apps.</text>
            </view>
          </view>
        </Skeleton>
      </view>

      <!-- No Animation -->
      <text :style="{ fontSize: 14, color: '#969799', padding: 12 }">No Animation</text>
      <view :style="{ backgroundColor: '#fff', padding: 4 }">
        <Skeleton :row="3" title :animate="false" />
      </view>
    </view>
  </DemoPage>
</template>
