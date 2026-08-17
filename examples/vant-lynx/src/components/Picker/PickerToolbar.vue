<!--
  PickerToolbar — toolbar sub-component matching Vant's PickerToolbar.tsx
-->
<script setup lang="ts">
import { createNamespace } from '../../utils/create';

const [, bem] = createNamespace('picker');

defineProps<{
  title?: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function onConfirm() {
  emit('confirm');
}

function onCancel() {
  emit('cancel');
}
</script>

<template>
  <view :class="bem('toolbar')">
    <slot name="toolbar">
      <view :class="bem('cancel')" @tap="onCancel">
        <slot name="cancel">
          <text :class="bem('cancel-text')">{{ cancelButtonText || 'Cancel' }}</text>
        </slot>
      </view>
      <slot name="title">
        <view v-if="title" :class="bem('title')">
          <text :class="bem('title-text')">{{ title }}</text>
        </view>
        <view v-else :class="bem('title')" />
      </slot>
      <view :class="bem('confirm')" @tap="onConfirm">
        <slot name="confirm">
          <text :class="bem('confirm-text')">{{ confirmButtonText || 'Confirm' }}</text>
        </slot>
      </view>
    </slot>
  </view>
</template>
