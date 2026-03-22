<script setup lang="ts">
import { ref } from 'vue-lynx';
import DemoPage from '../components/DemoPage/index.vue';
import Uploader from '../components/Uploader/index.vue';
import Button from '../components/Button/index.vue';
import type { UploaderFileListItem } from '../components/Uploader/types';

const IMAGE_URL = 'https://fastly.jsdelivr.net/npm/@vant/assets/leaf.jpeg';
const IMAGE_URL2 = 'https://fastly.jsdelivr.net/npm/@vant/assets/tree.jpeg';
const IMAGE_URL3 = 'https://fastly.jsdelivr.net/npm/@vant/assets/sand.jpeg';

let nextId = 100;

// Basic usage
const onClickUploadBasic = () => {
  // In Lynx, host app handles file picking. Simulate adding an image.
  basicFiles.value = [
    ...basicFiles.value,
    { url: `${IMAGE_URL}?id=${nextId++}`, status: '' as const },
  ];
};

// File preview
const basicFiles = ref<UploaderFileListItem[]>([]);

const fileList = ref<UploaderFileListItem[]>([
  { url: IMAGE_URL },
  { url: IMAGE_URL2 },
]);

// Upload status
const statusFileList = ref<UploaderFileListItem[]>([
  { url: IMAGE_URL, status: 'uploading', message: '上传中...' },
  { url: IMAGE_URL2, status: 'failed', message: '上传失败' },
]);

// Max count
const maxCountFiles = ref<UploaderFileListItem[]>([
  { url: IMAGE_URL3 },
]);

// Max size
const maxSizeFiles = ref<UploaderFileListItem[]>([
  { url: IMAGE_URL3 },
]);

// Preview size
const previewSizeFiles = ref<UploaderFileListItem[]>([
  { url: IMAGE_URL },
]);

// Custom preview
const customFiles = ref<UploaderFileListItem[]>([
  {
    url: IMAGE_URL,
    deletable: true,
  },
  {
    url: IMAGE_URL2,
    imageFit: 'contain',
  },
]);

// Disabled
const disabledFiles = ref<UploaderFileListItem[]>([
  { url: IMAGE_URL },
]);

// Reupload
const reuploadFiles = ref<UploaderFileListItem[]>([
  { url: IMAGE_URL },
]);

function onAddFile(files: UploaderFileListItem[], ref_: { value: UploaderFileListItem[] }) {
  ref_.value = [
    ...ref_.value,
    { url: `${IMAGE_URL}?id=${nextId++}`, status: '' as const },
  ];
}
</script>

<template>
  <DemoPage title="Uploader 文件上传">
    <view :style="{ padding: '16px' }">
      <!-- 基础用法 -->
      <text class="demo-section-title">基础用法</text>
      <view class="demo-card">
        <Uploader
          v-model="basicFiles"
          @click-upload="onClickUploadBasic"
        />
      </view>

      <!-- 文件预览 -->
      <text class="demo-section-title">文件预览</text>
      <view class="demo-card">
        <Uploader
          v-model="fileList"
          @click-upload="onAddFile(fileList, { value: fileList })"
        />
      </view>

      <!-- 上传状态 -->
      <text class="demo-section-title">上传状态</text>
      <view class="demo-card">
        <Uploader v-model="statusFileList" />
      </view>

      <!-- 限制上传数量 -->
      <text class="demo-section-title">限制上传数量</text>
      <view class="demo-card">
        <Uploader
          v-model="maxCountFiles"
          :max-count="2"
          @click-upload="onAddFile(maxCountFiles, maxCountFiles)"
        />
      </view>

      <!-- 限制上传大小 -->
      <text class="demo-section-title">限制上传大小</text>
      <view class="demo-card">
        <Uploader
          v-model="maxSizeFiles"
          :max-size="500 * 1024"
        />
      </view>

      <!-- 自定义上传样式 -->
      <text class="demo-section-title">自定义上传样式</text>
      <view class="demo-card">
        <Uploader @click-upload="onClickUploadBasic">
          <Button type="primary" icon="plus" text="上传文件" />
        </Uploader>
      </view>

      <!-- 自定义预览大小 -->
      <text class="demo-section-title">自定义预览大小</text>
      <view class="demo-card">
        <Uploader v-model="previewSizeFiles" :preview-size="60" />
      </view>

      <!-- 禁用文件上传 -->
      <text class="demo-section-title">禁用文件上传</text>
      <view class="demo-card">
        <Uploader v-model="disabledFiles" disabled />
      </view>

      <!-- 自定义单个图片预览 -->
      <text class="demo-section-title">自定义单个图片预览</text>
      <view class="demo-card">
        <Uploader v-model="customFiles" :deletable="false" />
      </view>

      <!-- 开启覆盖上传 -->
      <text class="demo-section-title">开启覆盖上传</text>
      <view class="demo-card">
        <Uploader v-model="reuploadFiles" reupload :max-count="2" />
      </view>
    </view>
  </DemoPage>
</template>
