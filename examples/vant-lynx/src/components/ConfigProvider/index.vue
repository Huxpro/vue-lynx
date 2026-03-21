<!--
  Vant Feature Parity Report:
  - Props: 7/7 supported (theme, themeVars, themeVarsDark, themeVarsLight, themeVarsScope, zIndex, tag, iconPrefix)
  - Events: 0/0 (none defined)
  - Slots: 1/1 (default)
  - Lynx Limitations:
    - tag: accepted for API compat but always renders as view
    - themeVarsScope 'global': cannot use :root selector in Lynx, applied to wrapper element
    - iconPrefix: provided via inject for child components
-->
<script setup lang="ts">
import { computed, provide } from 'vue-lynx';

export interface ConfigProviderProps {
  theme?: 'light' | 'dark';
  themeVars?: Record<string, string | number>;
  themeVarsDark?: Record<string, string | number>;
  themeVarsLight?: Record<string, string | number>;
  themeVarsScope?: 'local' | 'global';
  zIndex?: number;
  tag?: string;
  iconPrefix?: string;
}

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  theme: 'light',
  themeVars: () => ({}),
  themeVarsDark: () => ({}),
  themeVarsLight: () => ({}),
  themeVarsScope: 'local',
  zIndex: 2000,
  tag: 'div',
  iconPrefix: 'van-icon',
});

const config = computed(() => ({
  themeVars: props.themeVars,
  theme: props.theme,
  zIndex: props.zIndex,
  iconPrefix: props.iconPrefix,
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

  // Apply theme-specific vars
  if (props.theme === 'dark') {
    Object.assign(vars, darkOverrides);
    Object.assign(vars, props.themeVarsDark);
  } else {
    Object.assign(vars, props.themeVarsLight);
  }

  // Apply general themeVars (highest priority)
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
