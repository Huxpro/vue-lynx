<script setup lang="ts">
// Test: <style module>
//
// CSS Modules work by:
//   1. css-loader transforms class names to unique hashed names (e.g. .card → .card_abc123)
//   2. The module exports a mapping object { card: 'card_abc123' }
//   3. Vue injects this mapping as `$style` (or a custom name via <style module="name">)
//   4. You use :class="$style.card" to apply the hashed class name
//
// EXPECTED: Should work! The hashed class names are still plain class selectors,
// which Lynx supports. The css-loader pipeline handles the transformation,
// and vue-lynx's CSS extraction pipeline preserves CSS module support.
//
// The plugin's css.ts configures `exportOnlyLocals: true` for the Main Thread
// layer, ensuring class name mappings are available as JS objects.
</script>

<template>
  <view :class="$style.card">
    <text :class="$style.title">&lt;style module&gt; (CSSModules.vue)</text>
    <text :class="$style.desc">
      Uses hashed class names (e.g. .card_abc123).
      These are plain class selectors — Lynx supports them.
    </text>
    <view :class="$style.demoBox">
      <text :class="$style.demoText">This text should be purple if modules work</text>
    </view>
  </view>
</template>

<style module>
.card {
  display: flex;
  flex-direction: column;
  background-color: #f3e5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.title {
  font-size: 15px;
  font-weight: bold;
  color: #6a1b9a;
  margin-bottom: 4px;
}
.desc {
  font-size: 12px;
  color: #555;
  margin-bottom: 8px;
}
.demoBox {
  background-color: #fff;
  padding: 8px;
  border-radius: 4px;
}
.demoText {
  font-size: 13px;
  color: purple;
}
</style>
