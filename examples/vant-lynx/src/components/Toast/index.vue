<script setup lang="ts">
import { computed } from 'vue-lynx';

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

const iconText = computed(() => {
  if (props.icon) return props.icon;
  if (props.type === 'success') return '\u2713';
  if (props.type === 'fail') return '\u2717';
  if (props.type === 'loading') return '\u25CB';
  return '';
});

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
        <text
          v-if="hasIcon"
          :style="{
            fontSize: 36,
            color: '#fff',
            marginBottom: 8,
            textAlign: 'center',
          }"
        >{{ iconText }}</text>
        <text
          v-if="message"
          :style="{
            fontSize: 14,
            color: '#fff',
            textAlign: 'center',
            lineHeight: 20,
          }"
        >{{ message }}</text>
      </view>
    </view>
  </view>
</template>
