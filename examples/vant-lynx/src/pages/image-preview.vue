<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ImagePreview from '../components/ImagePreview/index.vue';
const showBasic = ref(false);
const showCloseable = ref(false);
const showIndicators = ref(false);
const showStartPos = ref(false);

const images = [
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-3.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-4.jpeg',
];

function onClose(info: { index: number; url: string }) {
  // close handler
}
</script>

<template>
  <DemoPage title="ImagePreview">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view
        :style="{
          backgroundColor: '#1989fa',
          borderRadius: 4,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }"
        @tap="showBasic = true"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">Preview Images</text>
      </view>

      <!-- Closeable -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Closeable</text>
      <view
        :style="{
          backgroundColor: '#1989fa',
          borderRadius: 4,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }"
        @tap="showCloseable = true"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">With Close Button</text>
      </view>

      <!-- With Indicators -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Indicators</text>
      <view
        :style="{
          backgroundColor: '#1989fa',
          borderRadius: 4,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }"
        @tap="showIndicators = true"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">With Indicators</text>
      </view>

      <!-- Custom Start Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Start Position</text>
      <view
        :style="{
          backgroundColor: '#1989fa',
          borderRadius: 4,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 16,
          paddingRight: 16,
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }"
        @tap="showStartPos = true"
      >
        <text :style="{ fontSize: 14, color: '#fff' }">Start from 3rd Image</text>
      </view>
    </view>

    <!-- ImagePreview instances -->
    <ImagePreview
      :show="showBasic"
      :images="images"
      @update:show="(v: boolean) => showBasic = v"
      @close="onClose"
    />

    <ImagePreview
      :show="showCloseable"
      :images="images"
      closeable
      @update:show="(v: boolean) => showCloseable = v"
      @close="onClose"
    />

    <ImagePreview
      :show="showIndicators"
      :images="images"
      show-indicators
      @update:show="(v: boolean) => showIndicators = v"
      @close="onClose"
    />

    <ImagePreview
      :show="showStartPos"
      :images="images"
      :start-position="2"
      @update:show="(v: boolean) => showStartPos = v"
      @close="onClose"
    />
  </DemoPage>
</template>
