<!--
  Vant Feature Parity Report:
  - Props: 8/18 supported (show, title, message, showConfirmButton, showCancelButton,
    confirmButtonText, cancelButtonText, overlay)
  - Events: 4/4 (update:show, confirm, cancel, open/close)
  - Slots: 3/4 (default [message], title, footer; missing: none critical)
  - Sub-components: Overlay ✅
  - Gaps:
    - No width prop
    - No theme prop (round-button)
    - No messageAlign prop
    - No closeOnClickOverlay prop
    - No closeOnPopstate prop
    - No allowHtml prop
    - No beforeClose interceptor
    - No confirmButtonColor/cancelButtonColor props
    - No transition animation
    - No programmatic API (showDialog/showConfirmDialog)
-->
<script setup lang="ts">
import { watch } from 'vue-lynx';
import Overlay from '../Overlay/index.vue';

export interface DialogProps {
  show?: boolean;
  title?: string;
  message?: string;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  overlay?: boolean;
  closeOnClickOverlay?: boolean;
}

const props = withDefaults(defineProps<DialogProps>(), {
  show: false,
  title: '',
  message: '',
  showConfirmButton: true,
  showCancelButton: false,
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  confirmButtonColor: '#1989fa',
  cancelButtonColor: '#646566',
  overlay: true,
  closeOnClickOverlay: false,
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

function onClickOverlay() {
  if (props.closeOnClickOverlay) {
    emit('update:show', false);
  }
}
</script>

<template>
  <template v-if="show">
    <Overlay v-if="overlay" :show="true" :z-index="2000" @click="onClickOverlay" />

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
      <slot name="title">
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
      </slot>

      <!-- Message -->
      <slot>
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
      </slot>

      <!-- Buttons -->
      <slot name="footer">
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
            <text :style="{ fontSize: 16, color: cancelButtonColor }">{{ cancelButtonText }}</text>
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
            <text :style="{ fontSize: 16, color: confirmButtonColor }">{{ confirmButtonText }}</text>
          </view>
        </view>
      </slot>
    </view>
  </template>
</template>
