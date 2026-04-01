<script setup lang="ts">
// Working alternative to <style scoped> using <style module>
//
// <style scoped> fails in Lynx because:
//   1. vue-lynx's renderer does not implement setScopeId() in nodeOps,
//      so data-v-{hash} attributes are never added to elements.
//   2. Even if they were, Lynx's CSS engine does not support attribute
//      selectors like [data-v-xxx], so the rules would still not match.
//
// <style module> achieves the same scoping goal differently:
//   1. css-loader renames each class to a unique hash (e.g. .demoText → .demoText_abc123)
//   2. The mapping is exported as $style — a plain JS object
//   3. You apply classes with :class="$style.demoText" instead of class="demoText"
//   4. The CSS rules use the hashed names — plain class selectors, fully supported by Lynx
</script>

<template>
  <view :class="$style.card">
    <text :class="$style.title">&lt;style module&gt; — scoped alternative</text>
    <text :class="$style.desc">
      Uses hashed class names instead of [data-v-xxx] attribute selectors.
      Plain class selectors are fully supported in Lynx.
    </text>
    <view :class="$style.demoBox">
      <text :class="$style.demoText">This text is blue — CSS Modules scoping works</text>
    </view>
  </view>
</template>

<style module>
.card {
  display: flex;
  flex-direction: column;
  background-color: #e3f2fd;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}
.title {
  font-size: 15px;
  font-weight: bold;
  color: #1565c0;
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
  color: blue;
}
</style>
