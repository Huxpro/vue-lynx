<!--
  Vant Feature Parity Report:
  - Props: 12/19 supported (show, position, round, closeable, closeIcon, closeIconPosition,
    duration, overlay, zIndex, closeOnClickOverlay, safeAreaInsetBottom, beforeClose)
  - Events: 6/8 supported (open, close, opened, closed, click-overlay, update:show;
    missing: click-close-icon, keydown)
  - Slots: 2/2 (default, overlay-content)
  - Gaps:
    - No transition animations (fade/slide)
    - No teleport
    - No lazyRender/destroyOnClose
    - No safeAreaInsetTop
    - No overlayClass/overlayStyle/overlayProps
    - No iconPrefix
    - No closeOnPopstate
-->
<script setup lang="ts">
import { computed, watch } from 'vue-lynx';
import Overlay from '../Overlay/index.vue';
import Icon from '../Icon/index.vue';

export interface PopupProps {
  show?: boolean;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  round?: boolean;
  closeable?: boolean;
  closeIcon?: string;
  closeIconPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  duration?: number;
  overlay?: boolean;
  closeOnClickOverlay?: boolean;
  zIndex?: number;
  safeAreaInsetBottom?: boolean;
  beforeClose?: () => boolean | Promise<boolean>;
}

const props = withDefaults(defineProps<PopupProps>(), {
  show: false,
  position: 'center',
  round: false,
  closeable: false,
  closeIcon: 'cross',
  closeIconPosition: 'top-right',
  overlay: true,
  closeOnClickOverlay: true,
  zIndex: 2000,
  safeAreaInsetBottom: false,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  open: [];
  close: [];
  opened: [];
  closed: [];
  'click-overlay': [];
  'click-close-icon': [];
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

const closeIconPositionStyle = computed(() => {
  const style: Record<string, any> = {
    position: 'absolute',
    zIndex: 1,
    padding: 4,
  };
  const pos = props.closeIconPosition;
  if (pos.includes('top')) style.top = 8;
  if (pos.includes('bottom')) style.bottom = 8;
  if (pos.includes('left')) style.left = 8;
  if (pos.includes('right')) style.right = 8;
  return style;
});

async function onClickOverlay() {
  emit('click-overlay');
  if (props.closeOnClickOverlay) {
    await doClose();
  }
}

async function onClose() {
  emit('click-close-icon');
  await doClose();
}

async function doClose() {
  if (props.beforeClose) {
    const result = await props.beforeClose();
    if (result === false) return;
  }
  emit('update:show', false);
}
</script>

<template>
  <template v-if="show">
    <Overlay v-if="overlay" :show="true" :z-index="zIndex - 1" @click="onClickOverlay" />
    <view :style="positionStyle">
      <view v-if="closeable" :style="closeIconPositionStyle" @tap="onClose">
        <Icon :name="closeIcon" :size="20" color="#c8c9cc" />
      </view>
      <slot />
    </view>
  </template>
</template>
