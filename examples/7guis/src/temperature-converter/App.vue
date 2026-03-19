<script setup>
import { ref } from 'vue'

const celsius = ref('0')
const fahrenheit = ref('32')

function onCelsiusInput(e) {
  const val = e.detail.value
  celsius.value = val
  const num = Number(val)
  if (Number.isFinite(num)) {
    fahrenheit.value = String(+(num * (9 / 5) + 32).toFixed(2))
  }
}

function onFahrenheitInput(e) {
  const val = e.detail.value
  fahrenheit.value = val
  const num = Number(val)
  if (Number.isFinite(num)) {
    celsius.value = String(+((num - 32) * (5 / 9)).toFixed(2))
  }
}
</script>

<template>
  <view :style="{ display: 'flex', padding: 20, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }">
    <input
      type="text"
      :value="celsius"
      :style="{ width: 100, height: 36, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: '0 8px', fontSize: 16 }"
      @input="onCelsiusInput"
    />
    <text :style="{ fontSize: 16 }">Celsius =</text>
    <input
      type="text"
      :value="fahrenheit"
      :style="{ width: 100, height: 36, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: '0 8px', fontSize: 16 }"
      @input="onFahrenheitInput"
    />
    <text :style="{ fontSize: 16 }">Fahrenheit</text>
  </view>
</template>
