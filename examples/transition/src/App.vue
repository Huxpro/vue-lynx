<script setup lang="ts">
import { ref } from 'vue'

// 1. Basic fade
const showFade = ref(true)

// 2. Slide-fade
const showSlide = ref(true)

// 3. Bounce
const showBounce = ref(true)

// 4. Mode out-in (toggle between two views)
const activeView = ref<'A' | 'B'>('A')

// 5. Appear
const showAppear = ref(true)

// 6. Explicit duration
const showDuration = ref(true)

// 7. TransitionGroup list
const listItems = ref([1, 2, 3])
let listCounter = 3
function addItem() {
  listCounter++
  const pos = Math.floor(Math.random() * (listItems.value.length + 1))
  listItems.value.splice(pos, 0, listCounter)
}
function removeItem() {
  if (listItems.value.length === 0) return
  const pos = Math.floor(Math.random() * listItems.value.length)
  listItems.value.splice(pos, 1)
}

// 8. JS hooks
const showHooks = ref(true)
function onBeforeEnter(el: any) {
  el._transitionClasses?.add?.('hook-before-enter')
}
function onEnter(_el: any, done: () => void) {
  // Auto-complete after 300ms
  setTimeout(done, 300)
}
function onLeave(_el: any, done: () => void) {
  setTimeout(done, 300)
}
</script>

<template>
  <scroll-view scroll-orientation="vertical" :style="{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: 16 }">
    <text :style="{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }">Transition Demos</text>

    <!-- 1. Basic Fade -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">1. Fade</text>
      <view @tap="showFade = !showFade"
            :style="{ backgroundColor: '#4a90d9', padding: 8, borderRadius: 4, marginBottom: 4 }">
        <text :style="{ color: '#fff', fontSize: 13 }">Toggle Fade</text>
      </view>
      <Transition name="fade" :duration="300">
        <view v-if="showFade" :style="{ backgroundColor: '#fff', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">Hello, I fade in and out!</text>
        </view>
      </Transition>
    </view>

    <!-- 2. Slide Fade -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">2. Slide Fade</text>
      <view @tap="showSlide = !showSlide"
            :style="{ backgroundColor: '#4a90d9', padding: 8, borderRadius: 4, marginBottom: 4 }">
        <text :style="{ color: '#fff', fontSize: 13 }">Toggle Slide</text>
      </view>
      <Transition name="slide-fade" :duration="{ enter: 300, leave: 500 }">
        <view v-if="showSlide" :style="{ backgroundColor: '#fff', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">I slide and fade!</text>
        </view>
      </Transition>
    </view>

    <!-- 3. Bounce (CSS animation) -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">3. Bounce</text>
      <view @tap="showBounce = !showBounce"
            :style="{ backgroundColor: '#4a90d9', padding: 8, borderRadius: 4, marginBottom: 4 }">
        <text :style="{ color: '#fff', fontSize: 13 }">Toggle Bounce</text>
      </view>
      <Transition name="bounce" type="animation" :duration="500">
        <view v-if="showBounce" :style="{ backgroundColor: '#fff', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">Bouncy!</text>
        </view>
      </Transition>
    </view>

    <!-- 4. Mode out-in -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">4. Mode: out-in</text>
      <view @tap="activeView = activeView === 'A' ? 'B' : 'A'"
            :style="{ backgroundColor: '#4a90d9', padding: 8, borderRadius: 4, marginBottom: 4 }">
        <text :style="{ color: '#fff', fontSize: 13 }">Switch View</text>
      </view>
      <Transition name="fade" mode="out-in" :duration="200">
        <view v-if="activeView === 'A'" key="a" :style="{ backgroundColor: '#e8f5e9', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">View A</text>
        </view>
        <view v-else key="b" :style="{ backgroundColor: '#e3f2fd', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">View B</text>
        </view>
      </Transition>
    </view>

    <!-- 5. Appear -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">5. Appear on mount</text>
      <Transition name="fade" appear :duration="500">
        <view :style="{ backgroundColor: '#fff3e0', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">I faded in on initial mount!</text>
        </view>
      </Transition>
    </view>

    <!-- 6. Explicit Duration -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">6. Explicit Duration (1000ms)</text>
      <view @tap="showDuration = !showDuration"
            :style="{ backgroundColor: '#4a90d9', padding: 8, borderRadius: 4, marginBottom: 4 }">
        <text :style="{ color: '#fff', fontSize: 13 }">Toggle</text>
      </view>
      <Transition name="fade" :duration="1000">
        <view v-if="showDuration" :style="{ backgroundColor: '#fff', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">Slow transition (1s)</text>
        </view>
      </Transition>
    </view>

    <!-- 7. TransitionGroup -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">7. TransitionGroup (list)</text>
      <view :style="{ flexDirection: 'row', marginBottom: 4 }">
        <view @tap="addItem"
              :style="{ backgroundColor: '#4caf50', padding: 8, borderRadius: 4, marginRight: 8 }">
          <text :style="{ color: '#fff', fontSize: 13 }">Add</text>
        </view>
        <view @tap="removeItem"
              :style="{ backgroundColor: '#f44336', padding: 8, borderRadius: 4 }">
          <text :style="{ color: '#fff', fontSize: 13 }">Remove</text>
        </view>
      </view>
      <TransitionGroup name="list" tag="view" :duration="300">
        <view v-for="item in listItems" :key="item"
              :style="{ backgroundColor: '#fff', padding: 8, marginBottom: 4, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">Item {{ item }}</text>
        </view>
      </TransitionGroup>
    </view>

    <!-- 8. JS Hooks -->
    <view :style="{ marginBottom: 16 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">8. JS Hooks</text>
      <view @tap="showHooks = !showHooks"
            :style="{ backgroundColor: '#4a90d9', padding: 8, borderRadius: 4, marginBottom: 4 }">
        <text :style="{ color: '#fff', fontSize: 13 }">Toggle (JS hooks)</text>
      </view>
      <Transition
        name="fade"
        :duration="300"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <view v-if="showHooks" :style="{ backgroundColor: '#f3e5f5', padding: 12, borderRadius: 4 }">
          <text :style="{ fontSize: 13 }">JS hooks control my lifecycle!</text>
        </view>
      </Transition>
    </view>
  </scroll-view>
</template>

<style>
/* 1. Fade */
.fade-enter-active, .fade-leave-active {
  transition-property: opacity;
  transition-duration: 300ms;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 2. Slide Fade */
.slide-fade-enter-active {
  transition-property: opacity, transform;
  transition-duration: 300ms;
  transition-timing-function: ease-out;
}
.slide-fade-leave-active {
  transition-property: opacity, transform;
  transition-duration: 500ms;
  transition-timing-function: cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* 3. Bounce (CSS animation) */
.bounce-enter-active {
  animation-name: bounce-in;
  animation-duration: 500ms;
}
.bounce-leave-active {
  animation-name: bounce-in;
  animation-duration: 500ms;
  animation-direction: reverse;
}
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

/* 7. TransitionGroup list */
.list-enter-active, .list-leave-active {
  transition-property: opacity, transform;
  transition-duration: 300ms;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
