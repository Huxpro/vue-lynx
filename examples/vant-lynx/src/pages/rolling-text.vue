<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import RollingText from '../components/RollingText/index.vue';
import Button from '../components/Button/index.vue';

const isStart = ref(false);
const isStart2 = ref(false);
const isStart3 = ref(false);
const isStart4 = ref(false);
const isStartNoNumberType = ref(false);

const textList = ref([
  'aaaaa',
  'bbbbb',
  'ccccc',
  'ddddd',
  'eeeee',
  'fffff',
  'ggggg',
]);

const rollingTextRef = ref<{ start: () => void; reset: () => void } | null>(null);
const startManual = () => {
  rollingTextRef.value?.start();
};
const resetManual = () => {
  rollingTextRef.value?.reset();
};
</script>

<template>
  <DemoPage title="RollingText 翻滚文本">
    <view :style="{ padding: '16px' }">
      <!-- 基础用法 -->
      <text class="demo-rolling-text__title">基础用法</text>
      <view class="demo-rolling-text__card">
        <RollingText :start-num="0" :target-num="123" :auto-start="isStart" />
        <view :style="{ marginTop: '10px' }">
          <Button type="primary" @tap="isStart = true">向下翻滚</Button>
        </view>
      </view>

      <!-- 设置翻滚方向 -->
      <text class="demo-rolling-text__title">设置翻滚方向</text>
      <view class="demo-rolling-text__card">
        <RollingText
          :start-num="0"
          :target-num="432"
          :auto-start="isStart2"
          direction="up"
        />
        <view :style="{ marginTop: '10px' }">
          <Button type="primary" @tap="isStart2 = true">向上翻滚</Button>
        </view>
      </view>

      <!-- 设置各数位停止顺序 -->
      <text class="demo-rolling-text__title">设置各数位停止顺序</text>
      <view class="demo-rolling-text__card">
        <RollingText
          :start-num="0"
          :target-num="54321"
          :auto-start="isStart3"
          stop-order="rtl"
        />
        <view :style="{ marginTop: '10px' }">
          <Button type="primary" @tap="isStart3 = true">从个位停止</Button>
        </view>
      </view>

      <!-- 翻转非数字内容 -->
      <text class="demo-rolling-text__title">翻转非数字内容</text>
      <view class="demo-rolling-text__card">
        <RollingText
          :text-list="textList"
          :duration="1"
          :auto-start="isStartNoNumberType"
        />
        <view :style="{ marginTop: '10px' }">
          <Button type="primary" @tap="isStartNoNumberType = true">开始</Button>
        </view>
      </view>

      <!-- 自定义样式 -->
      <text class="demo-rolling-text__title">自定义样式</text>
      <view class="demo-rolling-text__card">
        <RollingText
          class="my-rolling-text"
          :start-num="12345"
          :target-num="54321"
          :auto-start="isStart4"
          :height="54"
        />
      </view>

      <!-- 手动控制 -->
      <text class="demo-rolling-text__title">手动控制</text>
      <view class="demo-rolling-text__card">
        <RollingText
          class="my-rolling-text"
          ref="rollingTextRef"
          :start-num="0"
          :target-num="54321"
          :auto-start="false"
          :height="54"
        />
        <view :style="{ marginTop: '10px', display: 'flex', flexDirection: 'row' }">
          <Button type="primary" @tap="startManual" :style="{ marginRight: '10px' }">开始</Button>
          <Button @tap="resetManual">重置</Button>
        </view>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-rolling-text__title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}

.demo-rolling-text__card {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.my-rolling-text {
  --van-rolling-text-background: #1989fa;
  --van-rolling-text-color: white;
  --van-rolling-text-font-size: 24px;
  --van-rolling-text-gap: 6px;
  --van-rolling-text-item-border-radius: 5px;
  --van-rolling-text-item-width: 40px;
}
</style>
