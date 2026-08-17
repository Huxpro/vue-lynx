<script setup lang="ts">
import { ref, watch } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Barrage from '../components/Barrage/index.vue';
import Button from '../components/Button/index.vue';
import Space from '../components/Space/index.vue';
import type { BarrageItem, BarrageExpose } from '../components/Barrage/types';

const defaultList: BarrageItem[] = [
  { id: 100, text: '轻量' },
  { id: 101, text: '可定制的' },
  { id: 102, text: '移动端' },
  { id: 103, text: 'Vue' },
  { id: 104, text: '组件库' },
  { id: 105, text: 'VantUI' },
  { id: 106, text: '666' },
];

// Basic usage
const list = ref<BarrageItem[]>([...defaultList]);
const add = () => {
  list.value = [...list.value, { id: Math.random(), text: 'Barrage' }];
};

// Video barrage
const videoList = ref<BarrageItem[]>([...defaultList]);
const videoBarrage = ref<BarrageExpose | null>(null);
const isPlay = ref(false);

const videoAdd = () => {
  videoList.value = [...videoList.value, { id: Math.random(), text: 'Barrage' }];
};

watch(isPlay, (val) => {
  if (val) {
    videoBarrage.value?.play();
  } else {
    videoBarrage.value?.pause();
  }
});
</script>

<template>
  <DemoPage title="Barrage 弹幕">
    <view :style="{ padding: '16px' }">
      <!-- 基础用法 -->
      <text class="demo-barrage__title">基础用法</text>
      <view class="demo-barrage__card">
        <Barrage v-model="list">
          <view class="demo-barrage__video" />
        </Barrage>
        <Space :style="{ marginTop: '10px' }">
          <Button @tap="add" type="primary" size="small">弹幕</Button>
        </Space>
      </view>

      <!-- 模仿视频弹幕 -->
      <text class="demo-barrage__title">模仿视频弹幕</text>
      <view class="demo-barrage__card">
        <Barrage v-model="videoList" ref="videoBarrage" :auto-play="false">
          <view class="demo-barrage__video" />
        </Barrage>
        <Space :style="{ marginTop: '10px' }">
          <Button @tap="videoAdd" type="primary" size="small" :disabled="!isPlay">弹幕</Button>
          <Button @tap="isPlay = !isPlay" size="small">
            {{ isPlay ? '暂停' : '播放' }}
          </Button>
        </Space>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-barrage__title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}

.demo-barrage__card {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.demo-barrage__video {
  background-color: #ddd;
  width: 100%;
  height: 150px;
}
</style>
