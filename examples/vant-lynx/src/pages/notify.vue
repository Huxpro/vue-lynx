<script setup lang="ts">
import { useRouter } from 'vue-router';
import { notifyState, showNotify, closeNotify } from '../components/Notify/notify';
import Notify from '../components/Notify/index.vue';
import Button from '../components/Button/index.vue';

const router = useRouter();
function goBack() {
  router.push('/');
}

function showPrimary() {
  showNotify({ type: 'primary', message: 'Notification content', duration: 3000 });
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

function showNoDismiss() {
  showNotify({ type: 'primary', message: 'Tap close to dismiss', duration: 0 });
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Notify</text>
    </view>

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showPrimary">
            <text :style="{ fontSize: 14, color: '#fff' }">Primary Notify</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="success" @tap="showSuccess">
            <text :style="{ fontSize: 14, color: '#fff' }">Success Notify</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="warning" @tap="showWarning">
            <text :style="{ fontSize: 14, color: '#fff' }">Warning Notify</text>
          </Button>
        </view>
        <Button type="danger" @tap="showDanger">
          <text :style="{ fontSize: 14, color: '#fff' }">Danger Notify</text>
        </Button>
      </view>

      <!-- Custom Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Style</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <Button type="primary" @tap="showCustom">
          <text :style="{ fontSize: 14, color: '#fff' }">Custom Color</text>
        </Button>
      </view>

      <!-- Manual Close -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Manual Close</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showNoDismiss">
            <text :style="{ fontSize: 14, color: '#fff' }">Show (no auto-close)</text>
          </Button>
        </view>
        <Button type="default" @tap="closeNotify">
          <text :style="{ fontSize: 14, color: '#323233' }">Close Notify</text>
        </Button>
      </view>
    </view>

    <!-- Notify component driven by service state -->
    <Notify
      :show="notifyState.show"
      :type="notifyState.type"
      :message="notifyState.message"
      :color="notifyState.color"
      :background="notifyState.background"
    />
  </view>
</template>
