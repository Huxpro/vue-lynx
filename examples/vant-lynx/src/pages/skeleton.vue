<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Skeleton from '../components/Skeleton/index.vue';
import SkeletonImage from '../components/Skeleton/SkeletonImage.vue';
import SkeletonParagraph from '../components/Skeleton/SkeletonParagraph.vue';
import Switch from '../components/Switch/index.vue';

const show = ref(false);
</script>

<template>
  <DemoPage title="Skeleton">
    <view class="demo-skeleton">
      <!-- Basic Usage -->
      <text class="demo-skeleton__section-title">基础用法</text>
      <view class="demo-skeleton__section">
        <Skeleton :row="3" title />
      </view>

      <!-- Show Avatar -->
      <text class="demo-skeleton__section-title">显示头像</text>
      <view class="demo-skeleton__section">
        <Skeleton :row="3" title avatar />
      </view>

      <!-- Show Children -->
      <text class="demo-skeleton__section-title">显示子组件</text>
      <view class="demo-skeleton__section">
        <view class="demo-skeleton__switch">
          <Switch v-model="show" />
        </view>
        <Skeleton :row="3" title avatar :loading="!show">
          <view class="demo-skeleton__preview">
            <view class="demo-skeleton__preview-avatar" />
            <view class="demo-skeleton__preview-content">
              <text class="demo-skeleton__preview-title">关于 Vant</text>
              <text class="demo-skeleton__preview-desc">Vant 是一套轻量、可定制的移动端 Vue 组件库，提供了丰富的基础组件和业务组件，帮助开发者快速搭建移动应用。</text>
            </view>
          </view>
        </Skeleton>
      </view>

      <!-- Custom Content -->
      <text class="demo-skeleton__section-title">自定义展示内容</text>
      <view class="demo-skeleton__section">
        <Skeleton>
          <template #template>
            <view class="demo-skeleton__custom">
              <SkeletonImage />
              <view class="demo-skeleton__custom-lines">
                <SkeletonParagraph row-width="60%" />
                <SkeletonParagraph />
                <SkeletonParagraph />
                <SkeletonParagraph />
              </view>
            </view>
          </template>
        </Skeleton>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-skeleton {
  display: flex;
  flex-direction: column;
}

.demo-skeleton__section-title {
  font-size: 14px;
  color: #969799;
  padding-top: 16px;
  padding-bottom: 8px;
  padding-left: 16px;
}

.demo-skeleton__section {
  background-color: #fff;
  padding-top: 8px;
  padding-bottom: 8px;
}

.demo-skeleton__switch {
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 8px;
}

.demo-skeleton__preview {
  display: flex;
  flex-direction: row;
  padding-left: 16px;
  padding-right: 16px;
}

.demo-skeleton__preview-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #1989fa;
  margin-right: 16px;
  flex-shrink: 0;
}

.demo-skeleton__preview-content {
  display: flex;
  flex-direction: column;
}

.demo-skeleton__preview-title {
  font-size: 18px;
  font-weight: bold;
  color: #323233;
}

.demo-skeleton__preview-desc {
  font-size: 14px;
  color: #969799;
  margin-top: 13px;
  line-height: 20px;
}

.demo-skeleton__custom {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.demo-skeleton__custom-lines {
  flex: 1;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
}
</style>
