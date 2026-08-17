<script setup lang="ts">
import { ref } from 'vue'

const innerA = ref(0)  // @tap.once — fires once, then bubbles to outer
const outerA = ref(0)  // outer handler — increments when inner tap propagates

const innerB = ref(0)  // @tap.once.stop — fires once AND blocks propagation
const outerB = ref(0)  // outer handler — should stay at 0
</script>

<template>
  <view :style="{ margin: '12px 12px 16px', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' }">
    <!-- Section header -->
    <view :style="{ padding: '10px 14px', backgroundColor: '#fde0d8' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#cc1100' }">
        @tap.once  vs  @tap.once.stop
      </text>
      <text :style="{ fontSize: '11px', color: '#664', marginTop: '2px' }">
        Chaining — both fire once, but .once.stop also blocks the tap reaching the outer view
      </text>
    </view>

    <!-- Side-by-side panels -->
    <view :style="{ display: 'flex', flexDirection: 'row' }">

      <!-- Left: .once only -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '4px' }">@tap.once</text>

        <!-- Outer tap area -->
        <view
          @tap="outerA++"
          :style="{ width: '100%', padding: '10px', backgroundColor: '#fff0ee', borderRadius: '8px', borderWidth: '2px', borderColor: '#cc1100', borderStyle: 'solid', alignItems: 'center' }"
        >
          <text :style="{ fontSize: '10px', color: '#cc1100', marginBottom: '6px' }">outer taps: {{ outerA }}</text>
          <view
            @tap.once="innerA++"
            :style="{ padding: '8px 14px', backgroundColor: '#cc1100', borderRadius: '6px', alignItems: 'center' }"
          >
            <text :style="{ color: '#fff', fontSize: '12px' }">inner ({{ innerA }})</text>
          </view>
        </view>

        <text :style="{ fontSize: '10px', color: '#aaa', marginTop: '4px' }">inner fires once, tap still bubbles</text>

        <view
          @tap="() => { innerA = 0; outerA = 0 }"
          :style="{ marginTop: '6px', padding: '4px 8px', backgroundColor: '#eee', borderRadius: '4px' }"
        >
          <text :style="{ fontSize: '10px', color: '#666' }">Reset</text>
        </view>
      </view>

      <!-- Divider -->
      <view :style="{ width: '1px', backgroundColor: '#eee' }" />

      <!-- Right: .once.stop -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', alignItems: 'center' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '4px' }">@tap.once.stop</text>

        <!-- Outer tap area -->
        <view
          @tap="outerB++"
          :style="{ width: '100%', padding: '10px', backgroundColor: '#fff0ee', borderRadius: '8px', borderWidth: '2px', borderColor: '#cc1100', borderStyle: 'solid', alignItems: 'center' }"
        >
          <text :style="{ fontSize: '10px', color: '#cc1100', marginBottom: '6px' }">outer taps: {{ outerB }}</text>
          <view
            @tap.once.stop="innerB++"
            :style="{ padding: '8px 14px', backgroundColor: '#cc1100', borderRadius: '6px', alignItems: 'center' }"
          >
            <text :style="{ color: '#fff', fontSize: '12px' }">inner ({{ innerB }})</text>
          </view>
        </view>

        <text :style="{ fontSize: '10px', color: '#aaa', marginTop: '4px' }">inner fires once, outer stays at 0</text>

        <view
          @tap="() => { innerB = 0; outerB = 0 }"
          :style="{ marginTop: '6px', padding: '4px 8px', backgroundColor: '#eee', borderRadius: '4px' }"
        >
          <text :style="{ fontSize: '10px', color: '#666' }">Reset</text>
        </view>
      </view>

    </view>
  </view>
</template>
