<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import ShareSheet from '../components/ShareSheet/index.vue';
import Button from '../components/Button/index.vue';

const showBasic = ref(false);
const showMulti = ref(false);
const showDesc = ref(false);

const basicOptions = [
  { name: 'WeChat', icon: 'wechat' },
  { name: 'Weibo', icon: 'weibo' },
  { name: 'Link', icon: 'link' },
  { name: 'QR Code', icon: 'qrcode' },
];

const multiOptions = [
  [
    { name: 'WeChat', icon: 'wechat' },
    { name: 'Weibo', icon: 'weibo' },
    { name: 'QQ', icon: 'qq' },
  ],
  [
    { name: 'Link', icon: 'link' },
    { name: 'Poster', icon: 'poster' },
    { name: 'QR Code', icon: 'qrcode' },
  ],
];

const descOptions = [
  { name: 'WeChat', icon: 'wechat', description: 'Share to friends' },
  { name: 'Weibo', icon: 'weibo', description: 'Share to timeline' },
  { name: 'Link', icon: 'link', description: 'Copy link' },
];

const showCustomIcon = ref(false);
const customIconOptions = [
  { name: 'Custom', icon: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-icon-fire.png' },
  { name: 'Custom', icon: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-icon-light.png' },
  { name: 'Custom', icon: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-icon-water.png' },
];
</script>

<template>
  <DemoPage title="ShareSheet">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showBasic = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Show ShareSheet</text>
        </Button>
      </view>

      <!-- Multi Line -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Multi Line</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showMulti = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Multi Line Options</text>
        </Button>
      </view>

      <!-- Show Description -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Show Description</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showDesc = true">
          <text :style="{ fontSize: 14, color: '#fff' }">With Description</text>
        </Button>
      </view>

      <!-- Custom Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showCustomIcon = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Custom Icon Options</text>
        </Button>
      </view>
    </view>

    <ShareSheet v-model:show="showBasic" title="Share To" :options="basicOptions" />
    <ShareSheet v-model:show="showMulti" title="Share To" :options="multiOptions" />
    <ShareSheet
      v-model:show="showDesc"
      title="Share To"
      description="Choose a platform to share"
      :options="descOptions"
    />
    <ShareSheet v-model:show="showCustomIcon" title="Share To" :options="customIconOptions" />
  </DemoPage>
</template>
