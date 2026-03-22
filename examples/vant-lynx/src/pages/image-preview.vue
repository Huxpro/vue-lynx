<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import ImagePreview from '../components/ImagePreview/index.vue';

const images = [
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-3.jpeg',
  'https://fastly.jsdelivr.net/npm/@vant/assets/apple-4.jpeg',
];

// Basic Usage
const showBasic = ref(false);

// Custom Config
const showStartPos = ref(false);
const showCloseable = ref(false);
const showCloseEvent = ref(false);

// Before Close
const showBeforeClose = ref(false);

// Component usage
const showComponent = ref(false);
const componentIndex = ref(0);

const onClose = () => {
  // close handler
};

const beforeClose = () =>
  new Promise<boolean>((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });

const onComponentChange = (newIndex: number) => {
  componentIndex.value = newIndex;
};
</script>

<template>
  <DemoPage title="ImagePreview 图片预览">
    <!-- 基础用法 -->
    <view class="van-doc-demo-block">
      <view class="van-doc-demo-block__title">
        <text>基础用法</text>
      </view>
      <Cell is-link title="预览图片" @click="showBasic = true" />
    </view>

    <!-- 传入配置项 -->
    <view class="van-doc-demo-block">
      <view class="van-doc-demo-block__title">
        <text>传入配置项</text>
      </view>
      <Cell is-link title="指定初始位置" @click="showStartPos = true" />
      <Cell is-link title="展示关闭按钮" @click="showCloseable = true" />
      <Cell is-link title="监听关闭事件" @click="showCloseEvent = true" />
    </view>

    <!-- 异步关闭 -->
    <view class="van-doc-demo-block">
      <view class="van-doc-demo-block__title">
        <text>异步关闭</text>
      </view>
      <Cell is-link title="异步关闭" @click="showBeforeClose = true" />
    </view>

    <!-- 使用 ImagePreview 组件 -->
    <view class="van-doc-demo-block">
      <view class="van-doc-demo-block__title">
        <text>使用 ImagePreview 组件</text>
      </view>
      <Cell is-link title="使用 ImagePreview 组件" @click="showComponent = true" />
      <ImagePreview
        v-model:show="showComponent"
        :images="images"
        @change="onComponentChange"
      >
        <template #index>
          <text>第{{ componentIndex + 1 }}页</text>
        </template>
      </ImagePreview>
    </view>

    <!-- ImagePreview instances -->
    <ImagePreview
      v-model:show="showBasic"
      :images="images"
    />

    <ImagePreview
      v-model:show="showStartPos"
      :images="images"
      :start-position="1"
    />

    <ImagePreview
      v-model:show="showCloseable"
      :images="images"
      closeable
    />

    <ImagePreview
      v-model:show="showCloseEvent"
      :images="images"
      @close="onClose"
    />

    <ImagePreview
      v-model:show="showBeforeClose"
      :images="images"
      :before-close="beforeClose"
    />
  </DemoPage>
</template>
