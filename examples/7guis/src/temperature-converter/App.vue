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
  <view :style="{ display: 'flex', padding: '20px', flexDirection: 'row', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }">
    <input
      type="text"
      :value="celsius"
      :style="{ width: '100px', height: '36px', borderWidth: '1px', borderColor: '#ccc', borderRadius: '4px', padding: '0 8px', fontSize: '16px' }"
      @input="onCelsiusInput"
    />
    <text :style="{ fontSize: '16px' }">Celsius =</text>
    <input
      type="text"
      :value="fahrenheit"
      :style="{ width: '100px', height: '36px', borderWidth: '1px', borderColor: '#ccc', borderRadius: '4px', padding: '0 8px', fontSize: '16px' }"
      @input="onFahrenheitInput"
    />
    <text :style="{ fontSize: '16px' }">Fahrenheit</text>
  </view>
</template>
