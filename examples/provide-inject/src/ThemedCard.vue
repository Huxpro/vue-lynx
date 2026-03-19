<script setup lang="ts">
import { inject, computed, type Ref } from 'vue-lynx';

defineProps<{ label: string }>();

// ── inject reactive theme from ancestor ────────────
const theme = inject<Ref<'light' | 'dark'>>('theme')!;

// ── inject static value with a default ─────────────
const appName = inject<string>('appName', 'Unknown App');

const bg = computed(() => (theme.value === 'dark' ? '#16213e' : '#ffffff'));
const fg = computed(() => (theme.value === 'dark' ? '#e0e0e0' : '#333333'));
const border = computed(() => (theme.value === 'dark' ? '#0f3460' : '#ddd'));
</script>

<template>
  <view
    :style="{
      display: 'flex',
      flexDirection: 'column',
      padding: 12,
      backgroundColor: bg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: border,
    }"
  >
    <text :style="{ fontSize: 15, fontWeight: 'bold', color: fg }">
      {{ label }}
    </text>
    <text :style="{ fontSize: 12, color: fg, marginTop: 4, opacity: 0.7 }">
      Theme: {{ theme }} · App: {{ appName }}
    </text>
    <text :style="{ fontSize: 11, color: fg, marginTop: 2, opacity: 0.5 }">
      (injected from grandparent — no props passed through middle layer)
    </text>
  </view>
</template>
