<script setup lang="ts">
import { ref } from 'vue'

const countA = ref(0) // plain @tap        — increments every tap
const countB = ref(0) // @tap.prevent      — increments every tap too (no-op on Lynx)
</script>

<template>
  <view :style="{ margin: '12px 12px 0', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' }">
    <!-- Section header -->
    <view :style="{ padding: '10px 14px', backgroundColor: '#fff8e1' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#b45309' }">
        @tap  vs  @tap.prevent
      </text>
      <text :style="{ fontSize: '11px', color: '#7c5a13', marginTop: '2px' }">
        Lynx has no browser default action to cancel, so .prevent is a no-op — both sides behave identically
      </text>
    </view>

    <!-- Side-by-side panels -->
    <view :style="{ display: 'flex', flexDirection: 'row' }">
      <!-- Without .prevent -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '8px' }">@tap</text>
        <text :style="{ fontSize: '32px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }">
          {{ countA }}
        </text>
        <view
          @tap="countA++"
          :style="{ padding: '10px 16px', backgroundColor: '#b45309', borderRadius: '8px', alignItems: 'center' }"
        >
          <text :style="{ color: '#fff', fontSize: '13px' }">Tap</text>
        </view>
      </view>

      <!-- Divider -->
      <view :style="{ width: '1px', backgroundColor: '#eee' }" />

      <!-- With .prevent -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '8px' }">@tap.prevent</text>
        <text :style="{ fontSize: '32px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }">
          {{ countB }}
        </text>
        <view
          @tap.prevent="countB++"
          :style="{ padding: '10px 16px', backgroundColor: '#b45309', borderRadius: '8px', alignItems: 'center' }"
        >
          <text :style="{ color: '#fff', fontSize: '13px' }">Tap (.prevent)</text>
        </view>
      </view>
    </view>
  </view>
</template>
