<script setup lang="ts">
import VBindCSS from './VBindCSS.vue'
import VBindThreads from './VBindThreads.vue'
import CSSInheritanceTest from './CSSInheritanceTest.vue'
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

    <!-- enableCSSInheritance isolation test — no useCssVars, pure :style + var() inheritance -->
    <CSSInheritanceTest />

    <!-- Divider -->
    <text :style="{ fontSize: '13px', fontWeight: 'bold', color: '#888', marginBottom: '12px', marginTop: '4px' }">
      Other CSS patterns
    </text>

    <!-- Workarounds and supporting patterns — 2 per row -->
    <CSSVarsWorkaround />
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: '12px' }">
      <view :style="{ flex: 1, paddingRight: '6px' }"><ScopedStyle /></view>
      <view :style="{ flex: 1, paddingLeft: '6px' }"><CSSModules /></view>
    </view>
    <view :style="{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: '12px' }">
      <view :style="{ flex: 1, paddingRight: '6px' }"><PlainStyle /></view>
      <view :style="{ flex: 1, paddingLeft: '6px' }"><ImportedCSS /></view>
    </view>
  </scroll-view>
</template>
