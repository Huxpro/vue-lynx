<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Overlay from '../components/Overlay/index.vue';
import Button from '../components/Button/index.vue';
const showOverlay = ref(false);

function onShowOverlay() {
  showOverlay.value = true;
}

function onDismissOverlay() {
  showOverlay.value = false;
}
</script>

<template>
  <DemoPage title="Overlay">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Overlay -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="onShowOverlay">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Overlay</text>
        </Button>
      </view>

      <text :style="{ fontSize: 14, color: '#969799' }">Tap the overlay to dismiss it.</text>
    </view>

    <!-- Overlay -->
    <Overlay :show="showOverlay" @click="onDismissOverlay">
      <view :style="{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 18, color: '#fff' }">Tap to dismiss</text>
      </view>
    </Overlay>
  </DemoPage>
</template>
