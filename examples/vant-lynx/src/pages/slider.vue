<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Slider from '../components/Slider/index.vue';
import Toast from '../components/Toast/index.vue';

const value1 = ref(50);
const value2 = ref<[number, number]>([20, 60]);
const value3 = ref(0);
const value4 = ref(50);
const value5 = ref(50);
const value6 = ref(50);
const value7 = ref(50);
const value8 = ref(50);
const value9 = ref<[number, number]>([20, 60]);

const toastShow = ref(false);
const toastMessage = ref('');

const onChange = (value: number | [number, number]) => {
  toastMessage.value = '当前值：' + value;
  toastShow.value = true;
};
</script>

<template>
  <DemoPage title="Slider 滑块">
    <!-- 基础用法 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">基础用法</text>
      <view class="demo-slider-content">
        <Slider v-model="value1" @change="onChange" />
      </view>
    </view>

    <!-- 双滑块 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">双滑块</text>
      <view class="demo-slider-content">
        <Slider v-model="value2" range @change="onChange" />
      </view>
    </view>

    <!-- 指定选择范围 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">指定选择范围</text>
      <view class="demo-slider-content">
        <Slider v-model="value3" :min="-50" :max="50" @change="onChange" />
      </view>
    </view>

    <!-- 禁用 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">禁用</text>
      <view class="demo-slider-content">
        <Slider v-model="value4" disabled />
      </view>
    </view>

    <!-- 指定步长 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">指定步长</text>
      <view class="demo-slider-content">
        <Slider v-model="value5" :step="10" @change="onChange" />
      </view>
    </view>

    <!-- 自定义样式 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">自定义样式</text>
      <view class="demo-slider-content">
        <Slider
          v-model="value6"
          bar-height="4px"
          active-color="#ee0a24"
          @change="onChange"
        />
      </view>
    </view>

    <!-- 自定义按钮 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">自定义按钮</text>
      <view class="demo-slider-content">
        <Slider v-model="value7">
          <template #button>
            <view class="custom-button">
              <text class="custom-button-text">{{ value7 }}</text>
            </view>
          </template>
        </Slider>
      </view>
    </view>

    <!-- 垂直方向 -->
    <view class="demo-slider-block">
      <text class="demo-slider-title">垂直方向</text>
      <view class="demo-slider-vertical-wrap">
        <Slider v-model="value8" vertical @change="onChange" />
        <Slider
          v-model="value9"
          range
          vertical
          :style="{ marginLeft: '100px' }"
          @change="onChange"
        />
      </view>
    </view>
  </DemoPage>

  <Toast v-model:show="toastShow" :message="toastMessage" />
</template>

<style>
.demo-slider-block {
  padding: 0 16px 20px;
}

.demo-slider-title {
  font-size: 14px;
  color: var(--van-text-color-2, #969799);
  padding: 16px 0 8px;
}

.demo-slider-content {
  padding: 10px 0;
}

.demo-slider-vertical-wrap {
  display: flex;
  flex-direction: row;
  height: 150px;
  padding-left: 30px;
}

.custom-button {
  width: 26px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--van-primary-color, #1989fa);
  border-radius: 100px;
}

.custom-button-text {
  color: #fff;
  font-size: 10px;
}
</style>
