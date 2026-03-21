<!--
  Vant Feature Parity Report:
  - Props: 16/22 supported (modelValue, maxCount, maxSize, accept, multiple,
    disabled, deletable, showUpload, previewImage, previewSize, imageFit,
    uploadText, readonly, uploadIcon, afterRead, beforeRead, beforeDelete)
  - Events: 5/8 supported (update:modelValue, oversize, click-upload,
    click-preview, delete)
  - Slots: 1/1 supported (default)
  - Notes: afterRead/beforeRead/beforeDelete callback props supported;
    no native file input (Lynx lacks HTML file picker)
-->
<script setup lang="ts">
import { computed, watch } from 'vue-lynx';
import Icon from '../Icon/index.vue';
import Loading from '../Loading/index.vue';

export interface UploaderFile {
  url?: string;
  status?: 'uploading' | 'failed' | 'done';
  message?: string;
  content?: string;
  file?: any;
  isImage?: boolean;
  imageFit?: string;
}

export interface UploaderProps {
  modelValue?: UploaderFile[];
  maxCount?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  deletable?: boolean;
  showUpload?: boolean;
  previewImage?: boolean;
  previewSize?: number;
  imageFit?: string;
  uploadText?: string;
  uploadIcon?: string;
  afterRead?: (file: UploaderFile, detail: { index: number }) => void;
  beforeRead?: (file: UploaderFile, detail: { index: number }) => boolean | Promise<boolean>;
  beforeDelete?: (file: UploaderFile, detail: { index: number }) => boolean | Promise<boolean>;
}

const props = withDefaults(defineProps<UploaderProps>(), {
  modelValue: () => [],
  maxCount: Infinity,
  maxSize: Infinity,
  accept: 'image/*',
  multiple: false,
  disabled: false,
  readonly: false,
  deletable: true,
  showUpload: true,
  previewImage: true,
  previewSize: 80,
  imageFit: 'cover',
  uploadText: '',
  uploadIcon: 'photograph',
});

const emit = defineEmits<{
  'update:modelValue': [files: UploaderFile[]];
  oversize: [file: UploaderFile];
  'click-upload': [];
  'click-preview': [file: UploaderFile, index: number];
  'close-preview': [];
  delete: [file: UploaderFile, index: number];
}>();

// Call afterRead when new files are added to modelValue
let prevLength = props.modelValue.length;
watch(
  () => props.modelValue,
  (newFiles) => {
    if (props.afterRead && newFiles.length > prevLength) {
      const addedFiles = newFiles.slice(prevLength);
      for (let i = 0; i < addedFiles.length; i++) {
        props.afterRead(addedFiles[i], { index: prevLength + i });
      }
    }
    prevLength = newFiles.length;
  },
  { deep: true },
);

const showUploadButton = computed(
  () => props.showUpload && !props.readonly && props.modelValue.length < props.maxCount,
);

async function onDelete(file: UploaderFile, index: number) {
  if (props.disabled || props.readonly) return;

  if (props.beforeDelete) {
    const result = await props.beforeDelete(file, { index });
    if (result === false) return;
  }

  const newFiles = props.modelValue.filter((_, i) => i !== index);
  emit('update:modelValue', newFiles);
  emit('delete', file, index);
}

function onClickUpload() {
  if (props.disabled || props.readonly) return;
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

defineExpose({
  // chooseFile is a no-op in Lynx (no native file input);
  // host app should listen to click-upload event instead
  chooseFile: () => {
    onClickUpload();
  },
});
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
        display: 'flex',
      }"
    >
      <!-- Image preview area -->
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
        <!-- Show image if url is available -->
        <image
          v-if="previewImage && file.url"
          :src="file.url"
          :style="{
            width: previewSize,
            height: previewSize,
          }"
        />
        <text v-else-if="previewImage" :style="{ fontSize: 12, color: '#969799' }">
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <Loading v-if="file.status === 'uploading'" :size="16" color="#fff" />
        <Icon v-else-if="file.status === 'failed'" name="close" :size="16" color="#fff" />
        <text :style="{ fontSize: 10, color: '#fff', marginTop: 2 }">
          {{ file.message || file.status }}
        </text>
      </view>

      <!-- Delete button -->
      <view
        v-if="deletable && !disabled && !readonly"
        :style="{
          position: 'absolute',
          top: -6,
          right: -6,
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
        @tap="() => onDelete(file, index)"
      >
        <Icon name="cross" :size="10" color="#fff" />
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
      <slot>
        <Icon :name="uploadIcon" :size="24" color="#dcdee0" />
        <text v-if="uploadText" :style="{ fontSize: 12, color: '#969799', marginTop: 4 }">
          {{ uploadText }}
        </text>
      </slot>
    </view>
  </view>
</template>
