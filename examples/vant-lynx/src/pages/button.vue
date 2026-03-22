<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Button from '../components/Button/index.vue';
import Swipe from '../components/Swipe/index.vue';
import SwipeItem from '../components/SwipeItem/index.vue';
</script>

<template>
  <DemoPage title="Button">
    <view :style="{ padding: '16px' }">
      <!-- 按钮类型 -->
      <text class="demo-section-title">按钮类型</text>
      <view class="demo-button-row">
        <Button type="primary" text="主要按钮" />
        <Button type="success" text="成功按钮" />
        <Button type="default" text="默认按钮" />
      </view>
      <view class="demo-button-row">
        <Button type="warning" text="警告按钮" />
        <Button type="danger" text="危险按钮" />
      </view>

      <!-- 朴素按钮 -->
      <text class="demo-section-title">朴素按钮</text>
      <view class="demo-button-row">
        <Button type="primary" plain text="朴素按钮" />
        <Button type="success" plain text="朴素按钮" />
      </view>

      <!-- 细边框 -->
      <text class="demo-section-title">细边框</text>
      <view class="demo-button-row">
        <Button type="primary" plain hairline text="细边框按钮" />
        <Button type="success" plain hairline text="细边框按钮" />
      </view>

      <!-- 禁用状态 -->
      <text class="demo-section-title">禁用状态</text>
      <view class="demo-button-row">
        <Button type="primary" disabled text="禁用状态" />
        <Button type="success" disabled text="禁用状态" />
      </view>

      <!-- 加载状态 -->
      <text class="demo-section-title">加载状态</text>
      <view class="demo-button-row">
        <Button type="primary" loading />
        <Button type="primary" loading loading-type="spinner" />
        <Button type="success" loading loading-text="加载中..." />
      </view>

      <!-- 按钮形状 -->
      <text class="demo-section-title">按钮形状</text>
      <view class="demo-button-row">
        <Button type="primary" square text="方形按钮" />
        <Button type="success" round text="圆形按钮" />
      </view>

      <!-- 图标按钮 -->
      <text class="demo-section-title">图标按钮</text>
      <view class="demo-button-row">
        <Button type="primary" icon="plus" />
        <Button type="primary" icon="plus" text="按钮" />
        <Button type="primary" plain icon="friends-o" text="按钮" />
      </view>

      <!-- 按钮尺寸 -->
      <text class="demo-section-title">按钮尺寸</text>
      <view :style="{ marginBottom: '16px' }">
        <view :style="{ marginBottom: '8px' }">
          <Button type="primary" size="large" text="大号按钮" />
        </view>
        <view class="demo-button-row">
          <Button type="primary" size="normal" text="普通按钮" />
          <Button type="primary" size="small" text="小型按钮" />
          <Button type="primary" size="mini" text="迷你按钮" />
        </view>
      </view>

      <!-- 块级元素 -->
      <text class="demo-section-title">块级元素</text>
      <view :style="{ marginBottom: '16px' }">
        <Button type="primary" block text="块级元素" />
      </view>

      <!-- 页面导航 -->
      <text class="demo-section-title">页面导航</text>
      <view class="demo-button-row">
        <Button type="primary" url="https://github.com" text="URL 跳转" />
        <Button type="primary" to="index" text="路由跳转" />
      </view>

      <!-- 自定义颜色 -->
      <text class="demo-section-title">自定义颜色</text>
      <view class="demo-button-row">
        <Button color="#7232dd" text="单色按钮" />
        <Button color="#7232dd" plain text="单色按钮" />
        <Button color="linear-gradient(to right, #ff6034, #ee0a24)" text="渐变色按钮" />
      </view>

      <!-- 动画按钮 -->
      <text class="demo-section-title">动画按钮</text>
      <view class="demo-button-row">
        <Button type="danger" round>
          <Swipe
            vertical
            :autoplay="2000"
            :touchable="false"
            :show-indicators="false"
            :style="{ height: '40px', lineHeight: '40px' }"
          >
            <SwipeItem><text :style="{ color: '#fff' }">做任务</text></SwipeItem>
            <SwipeItem><text :style="{ color: '#fff' }">抽大奖</text></SwipeItem>
          </Swipe>
        </Button>
      </view>
    </view>
  </DemoPage>
</template>

<style>
.demo-section-title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}
.demo-button-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
