<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Overlay from '../components/Overlay/index.vue';
import Button from '../components/Button/index.vue';
const showBasic = ref(false);
const showContent = ref(false);
const showCustom = ref(false);
</script>

<template>
  <DemoPage title="Overlay">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Overlay -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showBasic = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Show Overlay</text>
        </Button>
      </view>

      <!-- Embedded Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Embedded Content</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showContent = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Show Embedded Content</text>
        </Button>
      </view>

      <!-- Custom Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Style</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showCustom = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Custom Background Color</text>
        </Button>
      </view>
    </view>

    <!-- Basic Overlay -->
    <Overlay :show="showBasic" @click="showBasic = false" />

    <!-- Overlay with Embedded Content -->
    <Overlay :show="showContent" @click="showContent = false">
      <view :style="{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <view :style="{ width: 120, height: 120, borderRadius: 8, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
          <text :style="{ fontSize: 14, color: '#323233' }">Content</text>
        </view>
      </view>
    </Overlay>

    <!-- Custom Style Overlay -->
    <Overlay
      :show="showCustom"
      :custom-style="{ backgroundColor: 'rgba(25, 137, 250, 0.5)' }"
      @click="showCustom = false"
    />
  </DemoPage>
</template>
