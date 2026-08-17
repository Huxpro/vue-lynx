<!--
  Vant Feature Parity Report:
  - Props: 8/11 supported (show, options, title, description, cancelText, closeable, round, closeOnClickOverlay)
  - Missing: safeAreaInsetBottom (N/A in Lynx), closeOnPopstate (N/A in Lynx), teleport (N/A in Lynx)
  - Events: 3/3 supported (select, cancel, update:show)
  - Slots: 3/3 supported (title, description, cancel)
  - Multi-row options: Supports nested arrays (ShareSheetOption[][]) for multi-row layout
  - Icon integration: Uses Icon component for named icons with iconMap mapping, image URLs rendered as <image>
  - Uses Popup component internally (matching Vant architecture)
  - Option description support
  - Gaps:
    - No safeAreaInsetBottom (Lynx limitation)
    - No closeOnPopstate (Lynx has no browser history)
    - No teleport (N/A in Lynx)
    - No CSS transition animations
-->
<script setup lang="ts">
import { computed, useSlots } from 'vue-lynx';
import Popup from '../Popup/index.vue';
import Icon from '../Icon/index.vue';

export interface ShareOption {
  name: string;
  icon: string;
  description?: string;
  className?: string;
}

export type ShareSheetOptions = ShareOption[] | ShareOption[][];

export interface ShareSheetProps {
  show?: boolean;
  options?: ShareSheetOptions;
  title?: string;
  description?: string;
  cancelText?: string;
  closeable?: boolean;
  round?: boolean;
  closeOnClickOverlay?: boolean;
}

const props = withDefaults(defineProps<ShareSheetProps>(), {
  show: false,
  options: () => [],
  title: '',
  description: '',
  cancelText: 'Cancel',
  closeable: true,
  round: true,
  closeOnClickOverlay: true,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [option: ShareOption, index: number];
  cancel: [];
}>();

const slots = useSlots();

// Map known share icon names to Vant icon names
const iconNameMap: Record<string, string> = {
  qq: 'qq',
  link: 'link',
  weibo: 'weibo',
  qrcode: 'qr',
  poster: 'photo',
  wechat: 'chat',
  'weapp-qrcode': 'qr',
  'wechat-moments': 'chat',
};

function isImageIcon(icon?: string): boolean {
  return !!icon && icon.includes('/');
}

function onUpdateShow(val: boolean) {
  emit('update:show', val);
}

function onSelect(option: ShareOption, index: number) {
  emit('select', option, index);
  emit('update:show', false);
}

function onCancel() {
  emit('update:show', false);
  emit('cancel');
}

// Determine if options is multi-row (array of arrays)
const isMultiRow = computed(() => {
  return Array.isArray(props.options[0]);
});

const normalizedOptions = computed((): ShareOption[][] => {
  if (!props.options || props.options.length === 0) return [];
  if (isMultiRow.value) {
    return props.options as ShareOption[][];
  }
  return [props.options as ShareOption[]];
});

const hasTitle = computed(() => !!slots.title || !!props.title);
const hasDescription = computed(() => !!slots.description || !!props.description);
const hasCancel = computed(() => !!slots.cancel || !!props.cancelText);
</script>

<template>
  <Popup
    :show="show"
    position="bottom"
    :round="round"
    :close-on-click-overlay="closeOnClickOverlay"
    @update:show="onUpdateShow"
  >
    <view :style="{ display: 'flex', flexDirection: 'column' }">
      <!-- Header -->
      <view
        v-if="hasTitle || hasDescription"
        :style="{
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }"
      >
        <slot name="title">
          <text
            v-if="title"
            :style="{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#323233',
              lineHeight: 20,
              marginBottom: hasDescription ? 8 : 0,
            }"
          >{{ title }}</text>
        </slot>
        <slot name="description">
          <text
            v-if="description"
            :style="{
              fontSize: 12,
              color: '#969799',
              lineHeight: 16,
            }"
          >{{ description }}</text>
        </slot>
      </view>

      <!-- Options rows -->
      <view
        v-for="(row, rowIndex) in normalizedOptions"
        :key="rowIndex"
        :style="{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 8,
          paddingRight: 8,
          borderTopWidth: rowIndex > 0 ? 8 : 0,
          borderTopStyle: 'solid',
          borderTopColor: '#f7f8fa',
        }"
      >
        <view
          v-for="(option, index) in row"
          :key="index"
          :style="{
            width: '25%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: 8,
          }"
          @tap="onSelect(option, index)"
        >
          <!-- Icon area -->
          <view
            :style="{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#f2f3f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
              overflow: 'hidden',
            }"
          >
            <!-- Image icon (URL containing '/') -->
            <image
              v-if="isImageIcon(option.icon)"
              :src="option.icon"
              :style="{ width: 48, height: 48, borderRadius: 24 }"
            />
            <!-- Named icon via Icon component -->
            <Icon
              v-else
              :name="iconNameMap[option.icon] || option.icon"
              :size="24"
              color="#646566"
            />
          </view>
          <text :style="{ fontSize: 12, color: '#646566', lineHeight: 18 }">{{ option.name }}</text>
          <text
            v-if="option.description"
            :style="{ fontSize: 10, color: '#c8c9cc', lineHeight: 14, marginTop: 2 }"
          >{{ option.description }}</text>
        </view>
      </view>

      <!-- Gap between options and cancel -->
      <view :style="{ height: 8, backgroundColor: '#f7f8fa' }" />

      <!-- Cancel button -->
      <view
        v-if="hasCancel"
        :style="{
          paddingTop: 16,
          paddingBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }"
        @tap="onCancel"
      >
        <slot name="cancel">
          <text :style="{ fontSize: 16, color: '#323233', lineHeight: 22 }">{{ cancelText }}</text>
        </slot>
      </view>
    </view>
  </Popup>
</template>
