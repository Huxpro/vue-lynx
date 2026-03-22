<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Icon from '../components/Icon/index.vue';
</script>

<template>
  <DemoPage title="Cell 单元格">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
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

      <!-- 单元格大小 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">单元格大小</text>
      <Cell title="单元格" value="内容" size="large" />
      <Cell title="单元格" value="内容" size="large" label="描述信息" />

      <!-- 展示图标 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">展示图标</text>
      <Cell title="单元格" value="内容" icon="location-o" :border="false" />

      <!-- 展示箭头 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">展示箭头</text>
      <CellGroup>
        <Cell title="单元格" is-link />
        <Cell title="单元格" value="内容" is-link />
        <Cell title="单元格" is-link arrow-direction="down" value="内容" :border="false" />
      </CellGroup>

      <!-- 页面导航 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">页面导航</text>
      <CellGroup>
        <Cell title="URL 跳转" is-link url="https://github.com" />
        <Cell title="路由跳转" is-link to="/" :border="false" />
      </CellGroup>

      <!-- 分组标题 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">分组标题</text>
      <CellGroup title="分组 1">
        <Cell title="单元格" value="内容" :border="false" />
      </CellGroup>
      <CellGroup title="分组 2">
        <Cell title="单元格" value="内容" :border="false" />
      </CellGroup>

      <!-- 使用插槽 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">使用插槽</text>
      <CellGroup>
        <Cell value="内容" is-link>
          <template #title>
            <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center' }">
              <text :style="{ fontSize: '14px', color: '#323233', marginRight: '4px' }">单元格</text>
              <view :style="{ backgroundColor: '#1989fa', borderRadius: '2px', paddingLeft: '4px', paddingRight: '4px', paddingTop: '1px', paddingBottom: '1px' }">
                <text :style="{ fontSize: '10px', color: '#fff' }">标签</text>
              </view>
            </view>
          </template>
        </Cell>
        <Cell title="单元格" icon="shop-o" :border="false">
          <template #right-icon>
            <Icon name="search" :size="16" color="#969799" />
          </template>
        </Cell>
      </CellGroup>

      <!-- 垂直居中 -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">垂直居中</text>
      <Cell center title="单元格" value="内容" label="描述信息" :border="false" />
    </view>
  </DemoPage>
</template>
