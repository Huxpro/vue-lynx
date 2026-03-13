<!--
  App.vue — Suspense + async setup() demo
  Exercises: <Suspense> #default/#fallback, top-level await in <script setup>
-->
<script setup lang="ts">
import { ref, Suspense } from 'vue-lynx'
import AsyncSetup from './AsyncSetup.vue'

const showAsync = ref(true)

function toggleAsync() {
  showAsync.value = !showAsync.value
}
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }">
    <text :style="{ fontSize: 18, fontWeight: 'bold', margin: 16, color: '#111' }">
      Suspense — Async setup()
    </text>

    <!-- Toggle button to unmount/remount and re-trigger the async boundary -->
    <view
      :style="{ margin: '0 16px 12px', padding: '8px 16px', backgroundColor: '#0077ff', borderRadius: 8 }"
      @tap="toggleAsync"
    >
      <text :style="{ color: '#fff', fontSize: 14 }">
        {{ showAsync ? 'Unmount' : 'Remount' }}
      </text>
    </view>

    <view v-if="showAsync" :style="{ margin: '0 16px' }">
      <Suspense>
        <template #default>
          <AsyncSetup />
        </template>
        <template #fallback>
          <view :style="{ padding: 12, backgroundColor: '#fff3cd', borderRadius: 6 }">
            <text :style="{ color: '#856404', fontSize: 13 }">Awaiting async setup...</text>
          </view>
        </template>
      </Suspense>
    </view>
  </view>
</template>
