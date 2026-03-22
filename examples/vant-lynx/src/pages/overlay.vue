<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Overlay from '../components/Overlay/index.vue';
import Button from '../components/Button/index.vue';

const showBasic = ref(false);
const showEmbedded = ref(false);
const showZIndex = ref(false);
</script>

<template>
  <DemoPage title="Overlay">
    <view :style="{ padding: '16px', display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">基础用法</text>
      <view :style="{ marginBottom: '16px' }">
        <Button type="primary" @tap="showBasic = true">
          <text :style="{ fontSize: '16px', color: '#fff' }">显示遮罩层</text>
        </Button>
      </view>

      <!-- Embedded Content -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">嵌入内容</text>
      <view :style="{ marginBottom: '16px' }">
        <Button type="primary" @tap="showEmbedded = true">
          <text :style="{ fontSize: '16px', color: '#fff' }">嵌入内容</text>
        </Button>
      </view>

      <!-- Custom z-index -->
      <text :style="{ fontSize: '14px', color: '#969799', marginBottom: '12px' }">设置 z-index</text>
      <view :style="{ marginBottom: '16px' }">
        <Button type="primary" @tap="showZIndex = true">
          <text :style="{ fontSize: '16px', color: '#fff' }">设置 z-index</text>
        </Button>
      </view>
    </view>

    <!-- Basic Overlay -->
    <Overlay :show="showBasic" @click="showBasic = false" />

    <!-- Embedded Content Overlay -->
    <Overlay :show="showEmbedded" @click="showEmbedded = false">
      <view
        :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }"
      >
        <view
          :style="{
            width: '120px',
            height: '120px',
            backgroundColor: '#fff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
        >
          <text :style="{ fontSize: '14px', color: '#323233' }">内容</text>
        </view>
      </view>
    </Overlay>

    <!-- Custom Z-Index Overlay -->
    <Overlay :show="showZIndex" :z-index="100" @click="showZIndex = false" />
  </DemoPage>
</template>
