<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Badge from '../components/Badge/index.vue';
import Icon from '../components/Icon/index.vue';
</script>

<template>
  <DemoPage title="Badge 徽标">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <view :style="{ marginRight: '24px' }">
          <Badge :content="5">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <view :style="{ marginRight: '24px' }">
          <Badge :content="10">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <view :style="{ marginRight: '24px' }">
          <Badge content="Hot">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <Badge dot>
          <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
        </Badge>
      </view>

      <!-- Max -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">最大值</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <view :style="{ marginRight: '24px' }">
          <Badge :content="20" :max="9">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <view :style="{ marginRight: '24px' }">
          <Badge :content="50" :max="20">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <Badge :content="200" :max="99">
          <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
        </Badge>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义颜色</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <view :style="{ marginRight: '24px' }">
          <Badge :content="5" color="#1989fa">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <view :style="{ marginRight: '24px' }">
          <Badge :content="10" color="#1989fa">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <Badge dot color="#1989fa">
          <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
        </Badge>
      </view>

      <!-- Custom Content -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义徽标内容</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <view :style="{ marginRight: '24px' }">
          <Badge>
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
            <template #content>
              <Icon name="success" :size="10" color="#fff" />
            </template>
          </Badge>
        </view>
        <view :style="{ marginRight: '24px' }">
          <Badge>
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
            <template #content>
              <Icon name="cross" :size="10" color="#fff" />
            </template>
          </Badge>
        </view>
        <Badge>
          <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          <template #content>
            <Icon name="arrow-down" :size="10" color="#fff" />
          </template>
        </Badge>
      </view>

      <!-- Custom Position -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">自定义徽标位置</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '16px', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <view :style="{ marginRight: '24px' }">
          <Badge :content="10" position="top-left">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <view :style="{ marginRight: '24px' }">
          <Badge :content="10" position="bottom-left">
            <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
          </Badge>
        </view>
        <Badge :content="10" position="bottom-right">
          <view :style="{ width: '40px', height: '40px', backgroundColor: '#f2f3f5', borderRadius: '4px' }" />
        </Badge>
      </view>

      <!-- Standalone -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">独立展示</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: '8px', padding: '16px' }">
        <view :style="{ marginRight: '16px' }">
          <Badge :content="20" />
        </view>
        <Badge :content="200" :max="99" />
      </view>
    </view>
  </DemoPage>
</template>
