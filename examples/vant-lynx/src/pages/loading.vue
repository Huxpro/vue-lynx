<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Loading from '../components/Loading/index.vue';
</script>

<template>
  <DemoPage title="Loading">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Type</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 32 }">
          <Loading type="circular" />
        </view>
        <Loading type="spinner" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Color</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <view :style="{ marginRight: 32 }">
          <Loading color="#1989fa" />
        </view>
        <Loading color="#ee0a24" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Size</text>
      <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading :size="24" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">With Text</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading>
          <text :style="{ fontSize: 14, color: '#969799', marginLeft: 8 }">Loading...</text>
        </Loading>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Vertical</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading vertical>
          <text :style="{ fontSize: 14, color: '#969799', marginTop: 8 }">Loading...</text>
        </Loading>
      </view>
    </view>
  </DemoPage>
</template>
