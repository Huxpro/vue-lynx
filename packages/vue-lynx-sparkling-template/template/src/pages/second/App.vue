<script setup lang="ts">
import { onMounted } from 'vue-lynx'

import { close } from 'sparkling-navigation'

import './App.css'

onMounted(() => {
  console.info('Hello, Vue Lynx second page')
  console.info('lynx.__globalProps', lynx.__globalProps)
})

function onClose() {
  close()
}
</script>

<template>
  <view class="page">
    <view class="App">
      <view class="Banner">
        <text class="Title">This is the second page</text>
      </view>
      <view class="Content">
        <text class="Button" @tap="onClose">
          Close
        </text>
      </view>
    </view>
  </view>
</template>
