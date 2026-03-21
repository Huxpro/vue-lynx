<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Popup from '../components/Popup/index.vue';
import Button from '../components/Button/index.vue';
const showCenter = ref(false);
const showTop = ref(false);
const showBottom = ref(false);
const showLeft = ref(false);
const showRight = ref(false);
</script>

<template>
  <DemoPage title="Popup">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Center Popup -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Center Popup</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showCenter = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Center Popup</text>
        </Button>
      </view>

      <!-- Top Popup -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Top Popup</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showTop = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Top Popup</text>
        </Button>
      </view>

      <!-- Bottom Popup -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Bottom Popup (Round)</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showBottom = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Bottom Popup</text>
        </Button>
      </view>

      <!-- Left Popup -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Left Popup</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showLeft = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Left Popup</text>
        </Button>
      </view>

      <!-- Right Popup -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Right Popup</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showRight = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Right Popup</text>
        </Button>
      </view>
    </view>

    <!-- Center Popup -->
    <Popup v-model:show="showCenter" position="center">
      <view :style="{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233' }">Center Content</text>
      </view>
    </Popup>

    <!-- Top Popup -->
    <Popup v-model:show="showTop" position="top">
      <view :style="{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233' }">Top Popup Content</text>
      </view>
    </Popup>

    <!-- Bottom Popup (Round) -->
    <Popup v-model:show="showBottom" position="bottom" round closeable>
      <view :style="{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233', marginBottom: 12 }">Bottom Popup</text>
        <text :style="{ fontSize: 14, color: '#969799' }">This is a round bottom popup with close icon</text>
      </view>
    </Popup>

    <!-- Left Popup -->
    <Popup v-model:show="showLeft" position="left">
      <view :style="{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233' }">Left Popup</text>
      </view>
    </Popup>

    <!-- Right Popup -->
    <Popup v-model:show="showRight" position="right">
      <view :style="{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233' }">Right Popup</text>
      </view>
    </Popup>
  </DemoPage>
</template>
