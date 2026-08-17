<script setup lang="ts">
import { ref, defineAsyncComponent, Suspense } from 'vue-lynx'
import AsyncSetup from './AsyncSetup.vue'
import LazyCounterComp from './LazyCounter.vue'
import SlowContent from './SlowContent.vue'

// Eager component wrapped in defineAsyncComponent — resolves on a microtask
// so Suspense still shows the fallback briefly. Avoids dynamic `import()`,
// which emits webpack async chunks that Lynx Web Preview cannot load
// (`lynx.requireModuleAsync` is unavailable in the iframe runtime).
const LazyCounter = defineAsyncComponent(() => Promise.resolve(LazyCounterComp))

// Simulated slow async component — 1.5s artificial delay, same Suspense
// path as a lazy chunk load without requiring code-splitting support.
const SlowComponent = defineAsyncComponent(
  () =>
    new Promise<typeof SlowContent>((resolve) => {
      setTimeout(() => resolve(SlowContent), 1500)
    }),
)

const showAsync = ref(true)

function toggleAsync() {
  showAsync.value = !showAsync.value
}
</script>

<template>
  <scroll-view scroll-orientation="vertical" :style="{ width: '100%', height: '100%', backgroundColor: '#f5f5f5' }">
    <text :style="{ fontSize: 18, fontWeight: 'bold', margin: 16, color: '#111' }">
      Vue 3 × Lynx — Suspense Demo
    </text>

    <!-- Toggle button -->
    <view
      :style="{ margin: '0 16px 12px', padding: '8px 16px', backgroundColor: '#0077ff', borderRadius: 8 }"
      @tap="toggleAsync"
    >
      <text :style="{ color: '#fff', fontSize: 14 }">
        {{ showAsync ? 'Unmount' : 'Remount' }} async components
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
            <text :style="{ color: '#856404', fontSize: 13 }">⏳ Loading slow component...</text>
          </view>
        </template>
      </Suspense>
    </view>

    <!-- 2. defineAsyncComponent (eager module, microtask resolve) -->
    <view v-if="showAsync" :style="{ margin: '0 16px 12px' }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 }">
        2. Async component (defineAsyncComponent)
      </text>
      <Suspense>
        <template #default>
          <LazyCounter />
        </template>
        <template #fallback>
          <view :style="{ padding: 12, backgroundColor: '#fff3cd', borderRadius: 6 }">
            <text :style="{ color: '#856404', fontSize: 13 }">⏳ Loading async component...</text>
          </view>
        </template>
      </Suspense>
    </view>

    <!-- 3. Async setup() with top-level await -->
    <view v-if="showAsync" :style="{ margin: '0 16px 12px' }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6 }">
        3. Async setup() (top-level await, 1.5s)
      </text>
      <Suspense>
        <template #default>
          <AsyncSetup />
        </template>
        <template #fallback>
          <view :style="{ padding: 12, backgroundColor: '#fff3cd', borderRadius: 6 }">
            <text :style="{ color: '#856404', fontSize: 13 }">⏳ Awaiting async setup...</text>
          </view>
        </template>
      </Suspense>
    </view>
  </scroll-view>
</template>
