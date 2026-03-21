<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface UploaderFile {
  url?: string;
  status?: 'uploading' | 'failed' | 'done';
  message?: string;
}

export interface UploaderProps {
  modelValue?: UploaderFile[];
  maxCount?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  deletable?: boolean;
  showUpload?: boolean;
  previewImage?: boolean;
  previewSize?: number;
  imageFit?: string;
  uploadText?: string;
}

const props = withDefaults(defineProps<UploaderProps>(), {
  modelValue: () => [],
  maxCount: Infinity,
  maxSize: Infinity,
  accept: 'image/*',
  multiple: false,
  disabled: false,
  deletable: true,
  showUpload: true,
  previewImage: true,
  previewSize: 80,
  imageFit: 'cover',
  uploadText: '',
});

const emit = defineEmits<{
  'update:modelValue': [files: UploaderFile[]];
  oversize: [file: UploaderFile];
  'click-upload': [];
  'click-preview': [file: UploaderFile, index: number];
  'close-preview': [];
  delete: [index: number];
}>();

const showUploadButton = computed(
  () => props.showUpload && props.modelValue.length < props.maxCount,
);

function onDelete(index: number) {
  if (props.disabled) return;
  const newFiles = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', newFiles);
  emit('delete', index);
}

function onClickUpload() {
  if (props.disabled) return;
  if (props.modelValue.length >= props.maxCount) {
    return;
  }
  emit('click-upload');
}

function onClickPreview(file: UploaderFile, index: number) {
  emit('click-preview', file, index);
}

function getStatusColor(status?: string) {
  if (status === 'failed') return '#ee0a24';
  if (status === 'uploading') return '#1989fa';
  return '#07c160';
}
</script>

<template>
  <view :style="{
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  }">
    <!-- Preview items -->
    <view
      v-for="(file, index) in modelValue"
      :key="index"
      :style="{
        width: previewSize,
        height: previewSize,
        marginRight: 8,
        marginBottom: 8,
        position: 'relative',
      }"
    >
      <!-- Image placeholder -->
      <view
        :style="{
          width: previewSize,
          height: previewSize,
          backgroundColor: '#f7f8fa',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }"
        @tap="() => onClickPreview(file, index)"
      >
        <text v-if="previewImage" :style="{ fontSize: 12, color: '#969799' }">
          {{ file.status === 'uploading' ? 'Uploading...' : (file.status === 'failed' ? 'Failed' : 'Done') }}
        </text>
      </view>

      <!-- Status overlay -->
      <view
        v-if="file.status && file.status !== 'done'"
        :style="{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(50,50,51,0.8)',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <text :style="{ fontSize: 10, color: getStatusColor(file.status) }">
          {{ file.message || file.status }}
        </text>
      </view>

      <!-- Delete button -->
      <view
        v-if="deletable && !disabled"
        :style="{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="() => onDelete(index)"
      >
        <text :style="{ fontSize: 10, color: '#fff', lineHeight: 16 }">&times;</text>
      </view>
    </view>

    <!-- Upload button -->
    <view
      v-if="showUploadButton"
      :style="{
        width: previewSize,
        height: previewSize,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#f7f8fa',
        borderRadius: 4,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#dcdee0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }"
      @tap="onClickUpload"
    >
      <text :style="{ fontSize: 24, color: '#dcdee0' }">+</text>
      <text v-if="uploadText" :style="{ fontSize: 12, color: '#969799', marginTop: 4 }">
        {{ uploadText }}
      </text>
    </view>
  </view>
</template>
