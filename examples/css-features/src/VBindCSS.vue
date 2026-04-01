<script setup lang="ts">
import { ref } from 'vue'

const textColor = ref('#1565c0')
const bgColor = ref('#e3f2fd')
const fontSize = ref('14px')

function cycleColor() {
  const colors = ['#1565c0', '#c62828', '#2e7d32', '#f57f17']
  const idx = colors.indexOf(textColor.value)
  textColor.value = colors[(idx + 1) % colors.length]
  const bgs = ['#e3f2fd', '#ffebee', '#e8f5e9', '#fffde7']
  bgColor.value = bgs[(idx + 1) % bgs.length]
}

function cycleFontSize() {
  const sizes = ['12px', '14px', '16px', '20px']
  const idx = sizes.indexOf(fontSize.value)
  fontSize.value = sizes[(idx + 1) % sizes.length]
}
</script>

<template>
  <view :style="{
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: bgColor,
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  }">
    <text :style="{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }" class="title">
      v-bind() in &lt;style&gt; — WORKS
    </text>
    <text class="description">
      textColor: {{ textColor }} | fontSize: {{ fontSize }}
    </text>
    <text class="sample-text" :style="{ fontSize }">
      This text uses v-bind() in CSS
    </text>
    <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '8px' }">
      <text
        :style="{
          backgroundColor: '#1565c0',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
        }"
        :bindtap="cycleColor"
      >
        Cycle Color
      </text>
      <text
        :style="{
          backgroundColor: '#2e7d32',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
        }"
        :bindtap="cycleFontSize"
      >
        Cycle Size
      </text>
    </view>
  </view>
</template>

<style>
.title {
  color: v-bind(textColor);
}

.description {
  font-size: 11px;
  color: #555;
  margin-bottom: 8px;
}

.sample-text {
  color: v-bind(textColor);
  /* font-size: v-bind(fontSize) is omitted here.
     font-size IS in Lynx's default CSS inheritance list and var() in CSS
     class rules is supported, but dynamic CSS var updates on inline styles
     do not appear to trigger a layout re-pass for font-size (unlike color,
     which is paint-only). This gap is undocumented in Lynx and no roadmap
     item exists for it. font-size is driven via :style binding instead. */
  font-weight: bold;
}
</style>
