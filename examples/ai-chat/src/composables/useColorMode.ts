import { ref, watch } from 'vue-lynx';

import { getItem, setItem } from '../lib/storage';

export type ColorMode = 'light' | 'dark';

function initialColorMode(): ColorMode {
  return getItem('ai-chat:color-mode') === 'dark' ? 'dark' : 'light';
}

const colorMode = ref<ColorMode>(initialColorMode());

watch(colorMode, (value) => setItem('ai-chat:color-mode', value), { flush: 'sync' });

/**
 * Replaces Nuxt's useColorMode(): a shared ref driving the .theme-* root
 * class (Lynx has no prefers-color-scheme cascade to hook into).
 */
export function useColorMode() {
  function toggle() {
    colorMode.value = colorMode.value === 'light' ? 'dark' : 'light';
  }

  return { colorMode, toggle };
}
