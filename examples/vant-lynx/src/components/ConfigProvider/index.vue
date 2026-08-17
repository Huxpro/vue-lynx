<!--
  Lynx Limitations:
  - tag: accepted for API compat but always renders as <view> (Lynx has no HTML elements)
  - themeVarsScope 'global': cannot set styles on document.documentElement in Lynx; falls back to local scope
  - theme class on document.documentElement: not supported in Lynx (no DOM document)
-->
<script setup lang="ts">
import { computed, provide, watchEffect } from 'vue-lynx';
import { createNamespace } from '../../utils/create';
import { CONFIG_PROVIDER_KEY, type ConfigProviderProps } from './types';
import { mapThemeVarsToCSSVars } from './utils';
import { setGlobalZIndex } from '../../composables/useGlobalZIndex';
import './index.less';

const [name, bem] = createNamespace('config-provider');

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
  if (props.themeVarsScope === 'local') {
    return style.value;
  }
  return undefined;
});
</script>

<template>
  <view :class="bem()" :style="containerStyle">
    <slot />
  </view>
</template>
