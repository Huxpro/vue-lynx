<script setup lang="ts">
// Test: v-bind() in <style>
//
// RESULT: BUILD ERROR — confirmed.
//
// Vue's v-bind() in CSS compiles to a `useCssVars()` call, which is a
// @vue/runtime-dom API (not runtime-core). vue-lynx only re-exports from
// @vue/runtime-core, so this API is unavailable.
//
// Error message:
//   ESModulesLinkingError: export 'useCssVars' (imported as '_useCssVars')
//   was not found in 'vue'
//
// Even if useCssVars were exported, it would not work because:
//   1. useCssVars internally calls `document.getElementById()` — no document in Lynx
//   2. It sets CSS vars via `el.style.setProperty()` — DOM API, not available
//   3. The Background Thread cannot directly access native element styles
//
// WORKAROUND: Use computed() + reactive :style bindings instead.
// See CSSVarsWorkaround.vue for the recommended pattern.
</script>

<template>
  <view :style="{
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffebee',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  }">
    <text :style="{ fontSize: '15px', fontWeight: 'bold', color: '#c62828', marginBottom: '4px' }">
      v-bind() in &lt;style&gt; — BUILD ERROR
    </text>
    <text :style="{ fontSize: '12px', color: '#555', marginBottom: '8px' }">
      Vue's v-bind() in CSS compiles to useCssVars() which is a
      @vue/runtime-dom API. vue-lynx only uses @vue/runtime-core,
      so this causes an ESModulesLinkingError at build time.
    </text>
    <text :style="{ fontSize: '11px', color: '#888', fontStyle: 'italic' }">
      Workaround: use computed() + :style bindings (see below)
    </text>
  </view>
</template>
