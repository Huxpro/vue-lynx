<script setup lang="ts">
import { provide, ref } from 'vue-lynx';
import ThemeProvider from './ThemeProvider.vue';

// ── App-level provide ──────────────────────────────
// A reactive theme that any descendant can inject.
const theme = ref<'light' | 'dark'>('light');
provide('theme', theme);

// A plain string injection — simulates an app-wide config value.
provide('appName', 'Vue Lynx DI Demo');

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}
</script>

<template>
  <view
    :style="{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: 16,
      backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
    }"
  >
    <text
      :style="{
        fontSize: 18,
        fontWeight: 'bold',
        color: theme === 'dark' ? '#eee' : '#111',
        marginBottom: 12,
      }"
    >
      provide / inject
    </text>

    <view
      :style="{
        padding: '8px 16px',
        backgroundColor: '#0077ff',
        borderRadius: 8,
        marginBottom: 16,
      }"
      @tap="toggleTheme"
    >
      <text :style="{ color: '#fff', fontSize: 14 }">
        Toggle theme (current: {{ theme }})
      </text>
    </view>

    <!-- ThemeProvider is a middle component that does NOT receive
         theme as a prop — its children inject it directly. -->
    <ThemeProvider />
  </view>
</template>
