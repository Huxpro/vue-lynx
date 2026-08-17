<script setup lang="ts">
import { ref } from 'vue'

const countA = ref(0) // plain @tap — increments every time
const countB = ref(0) // @tap.once   — increments only once
</script>

<template>
  <view :style="{ margin: '12px 12px 0', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' }">
    <!-- Section header -->
    <view :style="{ padding: '10px 14px', backgroundColor: '#dde8ff' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#0055cc' }">
        @tap  vs  @tap.once
      </text>
      <text :style="{ fontSize: '11px', color: '#445', marginTop: '2px' }">
        Left: counter goes up every tap — Right: .once means it fires once then stops
      </text>
    </view>

    <!-- Side-by-side panels -->
    <view :style="{ display: 'flex', flexDirection: 'row' }">
      <!-- Without .once -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '8px' }">@tap</text>
        <text :style="{ fontSize: '32px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }">
          {{ countA }}
        </text>
        <view
          @tap="countA++"
          :style="{ padding: '10px 16px', backgroundColor: '#0055cc', borderRadius: '8px', alignItems: 'center' }"
        >
          <text :style="{ color: '#fff', fontSize: '13px' }">Tap</text>
        </view>
      </view>

      <!-- Divider -->
      <view :style="{ width: '1px', backgroundColor: '#eee' }" />

      <!-- With .once -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '8px' }">@tap.once</text>
        <text :style="{ fontSize: '32px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }">
          {{ countB }}
        </text>
        <view
          @tap.once="countB++"
          :style="{ padding: '10px 16px', backgroundColor: '#0055cc', borderRadius: '8px', alignItems: 'center' }"
        >
          <text :style="{ color: '#fff', fontSize: '13px' }">Tap (.once)</text>
        </view>
      </view>
    </view>
  </view>
</template>
