<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import NoticeBar from '../components/NoticeBar/index.vue';

const sectionTitleStyle = {
  fontSize: '14px',
  color: '#969799',
  paddingTop: '16px',
  paddingBottom: '8px',
  paddingLeft: '16px',
};

const demoWrap = {
  backgroundColor: '#fff',
};
</script>

<template>
  <DemoPage title="NoticeBar">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="sectionTitleStyle">基础用法</text>
      <view :style="demoWrap">
        <NoticeBar
          scrollable
          left-icon="volume-o"
          text="无论我们能活多久，我们能够享受的只有无法分割的此刻，此外别无其他。"
        />
      </view>

      <!-- Scrollable -->
      <text :style="sectionTitleStyle">滚动播放</text>
      <view :style="demoWrap">
        <NoticeBar :scrollable="true" text="米袋虽空——樱花开哉！" />
        <view :style="{ height: '4px' }" />
        <NoticeBar
          :scrollable="false"
          text="不会回头的东西有四件：说出口的话、离弦的箭、逝去的生活和失去的机会。"
        />
      </view>

      <!-- Wrapable -->
      <text :style="sectionTitleStyle">多行展示</text>
      <view :style="demoWrap">
        <NoticeBar
          wrapable
          :scrollable="false"
          text="不会回头的东西有四件：说出口的话、离弦的箭、逝去的生活和失去的机会。"
        />
      </view>

      <!-- Mode -->
      <text :style="sectionTitleStyle">通知栏模式</text>
      <view :style="demoWrap">
        <NoticeBar mode="closeable" text="米袋虽空——樱花开哉！" />
        <view :style="{ height: '4px' }" />
        <NoticeBar mode="link" text="米袋虽空——樱花开哉！" />
      </view>

      <!-- Custom Style -->
      <text :style="sectionTitleStyle">自定义样式</text>
      <view :style="demoWrap">
        <NoticeBar
          text="米袋虽空——樱花开哉！"
          color="#1989fa"
          background="#ecf9ff"
          left-icon="info-o"
        />
      </view>

      <!-- Vertical Scroll (simplified - Swipe not yet available) -->
      <text :style="sectionTitleStyle">垂直滚动</text>
      <view :style="demoWrap">
        <NoticeBar left-icon="volume-o" :scrollable="false">
          <text>明月直入，无心可猜。</text>
        </NoticeBar>
      </view>
    </view>
  </DemoPage>
</template>
