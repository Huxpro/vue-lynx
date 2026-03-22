<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Toast from '../components/Toast/index.vue';
import { ref } from 'vue-lynx';
import {
  showToast,
  showLoadingToast,
  showSuccessToast,
  showFailToast,
  closeToast,
  toastState,
} from '../components/Toast/toast';

// Component usage state
const showComponentToast = ref(false);

// Basic Usage
function onShowText() {
  showToast('提示内容');
}

function onShowLoading() {
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
  });
}

function onShowSuccess() {
  showSuccessToast('成功文案');
}

function onShowFail() {
  showFailToast('失败文案');
}

// Custom Icon
function onShowCustomIcon() {
  showToast({
    message: '自定义图标',
    icon: 'like-o',
  });
}

function onShowCustomImage() {
  showToast({
    message: '自定义图片',
    icon: 'star',
  });
}

function onShowLoadingSpinner() {
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
    loadingType: 'spinner',
  });
}

// Custom Position
function onShowTopToast() {
  showToast({
    message: '顶部展示',
    position: 'top',
  });
}

function onShowBottomToast() {
  showToast({
    message: '底部展示',
    position: 'bottom',
  });
}

// Word Break
function onShowBreakAll() {
  showToast({
    message: 'This message will contain a incomprehensibilities long word.',
    wordBreak: 'break-all',
  });
}

function onShowBreakWord() {
  showToast({
    message: 'This message will contain a incomprehensibilities long word.',
    wordBreak: 'break-word',
  });
}

// Update Message
function onShowUpdateMessage() {
  const toast = showLoadingToast({
    duration: 0,
    forbidClick: true,
    message: '倒计时 3 秒',
  });

  let second = 3;
  const timer = setInterval(() => {
    second--;
    if (second) {
      toast.message = `倒计时 ${second} 秒`;
    } else {
      clearInterval(timer);
      closeToast();
    }
  }, 1000);
}
</script>

<template>
  <DemoPage title="Toast 轻提示">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">基础用法</text>
      <CellGroup>
        <Cell title="文字提示" is-link @click="onShowText" />
        <Cell title="加载提示" is-link @click="onShowLoading" />
        <Cell title="成功提示" is-link @click="onShowSuccess" />
        <Cell title="失败提示" is-link @click="onShowFail" :border="false" />
      </CellGroup>

      <!-- 自定义图标 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">自定义图标</text>
      <CellGroup>
        <Cell title="自定义图标" is-link @click="onShowCustomIcon" />
        <Cell title="自定义图片" is-link @click="onShowCustomImage" />
        <Cell title="自定义加载图标" is-link @click="onShowLoadingSpinner" :border="false" />
      </CellGroup>

      <!-- 自定义位置 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">自定义位置</text>
      <CellGroup>
        <Cell title="顶部展示" is-link @click="onShowTopToast" />
        <Cell title="底部展示" is-link @click="onShowBottomToast" :border="false" />
      </CellGroup>

      <!-- 文字换行方式 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">文字换行方式</text>
      <CellGroup>
        <Cell title="换行时截断单词" is-link @click="onShowBreakAll" />
        <Cell title="换行时不截断单词" is-link @click="onShowBreakWord" :border="false" />
      </CellGroup>

      <!-- 动态更新提示 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">动态更新提示</text>
      <CellGroup>
        <Cell title="动态更新提示" is-link @click="onShowUpdateMessage" :border="false" />
      </CellGroup>

      <!-- 使用 Toast 组件 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">使用 Toast 组件</text>
      <CellGroup>
        <Cell title="使用 Toast 组件" is-link @click="showComponentToast = true" :border="false" />
      </CellGroup>
    </view>

    <!-- Programmatic toast (driven by toastState) -->
    <Toast
      :show="toastState.show"
      :type="toastState.type"
      :message="toastState.message"
      :position="toastState.position"
      :overlay="toastState.overlay"
      :icon="toastState.icon"
      :icon-size="toastState.iconSize"
      :duration="0"
      :forbid-click="toastState.forbidClick"
      :loading-type="toastState.loadingType"
      :z-index="toastState.zIndex"
      :word-break="toastState.wordBreak"
      @update:show="(v: boolean) => { if (!v) closeToast(); }"
    />

    <!-- Component usage toast with message slot -->
    <Toast
      v-model:show="showComponentToast"
      :style="{ padding: 0 }"
    >
      <template #message>
        <view :style="{
          width: '200px',
          height: '140px',
          backgroundColor: '#f2f3f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }">
          <text :style="{ fontSize: '14px', color: '#969799' }">Custom Content</text>
        </view>
      </template>
    </Toast>
  </DemoPage>
</template>
