<script setup lang="ts">
import { ref } from 'vue-lynx';
import { useRouter } from 'vue-router';
import Uploader from '../components/Uploader/index.vue';

const router = useRouter();
function goBack() { router.push('/'); }

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
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }">
    <!-- Header -->
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }">
      <text :style="{ fontSize: 16, color: '#1989fa', marginRight: 8 }" @tap="goBack">&lt; Back</text>
      <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#323233' }">Uploader</text>
    </view>

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

      <!-- Disabled -->
      <text :style="{ fontSize: 14, color: '#969799', marginBottom: 12 }">Disabled</text>
      <view :style="{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }">
        <Uploader
          :model-value="[{ url: 'https://example.com/img.jpg', status: 'done' }]"
          disabled
        />
      </view>
    </view>
  </view>
</template>
