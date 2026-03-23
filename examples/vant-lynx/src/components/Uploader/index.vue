<!--
  Lynx Limitations:
  - input[type=file]: Lynx has no HTML file input; host app should listen to click-upload
    event and provide files via modelValue
  - FileReader/URL.createObjectURL: not available in Lynx; content/objectUrl must be set
    by the host app
  - capture: HTML-only attribute for camera access
  - lazyLoad: no IntersectionObserver/$Lazyload in Lynx
  - previewFullImage/previewOptions/closePreview: showImagePreview not available in Lynx;
    use click-preview event to handle preview in host app
  - resultType/beforeRead/afterRead: file reading happens on host side, not in component
  - reupload: defined for API compat but chooseFile is a no-op (emits click-upload)
  - display: inline-block: Lynx uses flex layout
-->
<script setup lang="ts">
import { ref, computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Icon from '../Icon/index.vue';
import UploaderPreviewItem from './UploaderPreviewItem.vue';
import { isOversize, filterFiles, getSizeStyle } from './utils';
import type { Numeric } from '../../utils/format';
import type {
  UploaderFileListItem,
  UploaderMaxSize,
  UploaderResultType,
  UploaderBeforeRead,
  UploaderAfterRead,
} from './types';

import './index.less';

const [, bem] = createNamespace('uploader');

interface UploaderProps {
  name?: Numeric;
  accept?: string;
  capture?: string;
  multiple?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  lazyLoad?: boolean;
  maxCount?: Numeric;
  imageFit?: string;
  resultType?: UploaderResultType;
  uploadIcon?: string;
  uploadText?: string;
  deletable?: boolean;
  reupload?: boolean;
  afterRead?: UploaderAfterRead;
  showUpload?: boolean;
  modelValue?: UploaderFileListItem[];
  beforeRead?: UploaderBeforeRead;
  beforeDelete?: (...args: unknown[]) => boolean | Promise<boolean>;
  previewSize?: Numeric | [Numeric, Numeric];
  previewImage?: boolean;
  previewOptions?: Record<string, unknown>;
  previewFullImage?: boolean;
  maxSize?: UploaderMaxSize;
}

const props = withDefaults(defineProps<UploaderProps>(), {
  name: '',
  accept: 'image/*',
  multiple: false,
  disabled: false,
  readonly: false,
  lazyLoad: false,
  maxCount: Infinity,
  imageFit: 'cover',
  resultType: 'dataUrl',
  uploadIcon: 'photograph',
  deletable: true,
  reupload: false,
  showUpload: true,
  modelValue: () => [],
  previewImage: true,
  previewFullImage: true,
  maxSize: Infinity,
});

const emit = defineEmits<{
  'update:modelValue': [files: UploaderFileListItem[]];
  delete: [item: UploaderFileListItem, detail: { name: Numeric; index: number }];
  oversize: [
    items: UploaderFileListItem | UploaderFileListItem[],
    detail: { name: Numeric; index: number },
  ];
  'click-upload': [event?: Event];
  'close-preview': [];
  'click-preview': [item: UploaderFileListItem, detail: { name: Numeric; index: number }];
  'click-reupload': [item: UploaderFileListItem, detail: { name: Numeric; index: number }];
}>();

const slots = defineSlots<{
  default?: () => void;
  'preview-cover'?: (props: { index: number } & UploaderFileListItem) => void;
  'preview-delete'?: () => void;
}>();

const uploadActive = ref(false);

const getDetail = (index = props.modelValue.length) => ({
  name: props.name,
  index,
});

const lessThanMax = computed(
  () => props.modelValue.length < +props.maxCount,
);

const showUploadArea = computed(
  () => props.showUpload && lessThanMax.value,
);

function deleteFile(item: UploaderFileListItem, index: number) {
  const fileList = props.modelValue.slice(0);
  fileList.splice(index, 1);
  emit('update:modelValue', fileList);
  emit('delete', item, getDetail(index));
}

function onClickUpload(event?: Event) {
  if (props.disabled || props.readonly) return;
  emit('click-upload', event);
}

function onPreviewItem(item: UploaderFileListItem, index: number) {
  if (props.reupload) {
    emit('click-reupload', item, getDetail(index));
  } else {
    emit('click-preview', item, getDetail(index));
  }
}

function onDeleteItem(index: number) {
  const item = props.modelValue[index];
  deleteFile(item, index);
}

function onReuploadItem(index: number) {
  const item = props.modelValue[index];
  emit('click-reupload', item, getDetail(index));
}

function getItemDeletable(item: UploaderFileListItem): boolean {
  return item.deletable ?? props.deletable;
}

function getItemBeforeDelete(item: UploaderFileListItem) {
  return item.beforeDelete ?? props.beforeDelete;
}

function getItemPreviewSize(item: UploaderFileListItem) {
  return item.previewSize ?? props.previewSize;
}

function getItemImageFit(item: UploaderFileListItem) {
  return item.imageFit ?? props.imageFit;
}

function getItemReupload(item: UploaderFileListItem) {
  return item.reupload ?? props.reupload;
}

// Exposed methods matching Vant's useExpose
function chooseFile() {
  // Lynx has no file input; emit click-upload for host app to handle
  if (!props.disabled) {
    onClickUpload();
  }
}

function closeImagePreview() {
  // No-op in Lynx; emit close-preview for host app
  emit('close-preview');
}

function reuploadFile(index: number) {
  // Emit click-reupload for host app to handle
  const item = props.modelValue[index];
  if (item) {
    emit('click-reupload', item, getDetail(index));
  }
}

defineExpose({
  chooseFile,
  closeImagePreview,
  reuploadFile,
});
</script>

<template>
  <view :class="bem()">
    <view :class="bem('wrapper', { disabled })">
      <!-- Preview list -->
      <template v-if="previewImage">
        <UploaderPreviewItem
          v-for="(item, index) in modelValue"
          :key="index"
          :item="item"
          :index="index"
          :name="name"
          :image-fit="getItemImageFit(item)"
          :lazy-load="lazyLoad"
          :deletable="getItemDeletable(item)"
          :reupload="getItemReupload(item)"
          :preview-size="getItemPreviewSize(item)"
          :before-delete="getItemBeforeDelete(item)"
          @preview="onPreviewItem(item, index)"
          @delete="onDeleteItem(index)"
          @reupload="onReuploadItem(index)"
        >
          <template v-if="slots['preview-cover']" #preview-cover="coverProps">
            <slot name="preview-cover" v-bind="coverProps" />
          </template>
          <template v-if="slots['preview-delete']" #preview-delete>
            <slot name="preview-delete" />
          </template>
        </UploaderPreviewItem>
      </template>

      <!-- Custom upload area (default slot) -->
      <template v-if="slots.default">
        <view
          v-if="lessThanMax"
          :class="bem('input-wrapper')"
          @tap="onClickUpload"
        >
          <slot />
        </view>
      </template>

      <!-- Default upload button -->
      <template v-else>
        <view
          v-if="showUploadArea"
          :class="bem('upload', { readonly, active: uploadActive })"
          :style="getSizeStyle(previewSize)"
          @tap="onClickUpload"
          @touchstart="uploadActive = true"
          @touchend="uploadActive = false"
          @touchcancel="uploadActive = false"
        >
          <Icon :name="uploadIcon" :class="bem('upload-icon')" />
          <text v-if="uploadText" :class="bem('upload-text')">
            {{ uploadText }}
          </text>
        </view>
      </template>
    </view>
  </view>
</template>
