<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as <view> (Lynx has no HTML elements)
  - themeVarsScope 'global': cannot set styles on document.documentElement in Lynx; falls back to local scope
  - theme class on document.documentElement: not supported in Lynx (no DOM document)
  - iconPrefix: provided via inject but no @font-face icon system in Lynx
  - CSS custom properties via inline styles: Lynx strips --van-* from inline styles;
    themeVars conversion is maintained for API parity but vars are only effective
    when defined in .less files
-->
<script setup lang="ts">
import { computed, provide, watchEffect } from 'vue-lynx';
import { CONFIG_PROVIDER_KEY } from './types';
import type { ConfigProviderTheme, ConfigProviderThemeVarsScope } from './types';
import { mapThemeVarsToCSSVars } from './utils';
import { setGlobalZIndex } from '../../composables/useGlobalZIndex';

interface ConfigProviderProps {
  tag?: string;
  theme?: ConfigProviderTheme;
  zIndex?: number;
  themeVars?: Record<string, string | number>;
  themeVarsDark?: Record<string, string | number>;
  themeVarsLight?: Record<string, string | number>;
  themeVarsScope?: ConfigProviderThemeVarsScope;
  iconPrefix?: string;
}

const props = withDefaults(defineProps<ConfigProviderProps>(), {
  tag: 'div',
  theme: 'light',
  themeVarsScope: 'local',
});

const style = computed(() =>
  mapThemeVarsToCSSVars(
    Object.assign(
      {},
      props.themeVars,
      props.theme === 'dark' ? props.themeVarsDark : props.themeVarsLight,
    ),
  ),
);

provide(CONFIG_PROVIDER_KEY, props);

watchEffect(() => {
  if (props.zIndex !== undefined) {
    setGlobalZIndex(props.zIndex);
  }
});

const containerStyle = computed(() => {
  if (props.themeVarsScope === 'global') {
    return {
      flex: 1,
      display: 'flex' as const,
      flexDirection: 'column' as const,
    };
  }
  return {
    flex: 1,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    ...style.value,
  };
});
</script>

<template>
  <view :style="containerStyle">
    <slot />
  </view>
</template>
