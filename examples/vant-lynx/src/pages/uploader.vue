<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Uploader from '../components/Uploader/index.vue';
interface UploaderFile {
  url?: string;
  status?: 'uploading' | 'failed' | 'done';
  message?: string;
}

const files = ref<UploaderFile[]>([
  { url: 'https://example.com/img1.jpg', status: 'done' },
  { url: 'https://example.com/img2.jpg', status: 'uploading', message: '50%' },
]);

const filesWithMax = ref<UploaderFile[]>([
  { url: 'https://example.com/img1.jpg', status: 'done' },
]);

let nextId = 3;

function onClickUpload() {
  files.value = [
    ...files.value,
    { url: `https://example.com/img${nextId++}.jpg`, status: 'done' },
  ];
}

function onClickUploadMax() {
  if (filesWithMax.value.length < 2) {
    filesWithMax.value = [
      ...filesWithMax.value,
      { url: `https://example.com/img${nextId++}.jpg`, status: 'done' },
    ];
  }
}
</script>

<template>
  <DemoPage title="Uploader">
    <view :style="{ padding: 16, display: 'flex', flexDirection: 'column' }">
      <!-- Basic usage -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Basic Usage</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Uploader
          v-model="files"
          upload-text="Upload"
          @click-upload="onClickUpload"
        />
      </view>

      <!-- Upload Status -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Upload Status</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Uploader
          :model-value="[
            { url: 'https://example.com/img1.jpg', status: 'done' },
            { url: 'https://example.com/img2.jpg', status: 'uploading', message: '50%' },
            { url: 'https://example.com/img3.jpg', status: 'failed', message: 'Failed' },
          ]"
          :deletable="false"
          :show-upload="false"
        />
      </view>

      <!-- Max count -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Max Count (2)</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Uploader
          v-model="filesWithMax"
          :max-count="2"
          upload-text="Upload"
          @click-upload="onClickUploadMax"
        />
      </view>

      <!-- Preview Size -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Preview Size</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }">
        <Uploader
          :model-value="[
            { url: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', status: 'done' },
            { url: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg', status: 'done' },
          ]"
          :preview-size="60"
          :deletable="false"
          :show-upload="false"
        />
      </view>

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Uploader
          :model-value="[{ url: 'https://example.com/img.jpg', status: 'done' }]"
          disabled
        />
      </view>
    </view>
  </DemoPage>
</template>
