<!--
  Lynx Limitations:
  - teleport: accepted for API compat but Lynx has no Teleport support
  - closeOnPopstate: accepted for API compat but no browser history API in Lynx
  - lockScroll: accepted for API compat but no document.body scroll in Lynx
  - safeAreaInsetBottom: accepted for API compat
  - <button> tag: uses <view> instead (Lynx has no HTML tags)
  - ::before hairline: uses border-top 0.5px instead for row border
  - ::before cancel gap: uses separate <view> element instead of pseudo-element
  - :active pseudo-class: not supported in Lynx
  - cursor: not applicable in Lynx
  - overflow-x: auto: options row uses scroll-view for horizontal scrolling
  - HAPTICS_FEEDBACK: not available in Lynx
  - <h2> / <span>: uses <text> instead (Lynx has no HTML tags)
  - <img>: uses <image> instead
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import Popup from '../Popup/index.vue';
import Icon from '../Icon/index.vue';
import type { ShareSheetOption } from './types';
import './index.less';

const [, bem] = createNamespace('share-sheet');

const props = withDefaults(
  defineProps<{
    show?: boolean;
    title?: string;
    round?: boolean;
    options?: ShareSheetOption[] | ShareSheetOption[][];
    cancelText?: string;
    description?: string;
    closeOnPopstate?: boolean;
    safeAreaInsetBottom?: boolean;
    // Popup shared props
    zIndex?: number | string;
    overlay?: boolean;
    duration?: number | string;
    lockScroll?: boolean;
    lazyRender?: boolean;
    beforeClose?: (...args: any[]) => boolean | Promise<boolean>;
    overlayProps?: Record<string, any>;
    overlayStyle?: Record<string, any>;
    overlayClass?: string | string[] | Record<string, boolean>;
    transitionAppear?: boolean;
    closeOnClickOverlay?: boolean;
    teleport?: string | object;
  }>(),
  {
    show: false,
    round: true,
    options: () => [],
    safeAreaInsetBottom: true,
    overlay: true,
    closeOnClickOverlay: true,
    lockScroll: true,
    lazyRender: true,
  },
);

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [option: ShareSheetOption, index: number];
  cancel: [];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [event: any];
}>();

defineSlots<{
  title?: () => any;
  description?: () => any;
  cancel?: () => any;
}>();

// Map known share icon names to Vant icon names
const iconMap: Record<string, string> = {
  qq: 'qq',
  link: 'link-o',
  weibo: 'weibo',
  qrcode: 'qr',
  poster: 'photo-o',
  wechat: 'wechat',
  'weapp-qrcode': 'miniprogram-o',
  'wechat-moments': 'wechat-moments',
};

function isImage(name?: string): boolean {
  return !!name && name.includes('/');
}

const updateShow = (value: boolean) => emit('update:show', value);

const onCancel = () => {
  updateShow(false);
  emit('cancel');
};

const onSelect = (option: ShareSheetOption, index: number) => {
  emit('select', option, index);
};

// Normalize options: always return array of arrays for rendering
const isMultiRow = computed(() => {
  return Array.isArray(props.options[0]);
});

const normalizedOptions = computed((): ShareSheetOption[][] => {
  if (!props.options || props.options.length === 0) return [];
  if (isMultiRow.value) {
    return props.options as ShareSheetOption[][];
  }
  return [props.options as ShareSheetOption[]];
});

const hasHeader = computed(() => {
  return !!props.title || !!props.description;
});

const hasCancelText = computed(() => {
  return props.cancelText !== '' && props.cancelText !== undefined;
});

const popupProps = computed(() => ({
  show: props.show,
  position: 'bottom' as const,
  round: props.round,
  closeable: false,
  closeOnPopstate: props.closeOnPopstate,
  safeAreaInsetBottom: props.safeAreaInsetBottom,
  zIndex: props.zIndex,
  overlay: props.overlay,
  duration: props.duration,
  lockScroll: props.lockScroll,
  lazyRender: props.lazyRender,
  beforeClose: props.beforeClose,
  overlayProps: props.overlayProps,
  overlayStyle: props.overlayStyle,
  overlayClass: props.overlayClass,
  transitionAppear: props.transitionAppear,
  closeOnClickOverlay: props.closeOnClickOverlay,
  teleport: props.teleport,
}));
</script>

<template>
  <Popup
    v-bind="popupProps"
    @update:show="updateShow"
    @open="emit('open')"
    @close="emit('close')"
    @opened="emit('opened')"
    @closed="emit('closed')"
    @click-overlay="(e: any) => emit('click-overlay', e)"
  >
    <view :class="bem()">
      <!-- Header -->
      <view v-if="hasHeader || $slots.title || $slots.description" :class="bem('header')">
        <slot name="title">
          <text v-if="title" :class="bem('title')">{{ title }}</text>
        </slot>
        <slot name="description">
          <text v-if="description" :class="bem('description')">{{ description }}</text>
        </slot>
      </view>

      <!-- Options rows -->
      <scroll-view
        v-for="(row, rowIndex) in normalizedOptions"
        :key="rowIndex"
        scroll-orientation="horizontal"
        :class="[bem('options', { border: rowIndex !== 0 })]"
      >
        <view
          v-for="(option, optIndex) in row"
          :key="optIndex"
          :class="[bem('option'), option.className]"
          @tap="onSelect(option, optIndex)"
        >
          <!-- Image icon (URL containing '/') -->
          <image
            v-if="isImage(option.icon)"
            :src="option.icon"
            :class="bem('image-icon')"
          />
          <!-- Named icon -->
          <view v-else :class="bem('icon', [option.icon])">
            <Icon :name="iconMap[option.icon] || option.icon" />
          </view>
          <text v-if="option.name" :class="bem('name')">{{ option.name }}</text>
          <text v-if="option.description" :class="bem('option-description')">{{ option.description }}</text>
        </view>
      </scroll-view>

      <!-- Cancel button -->
      <template v-if="$slots.cancel || hasCancelText">
        <view :class="bem('cancel-gap')" />
        <view :class="bem('cancel')" @tap="onCancel">
          <slot name="cancel">
            <text>{{ cancelText }}</text>
          </slot>
        </view>
      </template>
    </view>
  </Popup>
</template>
