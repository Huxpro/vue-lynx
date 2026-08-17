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
const showCloseIcon = ref(false);
const showCloseIconPos = ref(false);
const showRoundCorner = ref(false);
const showEvents = ref(false);
const eventLog = ref('');

function onOpen() {
  eventLog.value = 'open';
}
function onClose() {
  eventLog.value = 'close';
}
function onOpened() {
  eventLog.value = 'opened';
}
function onClosed() {
  eventLog.value = 'closed';
}
</script>

<template>
  <DemoPage title="Popup">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showCenter = true">
          <text :style="{ fontSize: 16, color: '#fff' }">Show Popup</text>
        </Button>
      </view>

      <!-- Popup Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Popup Position</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="primary" @tap="showTop = true">
            <text :style="{ fontSize: 14, color: '#fff' }">Top</text>
          </Button>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="primary" @tap="showBottom = true">
            <text :style="{ fontSize: 14, color: '#fff' }">Bottom</text>
          </Button>
        </view>
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="primary" @tap="showLeft = true">
            <text :style="{ fontSize: 14, color: '#fff' }">Left</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showRight = true">
            <text :style="{ fontSize: 14, color: '#fff' }">Right</text>
          </Button>
        </view>
      </view>

      <!-- Close Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Close Icon</text>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }">
        <view :style="{ marginRight: 8, marginBottom: 8 }">
          <Button type="primary" @tap="showCloseIcon = true">
            <text :style="{ fontSize: 14, color: '#fff' }">Close Icon</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showCloseIconPos = true">
            <text :style="{ fontSize: 14, color: '#fff' }">Custom Position</text>
          </Button>
        </view>
      </view>

      <!-- Round Corner -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round Corner</text>
      <view :style="{ marginBottom: 16 }">
        <Button type="primary" @tap="showRoundCorner = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Round Corner</text>
        </Button>
      </view>

      <!-- Listen to Events -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Listen to Events</text>
      <view :style="{ marginBottom: 8 }">
        <Button type="primary" @tap="showEvents = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Listen Events</text>
        </Button>
      </view>
      <view v-if="eventLog" :style="{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }">
        <text :style="{ fontSize: 14, color: '#323233' }">Last event: {{ eventLog }}</text>
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

    <!-- Bottom Popup -->
    <Popup v-model:show="showBottom" position="bottom">
      <view :style="{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233' }">Bottom Popup</text>
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

    <!-- Close Icon -->
    <Popup v-model:show="showCloseIcon" position="bottom" closeable round>
      <view :style="{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233', marginBottom: 12 }">Close Icon</text>
        <text :style="{ fontSize: 14, color: '#969799' }">Tap the close icon to dismiss</text>
      </view>
    </Popup>

    <!-- Close Icon Custom Position -->
    <Popup v-model:show="showCloseIconPos" position="bottom" closeable close-icon-position="top-left" round>
      <view :style="{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233', marginBottom: 12 }">Custom Close Position</text>
        <text :style="{ fontSize: 14, color: '#969799' }">Close icon is at top-left</text>
      </view>
    </Popup>

    <!-- Round Corner -->
    <Popup v-model:show="showRoundCorner" position="bottom" round>
      <view :style="{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233', marginBottom: 12 }">Round Corner</text>
        <text :style="{ fontSize: 14, color: '#969799' }">Bottom popup with round corners</text>
      </view>
    </Popup>

    <!-- Listen to Events -->
    <Popup
      v-model:show="showEvents"
      position="center"
      @open="onOpen"
      @close="onClose"
      @opened="onOpened"
      @closed="onClosed"
    >
      <view :style="{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233' }">Check events below</text>
      </view>
    </Popup>
  </DemoPage>
</template>
