<script setup lang="ts">
import { ref, defineAsyncComponent, Suspense } from 'vue-lynx'
import AsyncSetup from './AsyncSetup.vue'

// Lazy-loaded component — triggers Suspense fallback during chunk loading
const LazyCounter = defineAsyncComponent(() => import('./LazyCounter.vue'))

// Simulated slow async component — 1.5s artificial delay
const SlowComponent = defineAsyncComponent(
  () =>
    new Promise<typeof import('./SlowContent.vue')>((resolve) => {
      setTimeout(() => resolve(import('./SlowContent.vue')), 1500)
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

    <!-- 2. defineAsyncComponent (dynamic import, instant after chunk load) -->
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
            <text :style="{ color: '#856404', fontSize: 13 }">⏳ Loading chunk...</text>
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
  </view>
</template>
