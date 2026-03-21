<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Overlay from '../components/Overlay/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

const showOverlay = ref(false);

function onShowOverlay() {
  showOverlay.value = true;
}

function onDismissOverlay() {
  showOverlay.value = false;
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Overlay</text>
    </view>

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
  </view>
</template>
