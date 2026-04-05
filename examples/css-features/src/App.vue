<script setup lang="ts">
import VBindCSS from './VBindCSS.vue'
import VBindThreads from './VBindThreads.vue'
import PlainStyle from './PlainStyle.vue'
import ScopedStyle from './ScopedStyle.vue'
import CSSModules from './CSSModules.vue'
import CSSVarsWorkaround from './CSSVarsWorkaround.vue'
import ImportedCSS from './ImportedCSS.vue'
</script>

<template>
  <scroll-view
    scroll-orientation="vertical"
    :style="{ width: '100%', height: '100%', backgroundColor: '#f5f5f5', padding: '16px' }"
  >
    <text :style="{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#111' }">
      CSS Features Test
    </text>

    <!-- v-bind() in CSS — primary focus -->
    <VBindCSS />
    <VBindThreads />

    <!-- Divider -->
    <text :style="{ fontSize: '13px', fontWeight: 'bold', color: '#888', marginBottom: '12px', marginTop: '4px' }">
      Other CSS patterns
    </text>

    <!-- Workarounds and supporting patterns -->
    <CSSVarsWorkaround />
    <PlainStyle />
    <ScopedStyle />
    <CSSModules />
    <ImportedCSS />
  </scroll-view>
</template>
