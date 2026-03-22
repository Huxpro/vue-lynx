<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Signature from '../components/Signature/index.vue';

const imageData = ref('');

function onSubmit(data: { image: string; canvas: null }) {
  imageData.value = data.image;
}

function onClear() {
  imageData.value = '';
}
</script>

<template>
  <DemoPage title="Signature 签名">
    <!-- 基础用法 -->
    <view class="demo-signature-block">
      <text class="demo-signature-title">基础用法</text>
      <Signature @submit="onSubmit" @clear="onClear" />
    </view>

    <!-- Preview -->
    <view v-if="imageData" class="demo-signature-block">
      <text class="demo-signature-title">签名结果</text>
      <text class="demo-signature-result">{{ imageData.slice(0, 80) }}...</text>
    </view>

    <!-- 自定义颜色 -->
    <view class="demo-signature-block">
      <text class="demo-signature-title">自定义颜色</text>
      <Signature pen-color="#ff0000" @submit="onSubmit" @clear="onClear" />
    </view>

    <!-- 自定义线宽 -->
    <view class="demo-signature-block">
      <text class="demo-signature-title">自定义线宽</text>
      <Signature :line-width="6" @submit="onSubmit" @clear="onClear" />
    </view>

    <!-- 自定义背景颜色 -->
    <view class="demo-signature-block">
      <text class="demo-signature-title">自定义背景颜色</text>
      <Signature background-color="#eee" @submit="onSubmit" @clear="onClear" />
    </view>
  </DemoPage>
</template>

<style>
.demo-signature-block {
  margin-bottom: 16px;
}

.demo-signature-title {
  font-size: 14px;
  color: #969799;
  padding-left: 16px;
  margin-bottom: 12px;
}

.demo-signature-result {
  font-size: 12px;
  color: #969799;
  padding-left: 16px;
  padding-right: 16px;
}
</style>
