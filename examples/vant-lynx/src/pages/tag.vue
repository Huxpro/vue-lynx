<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Tag from '../components/Tag/index.vue';

const show = ref(true);
function onClose() {
  show.value = false;
}
</script>

<template>
  <DemoPage title="Tag 标签">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <CellGroup>
        <Cell title="primary 类型">
          <template #value>
            <Tag type="primary">标签</Tag>
          </template>
        </Cell>
        <Cell title="success 类型">
          <template #value>
            <Tag type="success">标签</Tag>
          </template>
        </Cell>
        <Cell title="danger 类型">
          <template #value>
            <Tag type="danger">标签</Tag>
          </template>
        </Cell>
        <Cell title="warning 类型">
          <template #value>
            <Tag type="warning">标签</Tag>
          </template>
        </Cell>
      </CellGroup>

      <!-- 样式风格 -->
      <text class="demo-section-title">样式风格</text>
      <CellGroup>
        <Cell title="空心样式">
          <template #value>
            <Tag type="primary" plain>标签</Tag>
          </template>
        </Cell>
        <Cell title="圆角样式">
          <template #value>
            <Tag type="primary" round>标签</Tag>
          </template>
        </Cell>
        <Cell title="标记样式">
          <template #value>
            <Tag type="primary" mark>标签</Tag>
          </template>
        </Cell>
        <Cell title="可关闭标签">
          <template #value>
            <Tag
              type="primary"
              closeable
              :show="show"
              size="medium"
              @close="onClose"
            >标签</Tag>
          </template>
        </Cell>
      </CellGroup>

      <!-- 标签大小 -->
      <text class="demo-section-title">标签大小</text>
      <CellGroup>
        <Cell title="小号标签">
          <template #value>
            <Tag type="primary">标签</Tag>
          </template>
        </Cell>
        <Cell title="中号标签">
          <template #value>
            <Tag type="primary" size="medium">标签</Tag>
          </template>
        </Cell>
        <Cell title="大号标签">
          <template #value>
            <Tag type="primary" size="large">标签</Tag>
          </template>
        </Cell>
      </CellGroup>

      <!-- 自定义颜色 -->
      <text class="demo-section-title">自定义颜色</text>
      <CellGroup>
        <Cell title="背景颜色">
          <template #value>
            <Tag color="#7232dd">标签</Tag>
          </template>
        </Cell>
        <Cell title="文字颜色">
          <template #value>
            <Tag color="#ffe1e1" text-color="#ad0000">标签</Tag>
          </template>
        </Cell>
        <Cell title="空心颜色">
          <template #value>
            <Tag color="#7232dd" plain>标签</Tag>
          </template>
        </Cell>
      </CellGroup>
    </view>
  </DemoPage>
</template>
