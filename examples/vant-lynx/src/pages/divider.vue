<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Divider from '../components/Divider/index.vue';
</script>

<template>
  <DemoPage title="Divider">
    <!-- Basic Usage -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '16px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">基础用法</text>
      <Divider />
    </view>

    <!-- With Text -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">展示文本</text>
      <Divider>
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
      </Divider>
    </view>

    <!-- Content Position -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">内容位置</text>
      <Divider content-position="left">
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
      </Divider>
      <Divider content-position="right">
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
      </Divider>
    </view>

    <!-- Dashed -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">虚线</text>
      <Divider dashed :hairline="false">
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
      </Divider>
    </view>

    <!-- Custom Style -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">自定义样式</text>
      <Divider>
        <text :style="{ fontSize: '14px', color: '#1989fa' }">文本</text>
      </Divider>
    </view>

    <!-- Vertical -->
    <view :style="{ padding: '16px', backgroundColor: '#fff', marginLeft: '16px', marginRight: '16px', marginTop: '12px', borderRadius: '8px' }">
      <text :style="{ fontSize: '14px', color: '#323233', fontWeight: '600', marginBottom: '12px' }">垂直</text>
      <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', color: '#969799', fontSize: '14px' }">
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
        <Divider vertical />
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
        <Divider vertical dashed />
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
        <Divider vertical :hairline="false" />
        <text :style="{ fontSize: '14px', color: '#969799' }">文本</text>
      </view>
    </view>
  </DemoPage>
</template>
