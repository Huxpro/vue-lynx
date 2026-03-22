<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Divider from '../components/Divider/index.vue';
</script>

<template>
  <DemoPage title="Divider 分割线">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <Divider />

      <!-- 展示文本 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">展示文本</text>
      <Divider>
        <text>文本</text>
      </Divider>

      <!-- 内容位置 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">内容位置</text>
      <Divider content-position="left">
        <text>文本</text>
      </Divider>
      <Divider content-position="right">
        <text>文本</text>
      </Divider>

      <!-- 虚线 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">虚线</text>
      <Divider dashed>
        <text>文本</text>
      </Divider>

      <!-- 自定义样式 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义样式</text>
      <Divider
        :style="{ borderColor: '#1989fa', color: '#1989fa', padding: '0 16px' }"
      >
        <text :style="{ color: '#1989fa' }">文本</text>
      </Divider>

      <!-- 垂直 -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">垂直</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
        <text :style="{ fontSize: '14px', color: '#1989fa' }">文本</text>
        <Divider vertical />
        <text :style="{ fontSize: '14px', color: '#1989fa' }">文本</text>
        <Divider vertical dashed />
        <text :style="{ fontSize: '14px', color: '#1989fa' }">文本</text>
        <Divider vertical :hairline="false" />
        <text :style="{ fontSize: '14px', color: '#1989fa' }">文本</text>
      </view>
    </view>
  </DemoPage>
</template>
