<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
</script>

<template>
  <DemoPage title="CellGroup 单元格组">
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">基础用法</text>
      <CellGroup>
        <Cell title="单元格" value="内容" />
        <Cell title="单元格" value="内容" label="描述信息" :border="false" />
      </CellGroup>

      <!-- 卡片风格 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">卡片风格</text>
      <CellGroup inset>
        <Cell title="单元格" value="内容" />
        <Cell title="单元格" value="内容" label="描述信息" :border="false" />
      </CellGroup>

      <!-- 分组标题 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">分组标题</text>
      <CellGroup title="分组 1">
        <Cell title="单元格" value="内容" :border="false" />
      </CellGroup>
      <CellGroup title="分组 2">
        <Cell title="单元格" value="内容" :border="false" />
      </CellGroup>
    </view>
  </DemoPage>
</template>
