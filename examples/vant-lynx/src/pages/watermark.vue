<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Watermark from '../components/Watermark/index.vue';
import Button from '../components/Button/index.vue';

const fullPage = ref(false);
</script>

<template>
  <DemoPage title="Watermark 水印">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- Text Watermark -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">文字水印</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', height: '150px', position: 'relative', overflow: 'hidden' }">
        <Watermark content="Vant" :full-page="false" />
      </view>

      <!-- Image Watermark -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">图片水印</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', height: '150px', position: 'relative', overflow: 'hidden' }">
        <Watermark
          image="https://fastly.jsdelivr.net/npm/@vant/assets/vant-watermark.png"
          :opacity="0.2"
          :full-page="false"
        />
      </view>

      <!-- Custom Gap -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义间隔</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', height: '150px', position: 'relative', overflow: 'hidden' }">
        <Watermark
          image="https://fastly.jsdelivr.net/npm/@vant/assets/vant-watermark.png"
          :gap-x="30"
          :gap-y="10"
          :opacity="0.2"
          :full-page="false"
        />
      </view>

      <!-- Custom Rotate -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义倾斜角度</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', height: '150px', position: 'relative', overflow: 'hidden' }">
        <Watermark
          image="https://fastly.jsdelivr.net/npm/@vant/assets/vant-watermark.png"
          :rotate="22"
          :opacity="0.2"
          :full-page="false"
        />
      </view>

      <!-- Display Range -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">显示范围</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', height: '150px', position: 'relative', overflow: 'hidden' }">
        <Button type="primary" @click="fullPage = !fullPage">
          <text :style="{ color: '#fff' }">切换</text>
        </Button>
        <Watermark
          :full-page="fullPage"
          :opacity="0.2"
          image="https://fastly.jsdelivr.net/npm/@vant/assets/vant-watermark.png"
        />
      </view>

      <!-- HTML Watermark -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">HTML 水印</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px', height: '150px', position: 'relative', overflow: 'hidden' }">
        <Watermark :width="150" :full-page="false">
          <template #content>
            <text :style="{ color: '#dcdee0', fontSize: '14px' }">Vant watermark</text>
          </template>
        </Watermark>
      </view>
    </view>
  </DemoPage>
</template>
