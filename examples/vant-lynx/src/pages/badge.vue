<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Badge from '../components/Badge/index.vue';
import Icon from '../components/Icon/index.vue';
</script>

<template>
  <DemoPage title="Badge">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="5">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge :content="10">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge content="Hot">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge dot>
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>

      <!-- Max -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Max</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="20" :max="9">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge :content="50" :max="20">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge :content="200" :max="99">
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>

      <!-- Custom Color -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="5" color="#1989fa">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge :content="10" color="#1989fa">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge dot color="#1989fa">
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>

      <!-- Custom Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Content</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge>
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
            <template #content>
              <Icon name="success" :size="10" color="#fff" />
            </template>
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge>
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
            <template #content>
              <Icon name="cross" :size="10" color="#fff" />
            </template>
          </Badge>
        </view>
        <Badge>
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          <template #content>
            <Icon name="arrow-down" :size="10" color="#fff" />
          </template>
        </Badge>
      </view>

      <!-- Custom Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Position</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="10" position="top-left">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <view :style="{ marginRight: 24 }">
          <Badge :content="10" position="bottom-left">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge :content="10" position="bottom-right">
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>

      <!-- Standalone -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Standalone</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 16 }">
          <Badge :content="20" />
        </view>
        <Badge :content="200" :max="99" />
      </view>
    </view>
  </DemoPage>
</template>
