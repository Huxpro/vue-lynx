<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Badge from '../components/Badge/index.vue';
</script>

<template>
  <DemoPage title="Badge">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
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

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Max</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="20" :max="9">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge :content="200" :max="99">
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 24 }">
          <Badge :content="5" color="#1989fa">
            <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
          </Badge>
        </view>
        <Badge dot color="#1989fa">
          <view :style="{ width: 40, height: 40, backgroundColor: '#f2f3f5', borderRadius: 4 }" />
        </Badge>
      </view>
    </view>
  </DemoPage>
</template>
