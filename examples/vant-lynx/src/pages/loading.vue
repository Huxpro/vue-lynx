<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Loading from '../components/Loading/index.vue';
import Icon from '../components/Icon/index.vue';
</script>

<template>
  <DemoPage title="Loading">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">加载类型</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 32 }">
          <Loading />
        </view>
        <Loading type="spinner" />
      </view>

      <!-- Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">自定义颜色</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 32 }">
          <Loading color="#1989fa" />
        </view>
        <Loading type="spinner" color="#1989fa" />
      </view>

      <!-- Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">自定义大小</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 32 }">
          <Loading size="24" />
        </view>
        <Loading type="spinner" size="24" />
      </view>

      <!-- Text -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">加载文案</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading size="24">加载中...</Loading>
      </view>

      <!-- Vertical -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">垂直排列</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading size="24" vertical>加载中...</Loading>
      </view>

      <!-- Text Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">自定义文本颜色</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 32 }">
          <Loading size="24" vertical color="#0094ff">加载中...</Loading>
        </view>
        <Loading size="24" vertical text-color="#0094ff">加载中...</Loading>
      </view>

      <!-- Custom Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">自定义图标</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading vertical>
          <template #icon>
            <Icon name="star-o" :size="30" />
          </template>
          加载中...
        </Loading>
      </view>
    </view>
  </DemoPage>
</template>
