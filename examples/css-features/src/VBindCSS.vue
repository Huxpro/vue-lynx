<script setup lang="ts">
import { ref, computed } from 'vue'

const textColor = ref('#1565c0')
const bgColor = ref('#e3f2fd')
const fontSize = ref('14px')
const opacity = ref(1)
const borderStyle = ref({ color: '#1565c0' })

const invertedColor = computed(() => {
  const map: Record<string, string> = {
    '#1565c0': '#f57f17',
    '#c62828': '#2e7d32',
    '#2e7d32': '#c62828',
    '#f57f17': '#1565c0',
  }
  return map[textColor.value] ?? textColor.value
})

function cycleColor() {
  const colors = ['#1565c0', '#c62828', '#2e7d32', '#f57f17']
  const idx = colors.indexOf(textColor.value)
  textColor.value = colors[(idx + 1) % colors.length]
  const bgs = ['#e3f2fd', '#ffebee', '#e8f5e9', '#fffde7']
  bgColor.value = bgs[(idx + 1) % bgs.length]
  borderStyle.value = { color: colors[(idx + 1) % colors.length] }
}

function cycleFontSize() {
  const sizes = ['12px', '14px', '16px', '20px']
  const idx = sizes.indexOf(fontSize.value)
  fontSize.value = sizes[(idx + 1) % sizes.length]
}

function cycleOpacity() {
  const steps = [1, 0.7, 0.4, 0.1]
  const idx = steps.indexOf(opacity.value)
  opacity.value = steps[(idx + 1) % steps.length]
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
      textColor: {{ textColor }} | fontSize: {{ fontSize }} | opacity: {{ opacity }}
    </text>

    <!-- ref binding -->
    <text class="sample-text" :style="{ fontSize }">
      ref — color: v-bind(textColor)
    </text>

    <!-- computed binding -->
    <text class="computed-text" :style="{ fontSize }">
      computed — inverted color
    </text>

    <!-- object property binding: v-bind('obj.prop') -->
    <text class="border-text">
      object prop — v-bind('borderStyle.color')
    </text>

    <!-- opacity binding -->
    <text class="opacity-text">
      opacity — v-bind(opacity)
    </text>

    <!-- CSS custom property via v-bind -->
    <text class="var-text">
      CSS var — --accent: v-bind(textColor)
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }">
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
      <text
        :style="{
          backgroundColor: '#6a1b9a',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '4px',
          fontSize: '12px',
        }"
        :bindtap="cycleOpacity"
      >
        Cycle Opacity
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
  font-weight: bold;
  margin-bottom: 4px;
}

.computed-text {
  color: v-bind(invertedColor);
  font-weight: bold;
  margin-bottom: 4px;
}

.border-text {
  color: v-bind('borderStyle.color');
  font-weight: bold;
  margin-bottom: 4px;
}

.opacity-text {
  color: v-bind(textColor);
  opacity: v-bind(opacity);
  font-weight: bold;
  margin-bottom: 4px;
}

.var-text {
  --accent: v-bind(textColor);
  color: var(--accent);
  font-weight: bold;
  margin-bottom: 8px;
}
</style>
