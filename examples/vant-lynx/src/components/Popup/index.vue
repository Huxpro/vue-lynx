<script setup lang="ts">
import { computed, watch } from 'vue-lynx';
import Overlay from '../Overlay/index.vue';

export interface PopupProps {
  show?: boolean;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  round?: boolean;
  closeable?: boolean;
  closeIcon?: string;
  duration?: number;
  overlay?: boolean;
  zIndex?: number;
}

const props = withDefaults(defineProps<PopupProps>(), {
  show: false,
  position: 'center',
  round: false,
  closeable: false,
  overlay: true,
  zIndex: 2000,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [];
}>();

watch(
  () => props.show,
  (val) => {
    if (val) {
      emit('open');
      emit('opened');
    } else {
      emit('close');
      emit('closed');
    }
  },
);

const positionStyle = computed(() => {
  const base: Record<string, any> = {
    position: 'fixed',
    zIndex: props.zIndex,
    backgroundColor: '#fff',
    overflow: 'hidden',
  };

  if (props.position === 'center') {
    return {
      ...base,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: props.round ? 16 : 0,
      minWidth: 200,
    };
  }

  if (props.position === 'bottom') {
    return {
      ...base,
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: props.round ? 16 : 0,
      borderTopRightRadius: props.round ? 16 : 0,
    };
  }

  if (props.position === 'top') {
    return {
      ...base,
      top: 0,
      left: 0,
      right: 0,
      borderBottomLeftRadius: props.round ? 16 : 0,
      borderBottomRightRadius: props.round ? 16 : 0,
    };
  }

  if (props.position === 'left') {
    return { ...base, top: 0, bottom: 0, left: 0, width: '80%' };
  }

  if (props.position === 'right') {
    return { ...base, top: 0, bottom: 0, right: 0, width: '80%' };
  }

  return base;
});

function onClickOverlay() {
  emit('click-overlay');
  emit('update:show', false);
}

function onClose() {
  emit('update:show', false);
}
</script>

<template>
  <template v-if="show">
    <Overlay v-if="overlay" :show="true" :z-index="zIndex - 1" @click="onClickOverlay" />
    <view :style="positionStyle">
      <text
        v-if="closeable"
        :style="{
          position: 'absolute',
          top: 8,
          right: 8,
          fontSize: 20,
          color: '#c8c9cc',
          zIndex: 1,
          padding: 4,
        }"
        @tap="onClose"
      >&times;</text>
      <slot />
    </view>
  </template>
</template>
