<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import NavBar from '../components/NavBar/index.vue';
import Icon from '../components/Icon/index.vue';
import { showToast } from '../components/Toast/toast';
</script>

<template>
  <DemoPage title="NavBar 导航栏">
    <view :style="{ padding: '16px' }">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <NavBar title="标题" />
      </view>

      <!-- 返回上级 -->
      <text class="demo-section-title">返回上级</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <NavBar
          title="标题"
          left-text="返回"
          left-arrow
          @click-left="showToast('返回')"
        />
      </view>

      <!-- 右侧按钮 -->
      <text class="demo-section-title">右侧按钮</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <NavBar
          title="标题"
          left-text="返回"
          right-text="按钮"
          left-arrow
          @click-left="showToast('返回')"
          @click-right="showToast('按钮')"
        />
      </view>

      <!-- 使用插槽 -->
      <text class="demo-section-title">使用插槽</text>
      <view :style="{ marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <NavBar title="标题" left-text="返回" left-arrow>
          <template #right>
            <Icon name="search" :size="18" />
          </template>
        </NavBar>
      </view>

      <!-- 禁用按钮 -->
      <text class="demo-section-title">禁用按钮</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }">
        <NavBar
          title="标题"
          left-text="返回"
          right-text="按钮"
          left-arrow
          left-disabled
          right-disabled
        />
      </view>
    </view>
  </DemoPage>
</template>
