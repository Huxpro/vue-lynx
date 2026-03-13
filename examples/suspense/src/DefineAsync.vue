<!--
  DefineAsync.vue — Suspense + defineAsyncComponent demo
  Exercises: defineAsyncComponent with delay, dynamic import() code-splitting
-->
<script setup lang="ts">
import { ref, defineAsyncComponent, Suspense } from 'vue-lynx'

// Static imports — avoids dynamic import() which creates async chunks that
// the Lynx web runtime cannot load (requireModuleAsync doesn't support them).
import SlowContentVue from './SlowContent.vue'
import LazyCounterVue from './LazyCounter.vue'

// Simulated slow async component — 1.5s artificial delay
const SlowComponent = defineAsyncComponent(
  () =>
    new Promise<{ default: typeof SlowContentVue }>((resolve) => {
      setTimeout(() => resolve({ default: SlowContentVue }), 1500)
    }),
)

// Simulated lazy-loaded component — exercises Suspense fallback rendering
const LazyCounter = defineAsyncComponent(
  () =>
    new Promise<{ default: typeof LazyCounterVue }>((resolve) => {
      setTimeout(() => resolve({ default: LazyCounterVue }), 500)
    }),
)

const showAsync = ref(true)

function toggleAsync() {
  showAsync.value = !showAsync.value
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }">
    <text :style="{ fontSize: 18, fontWeight: 'bold', margin: 16, color: '#111' }">
      Suspense — defineAsyncComponent
    </text>

    <!-- Toggle button -->
    <view
      :style="{ margin: '0 16px 12px', padding: '8px 16px', backgroundColor: '#0077ff', borderRadius: 8 }"
      @tap="toggleAsync"
    >
      <text :style="{ color: '#fff', fontSize: 14 }">
        {{ showAsync ? 'Unmount' : 'Remount' }}
      </text>
    </view>

    <!-- 1. defineAsyncComponent with simulated delay -->
    <view v-if="showAsync" :style="{ margin: '0 16px 12px' }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 }">
        1. Slow async component (1.5s delay)
      </text>
      <Suspense>
        <template #default>
          <SlowComponent />
        </template>
        <template #fallback>
          <view :style="{ padding: 12, backgroundColor: '#fff3cd', borderRadius: 6 }">
            <text :style="{ color: '#856404', fontSize: 13 }">Loading slow component...</text>
          </view>
        </template>
      </Suspense>
    </view>

    <!-- 2. Lazy-loaded via dynamic import (code-split chunk) -->
    <view v-if="showAsync" :style="{ margin: '0 16px 12px' }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 }">
        2. Lazy-loaded counter (dynamic import)
      </text>
      <Suspense>
        <template #default>
          <LazyCounter />
        </template>
        <template #fallback>
          <view :style="{ padding: 12, backgroundColor: '#fff3cd', borderRadius: 6 }">
            <text :style="{ color: '#856404', fontSize: 13 }">Loading chunk...</text>
          </view>
        </template>
      </Suspense>
    </view>
  </view>
</template>
