<script setup lang="ts">
import { computed, provide } from 'vue-lynx';

export interface ConfigProviderProps {
  themeVars?: Record<string, string | number>;
  theme?: 'light' | 'dark';
  zIndex?: number;
}

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  themeVars: () => ({}),
  theme: 'light',
  zIndex: 2000,
});

const config = computed(() => ({
  themeVars: props.themeVars,
  theme: props.theme,
  zIndex: props.zIndex,
}));

provide('configProvider', config);

const darkOverrides: Record<string, string | number> = {
  '--van-background': '#1a1a1a',
  '--van-background-2': '#2c2c2c',
  '--van-text-color': '#f5f5f5',
  '--van-text-color-2': '#b0b0b0',
  '--van-border-color': '#3a3a3a',
};

const containerStyle = computed(() => {
  const vars: Record<string, string | number> = {};

  if (props.theme === 'dark') {
    Object.assign(vars, darkOverrides);
  }

  Object.assign(vars, props.themeVars);

  return {
    flex: 1,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    ...vars,
  };
});
</script>

<template>
  <view :style="containerStyle">
    <slot />
  </view>
</template>
