<script setup lang="ts">
import { ref } from 'vue'

const countA = ref(0) // plain @tap — fires even when child is tapped
const countB = ref(0) // @tap.self  — only fires when outer itself is tapped
</script>

<template>
  <view :style="{ margin: '12px 12px 16px', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' }">
    <!-- Section header -->
    <view :style="{ padding: '10px 14px', backgroundColor: '#ede0ff' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#660099' }">
        @tap  vs  @tap.self
      </text>
      <text :style="{ fontSize: '11px', color: '#554', marginTop: '2px' }">
        Left: tapping child also fires outer — Right: .self only fires when you tap outer directly
      </text>
    </view>

    <!-- Side-by-side panels -->
    <view :style="{ display: 'flex', flexDirection: 'row' }">
      <!-- Without .self -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '8px' }">@tap</text>
        <text :style="{ fontSize: '32px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }">
          {{ countA }}
        </text>
        <!-- Outer tappable area — tapping child also bubbles to this -->
        <view
          @tap="countA++"
          :style="{ padding: '16px', backgroundColor: '#f5eaff', borderRadius: '8px', borderWidth: '2px', borderColor: '#660099', borderStyle: 'solid', alignItems: 'center' }"
        >
          <view
            :style="{ padding: '10px 16px', backgroundColor: '#660099', borderRadius: '8px', alignItems: 'center' }"
          >
            <text :style="{ color: '#fff', fontSize: '13px' }">Child</text>
          </view>
        </view>
        <text :style="{ fontSize: '10px', color: '#aaa', marginTop: '6px' }">tap border or child</text>
      </view>

      <!-- Divider -->
      <view :style="{ width: '1px', backgroundColor: '#eee' }" />

      <!-- With .self -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '8px' }">@tap.self</text>
        <text :style="{ fontSize: '32px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }">
          {{ countB }}
        </text>
        <!-- .self — only fires when the outer view itself is the tap target -->
        <view
          @tap.self="countB++"
          :style="{ padding: '16px', backgroundColor: '#f5eaff', borderRadius: '8px', borderWidth: '2px', borderColor: '#660099', borderStyle: 'solid', alignItems: 'center' }"
        >
          <view
            :style="{ padding: '10px 16px', backgroundColor: '#660099', borderRadius: '8px', alignItems: 'center' }"
          >
            <text :style="{ color: '#fff', fontSize: '13px' }">Child</text>
          </view>
        </view>
        <text :style="{ fontSize: '10px', color: '#aaa', marginTop: '6px' }">tap border (.self), not child</text>
      </view>
    </view>
  </view>
</template>
