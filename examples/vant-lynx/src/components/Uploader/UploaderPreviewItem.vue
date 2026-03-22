<!--
  Sub-component matching Vant's UploaderPreviewItem.tsx
  Renders a single preview item with image/file, mask overlay, and delete button.
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { isDef } from '../../utils/format';
import { isImageFile, getSizeStyle } from './utils';
import Icon from '../Icon/index.vue';
import VanImage from '../Image/index.vue';
import Loading from '../Loading/index.vue';
import type { UploaderFileListItem } from './types';
import type { Numeric } from '../../utils/format';

const [, bem] = createNamespace('uploader');

interface PreviewItemProps {
  item: UploaderFileListItem;
  index?: number;
  name?: Numeric;
  imageFit?: string;
  lazyLoad?: boolean;
  deletable?: boolean;
  reupload?: boolean;
  previewSize?: Numeric | [Numeric, Numeric];
  beforeDelete?: (...args: unknown[]) => boolean | Promise<boolean>;
}

const props = withDefaults(defineProps<PreviewItemProps>(), {
  index: 0,
  name: '',
  imageFit: 'cover',
  lazyLoad: false,
  deletable: true,
  reupload: false,
});

const emit = defineEmits<{
  delete: [];
  preview: [];
  reupload: [];
}>();

const slots = defineSlots<{
  'preview-cover'?: (props: { index: number } & UploaderFileListItem) => void;
  'preview-delete'?: () => void;
}>();

const isImage = computed(() => isImageFile(props.item));

const imageSrc = computed(() => {
  const { item } = props;
  return item.objectUrl || item.content || item.url;
});

const sizeStyle = computed(() => getSizeStyle(props.previewSize));

function onDelete(event: Event) {
  event.stopPropagation?.();
  const { name, item, index, beforeDelete } = props;
  if (beforeDelete) {
    const result = beforeDelete(item, { name, index });
    if (result === false) return;
    if (result && typeof (result as Promise<boolean>).then === 'function') {
      (result as Promise<boolean>)
        .then((val) => {
          if (val !== false) emit('delete');
        })
        .catch(() => {});
      return;
    }
  }
  emit('delete');
}

function onPreview() {
  emit('preview');
}

function onReupload() {
  emit('reupload');
}

function onItemClick() {
  if (props.reupload) {
    onReupload();
  } else {
    onPreview();
  }
}
</script>

<template>
  <view :class="bem('preview')">
    <!-- Image preview -->
    <template v-if="isImage">
      <view :class="bem('preview-image')" :style="sizeStyle" @tap="onItemClick">
        <VanImage
          :src="imageSrc"
          :fit="imageFit"
          :width="Array.isArray(previewSize) ? previewSize[0] : previewSize"
          :height="Array.isArray(previewSize) ? previewSize[1] : previewSize"
        >
          <template v-if="slots['preview-cover']" #default>
            <view :class="bem('preview-cover')">
              <slot name="preview-cover" v-bind="{ ...item, index }" />
            </view>
          </template>
        </VanImage>
      </view>
    </template>

    <!-- Non-image file preview -->
    <template v-else>
      <view :class="bem('file')" :style="sizeStyle" @tap="onItemClick">
        <Icon name="description" :class="bem('file-icon')" />
        <text :class="bem('file-name')">
          {{ item.file ? item.file.name : item.url }}
        </text>
        <view v-if="slots['preview-cover']" :class="bem('preview-cover')">
          <slot name="preview-cover" v-bind="{ ...item, index }" />
        </view>
      </view>
    </template>

    <!-- Status mask -->
    <view v-if="item.status === 'uploading' || item.status === 'failed'" :class="bem('mask')">
      <Icon v-if="item.status === 'failed'" name="close" :class="bem('mask-icon')" />
      <Loading v-else :class="bem('loading')" />
      <text
        v-if="isDef(item.message) && item.message !== ''"
        :class="bem('mask-message')"
      >
        {{ item.message }}
      </text>
    </view>

    <!-- Delete button -->
    <view
      v-if="deletable && item.status !== 'uploading'"
      :class="bem('preview-delete', { shadow: !slots['preview-delete'] })"
      @tap="onDelete"
    >
      <slot name="preview-delete">
        <Icon name="cross" :class="bem('preview-delete-icon')" />
      </slot>
    </view>
  </view>
</template>
