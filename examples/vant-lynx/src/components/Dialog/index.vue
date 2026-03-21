<script setup lang="ts">
import { watch } from 'vue-lynx';

export interface DialogProps {
  show?: boolean;
  title?: string;
  message?: string;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  overlay?: boolean;
}

const props = withDefaults(defineProps<DialogProps>(), {
  show: false,
  title: '',
  message: '',
  showConfirmButton: true,
  showCancelButton: false,
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  overlay: true,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
  open: [];
  close: [];
}>();

watch(
  () => props.show,
  (val) => {
    if (val) {
      emit('open');
    } else {
      emit('close');
    }
  },
);

function onConfirm() {
  emit('confirm');
  emit('update:show', false);
}

function onCancel() {
  emit('cancel');
  emit('update:show', false);
}
</script>

<template>
  <template v-if="show">
    <!-- Overlay -->
    <view
      v-if="overlay"
      :style="{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 2000,
      }"
    />

    <!-- Dialog box -->
    <view
      :style="{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2001,
        backgroundColor: '#fff',
        borderRadius: 16,
        width: 320,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }"
    >
      <!-- Title -->
      <view
        v-if="title"
        :style="{
          paddingTop: 26,
          paddingBottom: message ? 8 : 26,
          paddingLeft: 24,
          paddingRight: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <text
          :style="{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#323233',
            textAlign: 'center',
            lineHeight: 24,
          }"
        >{{ title }}</text>
      </view>

      <!-- Message -->
      <view
        v-if="message"
        :style="{
          paddingTop: title ? 8 : 26,
          paddingBottom: 26,
          paddingLeft: 24,
          paddingRight: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }"
      >
        <text
          :style="{
            fontSize: 14,
            color: title ? '#646566' : '#323233',
            textAlign: 'center',
            lineHeight: 20,
          }"
        >{{ message }}</text>
      </view>

      <!-- Buttons -->
      <view
        :style="{
          display: 'flex',
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopStyle: 'solid',
          borderTopColor: '#ebedf0',
        }"
      >
        <view
          v-if="showCancelButton"
          :style="{
            flex: 1,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRightWidth: showConfirmButton ? 1 : 0,
            borderRightStyle: 'solid',
            borderRightColor: '#ebedf0',
          }"
          @tap="onCancel"
        >
          <text
            :style="{
              fontSize: 16,
              color: '#646566',
            }"
          >{{ cancelButtonText }}</text>
        </view>

        <view
          v-if="showConfirmButton"
          :style="{
            flex: 1,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }"
          @tap="onConfirm"
        >
          <text
            :style="{
              fontSize: 16,
              color: '#1989fa',
            }"
          >{{ confirmButtonText }}</text>
        </view>
      </view>
    </view>
  </template>
</template>
