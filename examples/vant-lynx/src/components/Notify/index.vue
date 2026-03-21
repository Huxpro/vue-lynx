<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface NotifyProps {
  show?: boolean;
  type?: 'primary' | 'success' | 'warning' | 'danger';
  message?: string;
  duration?: number;
  color?: string;
  background?: string;
}

const props = withDefaults(defineProps<NotifyProps>(), {
  show: false,
  type: 'danger',
  message: '',
  duration: 3000,
});

defineEmits<{
  'update:show': [value: boolean];
}>();

const typeColorMap: Record<string, { color: string; background: string }> = {
  primary: { color: '#fff', background: '#1989fa' },
  success: { color: '#fff', background: '#07c160' },
  warning: { color: '#fff', background: '#ff976a' },
  danger: { color: '#fff', background: '#ee0a24' },
};

const resolvedColor = computed(
  () => props.color ?? typeColorMap[props.type ?? 'danger'].color,
);

const resolvedBackground = computed(
  () => props.background ?? typeColorMap[props.type ?? 'danger'].background,
);

const barStyle = computed(() => ({
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  backgroundColor: resolvedBackground.value,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 16,
  paddingRight: 16,
  display: 'flex',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
}));

const textStyle = computed(() => ({
  fontSize: 14,
  color: resolvedColor.value,
  textAlign: 'center' as const,
  lineHeight: 20,
}));
</script>

<template>
  <view v-if="show" :style="barStyle">
    <text :style="textStyle">{{ message }}</text>
  </view>
</template>
