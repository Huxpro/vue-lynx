<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import { notifyState, showNotify, closeNotify } from '../components/Notify/notify';
import Notify from '../components/Notify/index.vue';
import Button from '../components/Button/index.vue';

function showBasic() {
  showNotify({ type: 'danger', message: 'Notification content', duration: 3000 });
}

function showPrimary() {
  showNotify({ type: 'primary', message: 'Primary notification', duration: 3000 });
}

function showSuccess() {
  showNotify({ type: 'success', message: 'Operation successful!', duration: 3000 });
}

function showWarning() {
  showNotify({ type: 'warning', message: 'Warning message', duration: 3000 });
}

function showDanger() {
  showNotify({ type: 'danger', message: 'Something went wrong', duration: 3000 });
}

function showCustom() {
  showNotify({
    message: 'Custom color notification',
    color: '#ad0000',
    background: '#ffe1e1',
    duration: 3000,
  });
}

function showCustomDuration() {
  showNotify({ type: 'primary', message: 'Display 5 seconds', duration: 5000 });
}

function showNoDismiss() {
  showNotify({ type: 'primary', message: 'Tap close to dismiss', duration: 0 });
}
</script>

<template>
  <DemoPage title="Notify">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="danger" @tap="showBasic">
          <text :style="{ fontSize: 14, color: '#fff' }">Basic Notify</text>
        </Button>
      </view>

      <!-- Notify Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Notify Type</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showPrimary">
            <text :style="{ fontSize: 14, color: '#fff' }">Primary</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="success" @tap="showSuccess">
            <text :style="{ fontSize: 14, color: '#fff' }">Success</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="warning" @tap="showWarning">
            <text :style="{ fontSize: 14, color: '#fff' }">Warning</text>
          </Button>
        </view>
        <Button type="danger" @tap="showDanger">
          <text :style="{ fontSize: 14, color: '#fff' }">Danger</text>
        </Button>
      </view>

      <!-- Custom Notify -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Notify</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showCustom">
          <text :style="{ fontSize: 14, color: '#fff' }">Custom Color</text>
        </Button>
      </view>

      <!-- Custom Duration -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Duration</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showCustomDuration">
          <text :style="{ fontSize: 14, color: '#fff' }">Duration 5s</text>
        </Button>
      </view>

      <!-- Manual Close -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Manual Close</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showNoDismiss">
            <text :style="{ fontSize: 14, color: '#fff' }">No Auto-Close</text>
          </Button>
        </view>
        <Button type="default" @tap="closeNotify">
          <text :style="{ fontSize: 14, color: '#323233' }">Close Notify</text>
        </Button>
      </view>
    </view>

    <Notify
      :show="notifyState.show"
      :type="notifyState.type"
      :message="notifyState.message"
      :color="notifyState.color"
      :background="notifyState.background"
    />
  </DemoPage>
</template>
