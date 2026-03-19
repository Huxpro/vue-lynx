<script setup lang="ts">
/**
 * A child component that uses defineModel() (Vue 3.4+).
 * defineModel() creates a two-way binding prop automatically.
 * Under the hood it's: defineProps(['modelValue']) + defineEmits(['update:modelValue'])
 */
const count = defineModel<number>({ default: 0 })

function onTap() {
  count.value++
}
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 }">
    <text :style="{ fontSize: 14, color: '#222' }">
      Child (defineModel): {{ count }}
    </text>
    <view
      :style="{ marginTop: 8, padding: '6px 12px', backgroundColor: '#0077ff', borderRadius: 6 }"
      @tap="onTap"
    >
      <text :style="{ color: '#fff', fontSize: 13 }">Increment from child</text>
    </view>
  </view>
</template>
