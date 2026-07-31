<script setup lang="ts">
import { onMounted, ref, useCallback } from 'vue-lynx'

import * as router from 'sparkling-navigation'

import './App.css'
import sparklingLogo from '../../assets/sparkling_icon.png'

const lastResult = ref<string | null>(null)

onMounted(() => {
  console.info('Hello, Vue Lynx + Sparkling')
})

function openSecondPage() {
  router.navigate(
    {
      path: './second.lynx.bundle',
      options: {
        params: {
          title: 'Second Page',
          screen_orientation: 'portrait',
        },
      },
    },
    (result: router.NavigateResponse) => {
      lastResult.value = JSON.stringify(result)
    }
  )
}
</script>

<template>
  <scroll-view class="page-scroll" scroll-orientation="vertical">
    <view class="app">
      <view class="hero">
        <text class="eyebrow">Vue · Sparkling · LynxJS</text>
        <image :src="sparklingLogo" class="logo" />
        <text class="title">Vue Lynx Starter</text>
      </view>
      <view class="card">
        <view class="card__header">
          <text class="card__title">Multi page demo</text>
          <text class="card__tag card__tag--outline">Router</text>
        </view>
        <text class="label">Navigate</text>
        <view class="primary" @tap="openSecondPage">
          <text class="primary__text">Open second page</text>
          <text class="primary__icon">→</text>
        </view>
      </view>
    </view>
  </scroll-view>
</template>
