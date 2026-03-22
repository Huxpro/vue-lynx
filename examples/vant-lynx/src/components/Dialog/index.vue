<!--
  Vant Feature Parity Report:
  - Props: 10/18 supported (show, title, message, showConfirmButton, showCancelButton,
    confirmButtonText, cancelButtonText, confirmButtonColor, cancelButtonColor, overlay,
    closeOnClickOverlay, duration)
  - Events: 4/4 (update:show, confirm, cancel, open/close)
  - Slots: 3/4 (default [message], title, footer; missing: none critical)
  - Exposed methods: open(), close()
  - Sub-components: Overlay
  - Animation: Zoom in/out (scale 0.9→1 + opacity) using CSS transition + Vue <Transition>
-->
<script setup lang="ts">
import { ref, computed, watch, Transition } from 'vue-lynx';
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
  duration?: number | string;
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
  duration: 0.3,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
  open: [];
  close: [];
}>();

const hasRendered = ref(false);

const durationMs = computed(() => Number(props.duration) * 1000);

watch(
  () => props.show,
  (val) => {
    if (val) {
      hasRendered.value = true;
      emit('open');
    } else if (hasRendered.value) {
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

function open() {
  emit('update:show', true);
}

function close() {
  emit('update:show', false);
}

defineExpose({ open, close });

const dialogStyle = computed(() => ({
  backgroundColor: '#fff',
  borderRadius: 16,
  width: 320,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column' as const,
  transition: `opacity ${props.duration}s ease, transform ${props.duration}s ease`,
}));
</script>

<template>
  <template v-if="hasRendered">
    <Overlay v-if="overlay" :show="show" :z-index="2000" :duration="duration" @click="onClickOverlay" />

    <!-- Flex centering wrapper (avoids transform: translate(-50%, -50%) conflict with zoom) -->
    <view
      :style="{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2001,
        pointerEvents: 'none',
      }"
    >
      <Transition name="van-popup-zoom" :duration="durationMs">
        <view v-show="show" :style="dialogStyle">
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
      </Transition>
    </view>
  </template>
</template>
