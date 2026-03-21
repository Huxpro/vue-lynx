<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface ShareOption {
  name: string;
  icon?: string;
  description?: string;
}

export interface ShareSheetProps {
  show?: boolean;
  options?: ShareOption[];
  title?: string;
  description?: string;
  cancelText?: string;
}

const props = withDefaults(defineProps<ShareSheetProps>(), {
  show: false,
  options: () => [],
  title: '',
  description: '',
  cancelText: 'Cancel',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  select: [option: ShareOption, index: number];
  cancel: [];
  open: [];
  close: [];
}>();

function onSelect(option: ShareOption, index: number) {
  emit('select', option, index);
  emit('update:show', false);
  emit('close');
}

function onCancel() {
  emit('cancel');
  emit('update:show', false);
  emit('close');
}

function onOverlayClick() {
  emit('update:show', false);
  emit('close');
}
</script>

<template>
  <view
    v-if="show"
    :style="{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }"
  >
    <view
      :style="{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
      }"
      @tap="onOverlayClick"
    />
    <view
      :style="{
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 8,
        zIndex: 1,
      }"
    >
      <view v-if="title || description" :style="{ padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }">
        <text v-if="title" :style="{ fontSize: 14, fontWeight: 'bold', color: '#323233', marginBottom: description ? 8 : 0 }">{{ title }}</text>
        <text v-if="description" :style="{ fontSize: 12, color: '#969799' }">{{ description }}</text>
      </view>
      <view :style="{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', padding: 16 }">
        <view
          v-for="(option, index) in options"
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
          <view :style="{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f2f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }">
            <text :style="{ fontSize: 20 }">{{ option.icon || '\u2709' }}</text>
          </view>
          <text :style="{ fontSize: 12, color: '#646566' }">{{ option.name }}</text>
        </view>
      </view>
      <view :style="{ height: 8, backgroundColor: '#f7f8fa' }" />
      <view :style="{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }" @tap="onCancel">
        <text :style="{ fontSize: 16, color: '#323233' }">{{ cancelText }}</text>
      </view>
    </view>
  </view>
</template>
