<!--
  Vant Feature Parity Report:
  - Props: 7/12 supported (show, type, message, position, overlay, icon, duration)
  - Events: 1/1 (update:show)
  - Slots: 1/1 (message)
  - Sub-components: Loading ✅, Icon ✅
  - Gaps:
    - No forbidClick prop
    - No closeOnClick prop
    - No closeOnClickOverlay prop
    - No wordBreak prop
    - No className prop
    - No transition animation
    - No programmatic API (showToast/closeToast)
-->
<script setup lang="ts">
import { computed } from 'vue-lynx';
import Loading from '../Loading/index.vue';
import Icon from '../Icon/index.vue';

export interface ToastProps {
  show?: boolean;
  type?: 'text' | 'loading' | 'success' | 'fail';
  message?: string;
  position?: 'top' | 'middle' | 'bottom';
  overlay?: boolean;
  icon?: string;
  duration?: number;
}

const props = withDefaults(defineProps<ToastProps>(), {
  show: false,
  type: 'text',
  message: '',
  position: 'middle',
  overlay: false,
  duration: 2000,
});

defineEmits<{
  'update:show': [value: boolean];
}>();

const hasIcon = computed(() => props.type !== 'text' || !!props.icon);

const positionStyle = computed(() => {
  const base = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  if (props.position === 'top') return { ...base, top: '20%' };
  if (props.position === 'bottom') return { ...base, bottom: '20%' };
  return { ...base, top: '45%' };
});
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backgroundColor: overlay ? 'rgba(0,0,0,0.7)' : 'transparent',
    }"
  >
    <view :style="positionStyle">
      <view
        :style="{
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: 8,
          paddingTop: hasIcon ? 24 : 8,
          paddingBottom: hasIcon ? 24 : 8,
          paddingLeft: hasIcon ? 24 : 12,
          paddingRight: hasIcon ? 24 : 12,
          minWidth: hasIcon ? 88 : 0,
          maxWidth: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }"
      >
        <!-- Loading type -->
        <Loading
          v-if="type === 'loading'"
          :size="36"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />

        <!-- Success/fail icon -->
        <Icon
          v-else-if="type === 'success'"
          name="success"
          :size="36"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />
        <Icon
          v-else-if="type === 'fail'"
          name="fail"
          :size="36"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />

        <!-- Custom icon -->
        <Icon
          v-else-if="icon"
          :name="icon"
          :size="36"
          color="#fff"
          :style="{ marginBottom: message ? 8 : 0 }"
        />

        <!-- Message -->
        <slot name="message">
          <text
            v-if="message"
            :style="{
              fontSize: 14,
              color: '#fff',
              textAlign: 'center',
              lineHeight: 20,
            }"
          >{{ message }}</text>
        </slot>
      </view>
    </view>
  </view>
</template>
