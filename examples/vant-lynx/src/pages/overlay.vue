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
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showBasic = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Overlay</text>
        </Button>
      </view>

      <!-- Embedded Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Embedded Content</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showEmbedded = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Embedded Content</text>
        </Button>
      </view>

      <!-- Custom Z-Index -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Z-Index</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showZIndex = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Custom Z-Index</text>
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
            width: 120,
            height: 120,
            backgroundColor: '#fff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
        >
          <text :style="{ fontSize: 14, color: '#323233' }">Content</text>
        </view>
      </view>
    </Overlay>

    <!-- Custom Z-Index Overlay -->
    <Overlay :show="showZIndex" :z-index="100" @click="showZIndex = false" />
  </DemoPage>
</template>
