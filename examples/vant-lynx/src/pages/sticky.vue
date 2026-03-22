<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Sticky from '../components/Sticky/index.vue';
import Button from '../components/Button/index.vue';
</script>

<template>
  <DemoPage title="Sticky 粘性布局">
    <!-- 基础用法 -->
    <view :style="{ padding: '12px 16px' }">
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
    </view>
    <view :style="{ padding: '0 16px', marginBottom: '12px' }">
      <Sticky>
        <Button type="primary">基础用法</Button>
      </Sticky>
    </view>

    <!-- 吸顶距离 -->
    <view :style="{ padding: '12px 16px' }">
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">吸顶距离</text>
    </view>
    <view :style="{ padding: '0 16px', marginBottom: '12px' }">
      <Sticky :offset-top="50">
        <Button type="primary">吸顶距离</Button>
      </Sticky>
    </view>

    <!-- 指定容器 -->
    <view :style="{ padding: '12px 16px' }">
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">指定容器</text>
    </view>
    <view :style="{ padding: '0 16px', marginBottom: '12px', height: '150px', backgroundColor: '#f2f3f5' }">
      <Sticky>
        <Button type="warning">指定容器</Button>
      </Sticky>
    </view>

    <!-- 吸底距离 -->
    <view :style="{ padding: '12px 16px' }">
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">吸底距离</text>
    </view>
    <view :style="{ padding: '0 16px', marginBottom: '12px' }">
      <Sticky position="bottom" :offset-bottom="50">
        <Button type="primary">吸底距离</Button>
      </Sticky>
    </view>
  </DemoPage>
</template>
