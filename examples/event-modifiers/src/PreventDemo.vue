<script setup lang="ts">
import { ref } from 'vue'

const logA = ref<string[]>([])
const logB = ref<string[]>([])
</script>

<template>
  <view :style="{ margin: '12px 12px 0', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden' }">
    <!-- Section header -->
    <view :style="{ padding: '10px 14px', backgroundColor: '#d8f5e8' }">
      <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#007744' }">
        @tap  vs  @tap.prevent
      </text>
      <text :style="{ fontSize: '11px', color: '#446', marginTop: '2px' }">
        Left: handler fires — Right: .prevent calls preventDefault() first, then handler fires
      </text>
    </view>

    <!-- Side-by-side panels -->
    <view :style="{ display: 'flex', flexDirection: 'row' }">
      <!-- Without .prevent -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '6px', textAlign: 'center' }">@tap</text>
        <view
          @tap="logA = [...logA, 'handler fired']"
          :style="{ padding: '10px', backgroundColor: '#007744', borderRadius: '6px', alignItems: 'center', alignSelf: 'center' }"
        >
          <text :style="{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }">Tap</text>
        </view>

        <view :style="{ marginTop: '8px', minHeight: '66px' }">
          <view v-for="(entry, i) in logA" :key="i">
            <text :style="{ fontSize: '11px', color: '#333' }">→ {{ entry }}</text>
          </view>
          <text v-if="!logA.length" :style="{ fontSize: '11px', color: '#bbb' }">—</text>
        </view>
        <view @tap="logA = []" :style="{ padding: '4px 8px', backgroundColor: '#eee', borderRadius: '4px', alignSelf: 'center' }">
          <text :style="{ fontSize: '10px', color: '#666' }">Clear</text>
        </view>
      </view>

      <!-- Divider -->
      <view :style="{ width: '1px', backgroundColor: '#eee' }" />

      <!-- With .prevent -->
      <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px' }">
        <text :style="{ fontSize: '11px', color: '#888', marginBottom: '6px', textAlign: 'center' }">@tap.prevent</text>
        <view
          @tap.prevent="logB = [...logB, 'preventDefault()', 'handler fired']"
          :style="{ padding: '10px', backgroundColor: '#007744', borderRadius: '6px', alignItems: 'center', alignSelf: 'center' }"
        >
          <text :style="{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }">Tap (.prevent)</text>
        </view>

        <view :style="{ marginTop: '8px', minHeight: '66px' }">
          <view v-for="(entry, i) in logB" :key="i">
            <text :style="{
              fontSize: '11px',
              color: entry === 'preventDefault()' ? '#007744' : '#333',
              fontWeight: entry === 'preventDefault()' ? 'bold' : 'normal',
            }">→ {{ entry }}</text>
          </view>
          <text v-if="!logB.length" :style="{ fontSize: '11px', color: '#bbb' }">—</text>
        </view>
        <view @tap="logB = []" :style="{ padding: '4px 8px', backgroundColor: '#eee', borderRadius: '4px', alignSelf: 'center' }">
          <text :style="{ fontSize: '10px', color: '#666' }">Clear</text>
        </view>
      </view>
    </view>
  </view>
</template>
