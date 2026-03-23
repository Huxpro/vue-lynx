<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import SwipeCell from '../components/SwipeCell/index.vue';
import Button from '../components/Button/index.vue';
import Cell from '../components/Cell/index.vue';
import Card from '../components/Card/index.vue';

const beforeClose = ({ position }: { position: string }) => {
  switch (position) {
    case 'left':
    case 'cell':
    case 'outside':
      return true;
    case 'right':
      return new Promise<boolean>((resolve) => {
        // In real app, would show confirm dialog
        resolve(true);
      });
  }
};
</script>

<template>
  <DemoPage title="SwipeCell 滑动单元格">
    <!-- 基础用法 -->
    <text class="demo-section-title">基础用法</text>
    <SwipeCell>
      <template #left>
        <Button square type="primary" text="选择" />
      </template>
      <Cell :border="false" title="单元格" value="内容" />
      <template #right>
        <Button square type="danger" text="删除" />
        <Button square type="primary" text="收藏" />
      </template>
    </SwipeCell>

    <!-- 自定义内容 -->
    <text class="demo-section-title">自定义内容</text>
    <SwipeCell>
      <Card
        num="2"
        price="2.00"
        title="商品标题"
        desc="描述信息"
        thumb="https://fastly.jsdelivr.net/npm/@vant/assets/ipad.jpeg"
      />
      <template #right>
        <Button
          square
          type="danger"
          text="删除"
          :style="{ height: '100%' }"
        />
      </template>
    </SwipeCell>

    <!-- 异步关闭 -->
    <text class="demo-section-title">异步关闭</text>
    <SwipeCell :before-close="beforeClose">
      <template #left>
        <Button square type="primary" text="选择" />
      </template>
      <Cell :border="false" title="单元格" value="内容" />
      <template #right>
        <Button square type="danger" text="删除" />
      </template>
    </SwipeCell>
  </DemoPage>
</template>
