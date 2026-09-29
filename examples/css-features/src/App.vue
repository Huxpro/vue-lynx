<script setup lang="ts">
import PlainStyle from './PlainStyle.vue'
import ScopedStyle from './ScopedStyle.vue'
import CSSModules from './CSSModules.vue'
import VBindCSS from './VBindCSS.vue'
import VBindThreads from './VBindThreads.vue'
import CSSVarsWorkaround from './CSSVarsWorkaround.vue'
import ImportedCSS from './ImportedCSS.vue'
import DeepSelector from './DeepSelector.vue'
import SlottedSelector from './SlottedSelector.vue'
import GlobalSelector from './GlobalSelector.vue'
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

    <!-- 2a. <style scoped> — WORKS (via Lynx cssId) -->
    <ScopedStyle />

    <!-- 3. <style module> — SHOULD WORK -->
    <CSSModules />

    <!-- 4. v-bind() in CSS — WORKS (useCssVars implemented in vue-lynx) -->
    <VBindCSS />

    <!-- 4b. v-bind() thread comparison — BG (useCssVars) vs MT (setStyleProperty) -->
    <VBindThreads />

    <!-- 5. Workaround: Reactive inline :style -->
    <CSSVarsWorkaround />

    <!-- 6. Imported .css file — WORKS -->
    <ImportedCSS />

    <!-- 7. :deep() in <style scoped> — #165 / PR #379 -->
    <DeepSelector />

    <!-- 8. :slotted() in <style scoped> — #165 / PR #379 -->
    <SlottedSelector />

    <!-- 9. :global() in <style scoped> — #164 / PR #381 -->
    <GlobalSelector />
    <!-- Probe styled ONLY by GlobalSelector's :global() rule. It lives here,
         outside that component, so color proves the rule escaped its scope. -->
    <text class="global-probe">:global() — should be TEAL if :global() works</text>
  </scroll-view>
</template>
