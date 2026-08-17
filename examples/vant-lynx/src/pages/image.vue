<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import VanImage from '../components/Image/index.vue';
import Loading from '../components/Loading/index.vue';

const imgSrc = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg';
const fitModes = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;
const positions1 = ['left', 'center', 'right'] as const;
const positions2 = ['top', 'center', 'bottom'] as const;
</script>

<template>
  <DemoPage title="Image 图片">
    <view class="demo-image">
      <!-- 基础用法 -->
      <text class="demo-image__title">基础用法</text>
      <view class="demo-image__row">
        <VanImage :src="imgSrc" width="100" height="100" />
      </view>

      <!-- 填充模式 -->
      <text class="demo-image__title">填充模式</text>
      <view class="demo-image__row">
        <view v-for="fit in fitModes" :key="fit" class="demo-image__item">
          <VanImage :src="imgSrc" width="100" height="100" :fit="fit" />
          <text class="demo-image__text">{{ fit }}</text>
        </view>
      </view>

      <!-- 图片位置 -->
      <text class="demo-image__title">图片位置</text>
      <view class="demo-image__row">
        <view v-for="pos in positions1" :key="'cover-' + pos" class="demo-image__item">
          <VanImage :src="imgSrc" width="100" height="100" fit="cover" :position="pos" />
          <text class="demo-image__text">cover</text>
          <text class="demo-image__text">{{ pos }}</text>
        </view>
      </view>
      <view class="demo-image__row">
        <view v-for="pos in positions2" :key="'contain-' + pos" class="demo-image__item">
          <VanImage :src="imgSrc" width="100" height="100" fit="contain" :position="pos" />
          <text class="demo-image__text">contain</text>
          <text class="demo-image__text">{{ pos }}</text>
        </view>
      </view>

      <!-- 圆形图片 -->
      <text class="demo-image__title">圆形图片</text>
      <view class="demo-image__row">
        <view v-for="fit in fitModes" :key="'round-' + fit" class="demo-image__item">
          <VanImage :src="imgSrc" width="100" height="100" :fit="fit" round />
          <text class="demo-image__text">{{ fit }}</text>
        </view>
      </view>

      <!-- 加载中提示 -->
      <text class="demo-image__title">加载中提示</text>
      <view class="demo-image__row">
        <view class="demo-image__item">
          <VanImage width="100" height="100" />
          <text class="demo-image__text">默认提示</text>
        </view>
        <view class="demo-image__item">
          <VanImage width="100" height="100">
            <template #loading>
              <Loading type="spinner" size="20" />
            </template>
          </VanImage>
          <text class="demo-image__text">自定义提示</text>
        </view>
      </view>

      <!-- 加载失败提示 -->
      <text class="demo-image__title">加载失败提示</text>
      <view class="demo-image__row">
        <view class="demo-image__item">
          <VanImage src="https://invalid-url" width="100" height="100" />
          <text class="demo-image__text">默认提示</text>
        </view>
        <view class="demo-image__item">
          <VanImage src="https://invalid-url" width="100" height="100">
            <template #error>
              <text class="demo-image__error-text">加载失败</text>
            </template>
          </VanImage>
          <text class="demo-image__text">自定义提示</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-image {
  padding: 16px;
}

.demo-image__title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}

.demo-image__row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.demo-image__item {
  margin-right: 16px;
  margin-bottom: 16px;
  align-items: center;
}

.demo-image__text {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
  text-align: center;
}

.demo-image__error-text {
  font-size: 14px;
  color: #969799;
}
</style>
