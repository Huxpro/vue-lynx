<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ImagePreview from '../components/ImagePreview/index.vue';
import Button from '../components/Button/index.vue';

const showBasic = ref(false);
const showCloseable = ref(false);
const showIndicators = ref(false);
const showStartPos = ref(false);
const showBeforeClose = ref(false);

const images = [
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-3.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-4.jpeg',
];

const closeLog = ref('');

function onClose(info: { index: number; url: string }) {
  closeLog.value = `Closed at index: ${info.index}`;
}
</script>

<template>
  <DemoPage title="ImagePreview">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showBasic = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Preview Images</text>
        </Button>
      </view>

      <!-- Set Start Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Set Start Position</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showStartPos = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Start from 3rd</text>
        </Button>
      </view>

      <!-- Show Close Button -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Close Button</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showCloseable = true">
          <text :style="{ fontSize: 14, color: '#fff' }">With Close Button</text>
        </Button>
      </view>

      <!-- Show Indicators -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Indicators</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showIndicators = true">
          <text :style="{ fontSize: 14, color: '#fff' }">With Indicators</text>
        </Button>
      </view>

      <!-- Close Event -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Close Event</text>
      <view :style="{ marginBottom: 8 }">
        <Button type="primary" @tap="showBeforeClose = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Listen Close</text>
        </Button>
      </view>
      <view v-if="closeLog" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">{{ closeLog }}</text>
      </view>
    </view>

    <ImagePreview
      :show="showBasic"
      :images="images"
      @update:show="(v: boolean) => showBasic = v"
    />

    <ImagePreview
      :show="showStartPos"
      :images="images"
      :start-position="2"
      @update:show="(v: boolean) => showStartPos = v"
    />

    <ImagePreview
      :show="showCloseable"
      :images="images"
      closeable
      @update:show="(v: boolean) => showCloseable = v"
    />

    <ImagePreview
      :show="showIndicators"
      :images="images"
      show-indicators
      @update:show="(v: boolean) => showIndicators = v"
    />

    <ImagePreview
      :show="showBeforeClose"
      :images="images"
      @update:show="(v: boolean) => showBeforeClose = v"
      @close="onClose"
    />
  </DemoPage>
</template>
