<script setup lang="ts">
import { computed } from 'vue-lynx';

export interface ActionBarButtonProps {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  text?: string;
  icon?: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<ActionBarButtonProps>(), {
  type: 'default',
  text: '',
  icon: '',
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  click: [event: any];
}>();

const typeColors: Record<string, { bg: string; text: string }> = {
  default: { bg: '#fff', text: '#323233' },
  primary: { bg: '#1989fa', text: '#fff' },
  success: { bg: '#07c160', text: '#fff' },
  warning: { bg: '#ff976a', text: '#fff' },
  danger: { bg: '#ee0a24', text: '#fff' },
};

function onTap(event: any) {
  if (props.disabled || props.loading) return;
  emit('click', event);
}

const buttonStyle = computed(() => {
  const colors = typeColors[props.type] || typeColors.default;
  const bgColor = props.color || colors.bg;

  return {
    flex: 1,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 40,
    backgroundColor: bgColor,
    borderRadius: 0,
    opacity: props.disabled ? 0.5 : 1,
    paddingLeft: 8,
    paddingRight: 8,
  };
});

const textStyle = computed(() => {
  const colors = typeColors[props.type] || typeColors.default;
  return {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: props.color ? '#fff' : colors.text,
  };
});

const iconStyle = computed(() => ({
  fontSize: 16,
  color: textStyle.value.color,
  marginRight: props.text ? 4 : 0,
}));
</script>

<template>
  <view :style="buttonStyle" @tap="onTap">
    <text v-if="loading" :style="{ fontSize: 14, color: textStyle.color }">...</text>
    <template v-else>
      <text v-if="icon" :style="iconStyle">{{ icon }}</text>
      <text :style="textStyle">{{ text }}</text>
    </template>
  </view>
</template>
