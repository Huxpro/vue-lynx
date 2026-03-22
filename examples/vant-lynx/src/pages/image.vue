<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import VanImage from '../components/Image/index.vue';
import Loading from '../components/Loading/index.vue';

const imgSrc = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg';
const fitModes = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;
</script>

<template>
  <DemoPage title="Image 图片">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">基础用法</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <VanImage :src="imgSrc" :width="100" :height="100" />
      </view>

      <!-- 填充模式 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">填充模式</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view v-for="fit in fitModes" :key="fit" :style="{ marginRight: '16px', marginBottom: '16px', alignItems: 'center' }">
          <VanImage :src="imgSrc" :width="100" :height="100" :fit="fit" />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: '4px', textAlign: 'center' }">{{ fit }}</text>
        </view>
      </view>

      <!-- 位置 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">位置</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view v-for="pos in ['left', 'center', 'right']" :key="'cover-' + pos" :style="{ marginRight: '16px', marginBottom: '16px', alignItems: 'center' }">
          <VanImage :src="imgSrc" :width="100" :height="100" fit="cover" :position="pos" />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: '4px', textAlign: 'center' }">cover / {{ pos }}</text>
        </view>
      </view>

      <!-- 圆形图片 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">圆形图片</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view v-for="fit in fitModes" :key="'round-' + fit" :style="{ marginRight: '16px', marginBottom: '16px', alignItems: 'center' }">
          <VanImage :src="imgSrc" :width="100" :height="100" :fit="fit" round />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: '4px', textAlign: 'center' }">{{ fit }}</text>
        </view>
      </view>

      <!-- 加载中提示 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">加载中提示</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: '16px', alignItems: 'center' }">
          <VanImage :width="100" :height="100" />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: '4px', textAlign: 'center' }">默认提示</text>
        </view>
        <view :style="{ alignItems: 'center' }">
          <VanImage :width="100" :height="100">
            <template #loading>
              <Loading type="spinner" size="20" />
            </template>
          </VanImage>
          <text :style="{ fontSize: 12, color: '#969799', marginTop: '4px', textAlign: 'center' }">自定义提示</text>
        </view>
      </view>

      <!-- 加载失败提示 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">加载失败提示</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16 }">
        <view :style="{ marginRight: '16px', alignItems: 'center' }">
          <VanImage src="https://invalid-url" :width="100" :height="100" />
          <text :style="{ fontSize: 12, color: '#969799', marginTop: '4px', textAlign: 'center' }">默认提示</text>
        </view>
        <view :style="{ alignItems: 'center' }">
          <VanImage src="https://invalid-url" :width="100" :height="100">
            <template #error>
              <text :style="{ fontSize: 14, color: '#969799' }">加载失败</text>
            </template>
          </VanImage>
          <text :style="{ fontSize: 12, color: '#969799', marginTop: '4px', textAlign: 'center' }">自定义提示</text>
        </view>
      </view>
    </view>
  </DemoPage>
</template>
