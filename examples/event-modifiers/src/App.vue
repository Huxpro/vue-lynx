<script setup lang="ts">
import OnceDemo from './OnceDemo.vue'
import StopDemo from './StopDemo.vue'
import PreventDemo from './PreventDemo.vue'
import SelfDemo from './SelfDemo.vue'
import ChainDemo from './ChainDemo.vue'
</script>

<template>
  <scroll-view
    scroll-orientation="vertical"
    :style="{ width: '100%', height: '100%', backgroundColor: '#f0f2f5' }"
  >
    <view :style="{ padding: '16px 16px 8px', backgroundColor: '#1a1a2e' }">
      <text :style="{ fontSize: '20px', fontWeight: 'bold', color: '#e0e0ff' }">
        Event Modifiers
      </text>
      <text :style="{ fontSize: '12px', color: '#9999cc', marginTop: '4px' }">
        Without modifier (left) vs with modifier (right)
      </text>
    </view>

    <OnceDemo />
    <StopDemo />
    <PreventDemo />
    <SelfDemo />
    <ChainDemo />
  </scroll-view>
</template>
