<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useAnimaX } from 'vue-lynx'
import type { AnimaXEvent, AnimaXParam } from 'vue-lynx/types'
import { pulse } from './pulse'

const json = JSON.stringify(pulse)

const player = useTemplateRef('player')
const animax = useAnimaX(player)

const frame = ref(0)
const total = ref(0)
const loops = ref(0)
const playing = ref(true)

function onReady(e: AnimaXEvent<AnimaXParam>) {
  total.value = e.detail.total
  // Ask for an update on every tenth frame; `update` only fires for subscribed frames.
  animax.subscribeUpdateEvents([0, 10, 20, 30, 40, 50])
}
function onUpdate(e: AnimaXEvent<AnimaXParam>) {
  frame.value = e.detail.current
}
function onRepeat(e: AnimaXEvent<AnimaXParam>) {
  loops.value = e.detail.loopIndex
}

async function toggle() {
  if (await animax.isAnimating()) {
    await animax.pause()
    playing.value = false
  } else {
    await animax.resume()
    playing.value = true
  }
}
async function restart() {
  await animax.stop()
  await animax.play()
  playing.value = true
}
function firstHalf() {
  animax.playSegment(0, 30)
}
</script>

<template>
  <view class="page">
    <text class="title">AnimaX</text>
    <text class="hint">A Lottie composition on the native AnimaX player, controlled with useAnimaX.</text>

    <view class="stage">
      <animax-view
        ref="player"
        class="player"
        :json="json"
        loop
        autoplay
        objectfit="contain"
        @ready="onReady"
        @update="onUpdate"
        @repeat="onRepeat"
      />
    </view>

    <text class="readout">frame {{ frame }} of {{ total }}, loop {{ loops }}</text>

    <view class="row">
      <view class="button" @tap="toggle">
        <text class="label">{{ playing ? 'Pause' : 'Resume' }}</text>
      </view>
      <view class="button" @tap="restart">
        <text class="label">Restart</text>
      </view>
      <view class="button" @tap="firstHalf">
        <text class="label">First half</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  padding: 16px;
  background-color: #f0f2f5;
}
.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
}
.hint {
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
}
.stage {
  width: 100%;
  height: 240px;
  border-radius: 12px;
  background-color: #ffffff;
  justify-content: center;
  align-items: center;
}
.player {
  width: 200px;
  height: 200px;
}
.readout {
  font-size: 12px;
  color: #333;
  margin-top: 12px;
  margin-bottom: 12px;
}
.row {
  flex-direction: row;
}
.button {
  padding: 10px 14px;
  margin-right: 8px;
  border-radius: 8px;
  background-color: #4a90d9;
}
.label {
  color: #ffffff;
  font-size: 14px;
}
</style>
