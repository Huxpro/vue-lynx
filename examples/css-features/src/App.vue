<script setup lang="ts">
import PlainStyle from './PlainStyle.vue'
import ScopedStyle from './ScopedStyle.vue'
import ScopedStyleWorking from './ScopedStyleWorking.vue'
import CSSModules from './CSSModules.vue'
import VBindCSS from './VBindCSS.vue'
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

    <!-- 1. Plain <style> — WORKS -->
    <PlainStyle />

    <!-- 2a. <style scoped> — DOES NOT WORK -->
    <ScopedStyle />

    <!-- 2b. <style module> as scoped alternative — WORKS -->
    <ScopedStyleWorking />

    <!-- 3. <style module> — SHOULD WORK -->
    <CSSModules />

    <!-- 4. v-bind() in CSS — WORKS (useCssVars implemented in vue-lynx) -->
    <VBindCSS />

    <!-- 5. Workaround: Reactive inline :style -->
    <CSSVarsWorkaround />

    <!-- 6. Imported .css file — WORKS -->
    <ImportedCSS />
  </scroll-view>
</template>
