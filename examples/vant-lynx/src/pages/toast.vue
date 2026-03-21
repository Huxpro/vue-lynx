<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import { ref } from 'vue-lynx';
import Toast from '../components/Toast/index.vue';
import Button from '../components/Button/index.vue';

const show = ref(false);
const toastType = ref<'text' | 'loading' | 'success' | 'fail'>('text');
const toastMessage = ref('');
const toastPosition = ref<'top' | 'middle' | 'bottom'>('middle');
const toastIcon = ref('');
const toastDuration = ref(2000);

function showToast(opts: { type?: 'text' | 'loading' | 'success' | 'fail'; message: string; position?: 'top' | 'middle' | 'bottom'; icon?: string; duration?: number }) {
  toastType.value = opts.type || 'text';
  toastMessage.value = opts.message;
  toastPosition.value = opts.position || 'middle';
  toastIcon.value = opts.icon || '';
  toastDuration.value = opts.duration ?? 2000;
  show.value = true;
}

function onToastClose() {
  show.value = false;
}
</script>

<template>
  <DemoPage title="Toast">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic Usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showToast({ message: 'Some message' })">
          <text :style="{ fontSize: 14, color: '#fff' }">Text Toast</text>
        </Button>
      </view>

      <!-- Toast Type -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Toast Type</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showToast({ type: 'loading', message: 'Loading...' })">
            <text :style="{ fontSize: 14, color: '#fff' }">Loading Toast</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showToast({ type: 'success', message: 'Success' })">
            <text :style="{ fontSize: 14, color: '#fff' }">Success Toast</text>
          </Button>
        </view>
        <Button type="primary" @tap="showToast({ type: 'fail', message: 'Failed' })">
          <text :style="{ fontSize: 14, color: '#fff' }">Fail Toast</text>
        </Button>
      </view>

      <!-- Custom Icon -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Icon</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showToast({ message: 'Custom Icon', icon: 'star-o' })">
            <text :style="{ fontSize: 14, color: '#fff' }">Custom Icon</text>
          </Button>
        </view>
        <Button type="primary" @tap="showToast({ message: 'With Image', icon: 'like-o' })">
          <text :style="{ fontSize: 14, color: '#fff' }">Another Icon</text>
        </Button>
      </view>

      <!-- Custom Position -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Position</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @tap="showToast({ message: 'Top Position', position: 'top' })">
            <text :style="{ fontSize: 14, color: '#fff' }">Top</text>
          </Button>
        </view>
        <Button type="primary" @tap="showToast({ message: 'Bottom Position', position: 'bottom' })">
          <text :style="{ fontSize: 14, color: '#fff' }">Bottom</text>
        </Button>
      </view>

      <!-- Custom Duration -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Custom Duration</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Button type="primary" @tap="showToast({ message: 'Duration 5s', duration: 5000 })">
          <text :style="{ fontSize: 14, color: '#fff' }">Duration 5s</text>
        </Button>
      </view>
    </view>

    <Toast
      v-model:show="show"
      :type="toastType"
      :message="toastMessage"
      :position="toastPosition"
      :icon="toastIcon"
      :duration="toastDuration"
      @close="onToastClose"
    />
  </DemoPage>
</template>
