<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import Cell from '../components/Cell/index.vue';
import CellGroup from '../components/CellGroup/index.vue';
import Toast from '../components/Toast/index.vue';
import { ref } from 'vue-lynx';
import {
  showToast,
  showLoadingToast,
  showSuccessToast,
  showFailToast,
  closeToast,
  toastState,
} from '../components/Toast/toast';

// Component usage state
const showComponentToast = ref(false);

// Basic Usage
function onShowText() {
  showToast('Some messages');
}

function onShowLoading() {
  showLoadingToast({
    message: 'Loading...',
    forbidClick: true,
  });
}

function onShowSuccess() {
  showSuccessToast('Success');
}

function onShowFail() {
  showFailToast('Fail');
}

// Custom Icon
function onShowCustomIcon() {
  showToast({
    message: 'Custom Icon',
    icon: 'like-o',
  });
}

function onShowCustomImage() {
  showToast({
    message: 'Custom Image',
    icon: 'star',
  });
}

function onShowLoadingSpinner() {
  showLoadingToast({
    message: 'Loading...',
    forbidClick: true,
    loadingType: 'spinner',
  });
}

// Custom Position
function onShowTopToast() {
  showToast({
    message: 'Top Position',
    position: 'top',
  });
}

function onShowBottomToast() {
  showToast({
    message: 'Bottom Position',
    position: 'bottom',
  });
}

// Word Break
function onShowBreakAll() {
  showToast({
    message: 'This message will contain a incomprehensibilities long word.',
    wordBreak: 'break-all',
  });
}

function onShowBreakWord() {
  showToast({
    message: 'This message will contain a incomprehensibilities long word.',
    wordBreak: 'break-word',
  });
}

// Update Message
function onShowUpdateMessage() {
  const toast = showLoadingToast({
    duration: 0,
    forbidClick: true,
    message: 'Countdown 3 seconds',
  });

  let second = 3;
  const timer = setInterval(() => {
    second--;
    if (second) {
      toast.message = `Countdown ${second} seconds`;
    } else {
      clearInterval(timer);
      closeToast();
    }
  }, 1000);
}
</script>

<template>
  <DemoPage title="Toast">
    <view :style="{ padding: 0, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Basic Usage</text>
      <CellGroup>
        <Cell title="Text" is-link @click="onShowText" />
        <Cell title="Loading" is-link @click="onShowLoading" />
        <Cell title="Success" is-link @click="onShowSuccess" />
        <Cell title="Fail" is-link @click="onShowFail" :border="false" />
      </CellGroup>

      <!-- Custom Icon -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Custom Icon</text>
      <CellGroup>
        <Cell title="Custom Icon" is-link @click="onShowCustomIcon" />
        <Cell title="Custom Image" is-link @click="onShowCustomImage" />
        <Cell title="Loading Type" is-link @click="onShowLoadingSpinner" :border="false" />
      </CellGroup>

      <!-- Custom Position -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Custom Position</text>
      <CellGroup>
        <Cell title="Top" is-link @click="onShowTopToast" />
        <Cell title="Bottom" is-link @click="onShowBottomToast" :border="false" />
      </CellGroup>

      <!-- Word Break -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Word Break</text>
      <CellGroup>
        <Cell title="Break All" is-link @click="onShowBreakAll" />
        <Cell title="Break Word" is-link @click="onShowBreakWord" :border="false" />
      </CellGroup>

      <!-- Update Message -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Update Message</text>
      <CellGroup>
        <Cell title="Update Message" is-link @click="onShowUpdateMessage" :border="false" />
      </CellGroup>

      <!-- Use Toast Component -->
      <text :style="{ fontSize: '14px', color: '#969799', padding: '16px' }">Use Toast Component</text>
      <CellGroup>
        <Cell title="Use Toast Component" is-link @click="showComponentToast = true" :border="false" />
      </CellGroup>
    </view>

    <!-- Programmatic toast (driven by toastState) -->
    <Toast
      :show="toastState.show"
      :type="toastState.type"
      :message="toastState.message"
      :position="toastState.position"
      :overlay="toastState.overlay"
      :icon="toastState.icon"
      :icon-size="toastState.iconSize"
      :duration="0"
      :forbid-click="toastState.forbidClick"
      :loading-type="toastState.loadingType"
      :z-index="toastState.zIndex"
      @update:show="(v: boolean) => { if (!v) closeToast(); }"
    />

    <!-- Component usage toast with message slot -->
    <Toast
      v-model:show="showComponentToast"
      :style="{ padding: 0 }"
    >
      <template #message>
        <view :style="{
          width: '200px',
          height: '140px',
          backgroundColor: '#f2f3f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }">
          <text :style="{ fontSize: '14px', color: '#969799' }">Custom Content</text>
        </view>
      </template>
    </Toast>
  </DemoPage>
</template>
