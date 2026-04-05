<script setup lang="ts">
// Test: Imported external CSS file
//
// EXPECTED: Works. This is the same pattern used in todomvc and gallery examples.
// The CSS file is processed by the extraction pipeline and class selectors work.
import './imported.css'
</script>

<template>
  <view class="imported-card">
    <text class="imported-title">Imported .css file (ImportedCSS.vue)</text>
    <text class="imported-desc">
      External CSS files with class selectors work via the
      @lynx-js/css-extract-webpack-plugin pipeline.
    </text>
    <view class="imported-demo-box">
      <text class="imported-demo-text">This text should be teal if import works</text>
    </view>
  </view>
</template>
