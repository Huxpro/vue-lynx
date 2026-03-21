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
        <Loading>Loading...</Loading>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Vertical</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading vertical>Loading...</Loading>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Text Color</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading color="#1989fa" text-color="#1989fa">Loading...</Loading>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12, marginTop: 16 }">Text Size</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Loading :text-size="20">Loading...</Loading>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Loading>
          <template #icon>
            <view :style="{ width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderStyle: 'solid', borderColor: '#07c160', borderTopColor: 'transparent' }" />
          </template>
          Loading...
        </Loading>
      </view>
    </view>
  </DemoPage>
</template>
