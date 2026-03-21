<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import NavBar from '../components/NavBar/index.vue';
import Icon from '../components/Icon/index.vue';
</script>

<template>
  <DemoPage title="NavBar">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="Title" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Left Arrow</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="Title" left-arrow />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Left and Right Text</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="Title" left-text="Back" right-text="Button" left-arrow />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">No Border</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="Title" left-arrow :border="false" />
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Use Slot</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="Title" left-text="Back" left-arrow>
          <template #right>
            <Icon name="search" :size="18" color="#1989fa" />
          </template>
        </NavBar>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disable Button</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }">
        <NavBar title="Title" left-text="Back" right-text="Button" left-arrow left-disabled right-disabled />
      </view>
    </view>
  </DemoPage>
</template>
