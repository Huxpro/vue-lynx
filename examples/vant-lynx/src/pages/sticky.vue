<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Sticky from '../components/Sticky/index.vue';
import Button from '../components/Button/index.vue';

const container = ref();
</script>

<template>
  <DemoPage title="Sticky 粘性布局">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">基础用法</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <Sticky>
          <Button type="primary">基础用法</Button>
        </Sticky>
      </view>

      <!-- 吸顶距离 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">吸顶距离</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <Sticky :offset-top="50">
          <Button type="primary">吸顶距离</Button>
        </Sticky>
      </view>

      <!-- 指定容器 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">指定容器</text>
      <view ref="container" :style="{ height: '150px', backgroundColor: '#f2f3f5', padding: '16px' }">
        <Sticky :container="container">
          <Button type="warning">指定容器</Button>
        </Sticky>
      </view>

      <!-- 吸底距离 -->
      <text :style="{ fontSize: '14px', color: '#969799', paddingLeft: '16px', paddingTop: '16px', paddingBottom: '8px' }">吸底距离</text>
      <view :style="{ backgroundColor: '#fff', padding: '16px' }">
        <Sticky position="bottom" :offset-bottom="50">
          <Button type="primary">吸底距离</Button>
        </Sticky>
      </view>
    </view>
  </DemoPage>
</template>
