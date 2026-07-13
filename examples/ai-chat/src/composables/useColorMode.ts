import { ref } from 'vue-lynx';

export type ColorMode = 'light' | 'dark';

const colorMode = ref<ColorMode>('light');

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
