<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Dialog from '../components/Dialog/index.vue';
import Button from '../components/Button/index.vue';

const showAlert = ref(false);
const showConfirm = ref(false);
const showMessageOnly = ref(false);
const showRoundButton = ref(false);
const showAsyncClose = ref(false);
const showCustomContent = ref(false);

const asyncClosing = ref(false);

function onAlertConfirm() {
  showAlert.value = false;
}

function onConfirmConfirm() {
  showConfirm.value = false;
}

function onConfirmCancel() {
  showConfirm.value = false;
}

function onMessageConfirm() {
  showMessageOnly.value = false;
}

function onMessageCancel() {
  showMessageOnly.value = false;
}

function onRoundConfirm() {
  showRoundButton.value = false;
}

function onRoundCancel() {
  showRoundButton.value = false;
}

function onAsyncConfirm() {
  asyncClosing.value = true;
  setTimeout(() => {
    asyncClosing.value = false;
    showAsyncClose.value = false;
  }, 1500);
}

function onAsyncCancel() {
  showAsyncClose.value = false;
}

function onCustomConfirm() {
  showCustomContent.value = false;
}

function onCustomCancel() {
  showCustomContent.value = false;
}
</script>

<template>
  <DemoPage title="Dialog">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Alert Dialog -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Alert Dialog</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showAlert = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Alert</text>
        </Button>
      </view>

      <!-- Confirm Dialog -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Confirm Dialog</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showConfirm = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Confirm</text>
        </Button>
      </view>

      <!-- No Title -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">No Title</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showMessageOnly = true">
          <text :style="{ fontSize: 14, color: '#fff' }">No Title</text>
        </Button>
      </view>

      <!-- Round Button Style -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Round Button Style</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showRoundButton = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Round Button</text>
        </Button>
      </view>

      <!-- Async Close -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Async Close</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showAsyncClose = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Async Close</text>
        </Button>
      </view>

      <!-- Custom Content -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Content</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showCustomContent = true">
          <text :style="{ fontSize: 14, color: '#fff' }">Custom Content</text>
        </Button>
      </view>
    </view>

    <!-- Alert Dialog -->
    <Dialog
      v-model:show="showAlert"
      title="Title"
      message="This is an alert message."
      @confirm="onAlertConfirm"
    />

    <!-- Confirm Dialog -->
    <Dialog
      v-model:show="showConfirm"
      title="Title"
      message="Are you sure you want to proceed?"
      show-cancel-button
      @confirm="onConfirmConfirm"
      @cancel="onConfirmCancel"
    />

    <!-- No Title -->
    <Dialog
      v-model:show="showMessageOnly"
      message="Message-only dialog with no title."
      show-cancel-button
      @confirm="onMessageConfirm"
      @cancel="onMessageCancel"
    />

    <!-- Round Button Style -->
    <Dialog
      v-model:show="showRoundButton"
      title="Title"
      message="Use round button style."
      show-cancel-button
      confirm-button-color="#ee0a24"
      @confirm="onRoundConfirm"
      @cancel="onRoundCancel"
    />

    <!-- Async Close -->
    <Dialog
      v-model:show="showAsyncClose"
      title="Title"
      message="Confirm will close after 1.5s."
      show-cancel-button
      @confirm="onAsyncConfirm"
      @cancel="onAsyncCancel"
    />

    <!-- Custom Content -->
    <Dialog
      v-model:show="showCustomContent"
      title="Custom Content"
      show-cancel-button
      @confirm="onCustomConfirm"
      @cancel="onCustomCancel"
    >
      <view :style="{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text :style="{ fontSize: 16, color: '#323233', marginBottom: 8 }">Custom Slot Content</text>
        <text :style="{ fontSize: 14, color: '#969799' }">You can put any content here using the default slot.</text>
      </view>
    </Dialog>
  </DemoPage>
</template>
