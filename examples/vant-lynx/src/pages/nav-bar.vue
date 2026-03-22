<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import NavBar from '../components/NavBar/index.vue';
import Icon from '../components/Icon/index.vue';
</script>

<template>
  <DemoPage title="NavBar 导航栏">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- 基础用法 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">基础用法</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="标题" />
      </view>

      <!-- 返回上级 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">返回上级</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar
          title="标题"
          left-text="返回"
          left-arrow
        />
      </view>

      <!-- 右侧按钮 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">右侧按钮</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar
          title="标题"
          left-text="返回"
          right-text="按钮"
          left-arrow
        />
      </view>

      <!-- 使用插槽 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">使用插槽</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="标题" left-text="返回" left-arrow>
          <template #right>
            <Icon name="search" :size="18" />
          </template>
        </NavBar>
      </view>

      <!-- 禁用按钮 -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">禁用按钮</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
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
