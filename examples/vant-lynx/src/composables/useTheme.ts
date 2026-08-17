import { ref, computed } from 'vue-lynx';

type Theme = 'light' | 'dark';

const currentTheme = ref<Theme>('light');

// Try to load persisted theme
try {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('vant-lynx-theme') : null;
  if (saved === 'dark' || saved === 'light') {
    currentTheme.value = saved;
  }
} catch {
  // localStorage not available in native Lynx
}

export function useTheme() {
  const isDark = computed(() => currentTheme.value === 'dark');

  function toggleTheme() {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vant-lynx-theme', currentTheme.value);
      }
    } catch {
      // ignore
    }
  }

  const bgColor = computed(() => isDark.value ? '#1a1a1a' : '#f7f8fa');
  const cardColor = computed(() => isDark.value ? '#2c2c2c' : '#fff');
  const textColor = computed(() => isDark.value ? '#f5f5f5' : '#323233');
  const textColor2 = computed(() => isDark.value ? '#b0b0b0' : '#969799');
  const headerBg = computed(() => isDark.value ? '#232323' : '#fff');

  return {
    theme: currentTheme,
    isDark,
    toggleTheme,
    bgColor,
    cardColor,
    textColor,
    textColor2,
    headerBg,
  };
}
