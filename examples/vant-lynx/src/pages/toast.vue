<script setup lang="ts">
import DemoPage from '../components/DemoPage/index.vue';
import { ref } from 'vue-lynx';
import Toast from '../components/Toast/index.vue';
import Button from '../components/Button/index.vue';
const show = ref(false);
const toastType = ref<'text' | 'loading' | 'success' | 'fail'>('text');
const toastMessage = ref('');

function showText() {
  toastType.value = 'text';
  toastMessage.value = 'Some message';
  show.value = true;
  setTimeout(() => { show.value = false; }, 2000);
}

function showSuccess() {
  toastType.value = 'success';
  toastMessage.value = 'Success';
  show.value = true;
  setTimeout(() => { show.value = false; }, 2000);
}

function showFail() {
  toastType.value = 'fail';
  toastMessage.value = 'Failed';
  show.value = true;
  setTimeout(() => { show.value = false; }, 2000);
}

function showLoading() {
  toastType.value = 'loading';
  toastMessage.value = 'Loading...';
  show.value = true;
  setTimeout(() => { show.value = false; }, 2000);
}
</script>

<template>
  <DemoPage title="Toast">
    

    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <Button type="primary" @click="showText">
          <text :style="{ fontSize: 14, color: '#fff' }">Text Toast</text>
        </Button>
      </view>

      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Toast Type</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column' }">
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @click="showSuccess">
            <text :style="{ fontSize: 14, color: '#fff' }">Success</text>
          </Button>
        </view>
        <view :style="{ marginBottom: 8 }">
          <Button type="primary" @click="showFail">
            <text :style="{ fontSize: 14, color: '#fff' }">Fail</text>
          </Button>
        </view>
        <Button type="primary" @click="showLoading">
          <text :style="{ fontSize: 14, color: '#fff' }">Loading</text>
        </Button>
      </view>
    </view>

    <Toast :show="show" :type="toastType" :message="toastMessage" />
  </DemoPage>
</template>
