<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

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

// 9. Registry cleanup — Transition without `duration`, interrupted before
// transitionend. Before #286 the event-registry counter climbed forever;
// after the fix it returns to baseline once the ~4s fallback cleanup runs.
const REGISTRY_KEY = '__VUE_LYNX_EVENT_REGISTRY__'
const FALLBACK_MS = 4000

function readRegistrySize(): number {
  const state = (globalThis as any)[REGISTRY_KEY]
  return state ? (state.handlers as Map<string, unknown>).size : -1
}

const showRegistry = ref(true)
const registrySize = ref(0)
const registryBaseline = ref(0)
const registryPeak = ref(0)
const registryDelta = computed(() => registrySize.value - registryBaseline.value)
const registryHealthy = computed(() => registryDelta.value <= 5)

function sampleRegistry() {
  const size = readRegistrySize()
  registrySize.value = size
  if (size > registryPeak.value) registryPeak.value = size
}

function markRegistryBaseline() {
  registryBaseline.value = readRegistrySize()
  registryPeak.value = registryBaseline.value
  sampleRegistry()
}

const hammering = ref(false)
let hammerTimer: ReturnType<typeof setInterval> | undefined
let pollTimer: ReturnType<typeof setInterval> | undefined

function startHammer() {
  if (hammering.value) return
  hammering.value = true
  // Faster than the 300ms CSS fade so nearly every enter/leave is cancelled
  // before transitionend can fire — the path that used to leak forever.
  hammerTimer = setInterval(() => {
    showRegistry.value = !showRegistry.value
  }, 30)
}

function stopHammer() {
  hammering.value = false
  if (hammerTimer) {
    clearInterval(hammerTimer)
    hammerTimer = undefined
  }
}

onMounted(() => {
  setTimeout(markRegistryBaseline, 300)
  pollTimer = setInterval(sampleRegistry, 200)
})

onUnmounted(() => {
  stopHammer()
  if (pollTimer) clearInterval(pollTimer)
})
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

    <!-- 9. Registry cleanup (no duration — #286) -->
    <view :style="{ marginBottom: 24 }">
      <text :style="{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }">9. Registry cleanup (no duration)</text>
      <text :style="{ fontSize: 12, color: '#555', marginBottom: 8 }">
        Hammer a Transition with no `:duration` prop. Interrupted handlers used to leak forever (#286);
        after the fix the counter returns to baseline within ~{{ FALLBACK_MS / 1000 }}s of stopping.
      </text>
      <view :style="{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }">
        <view @tap="showRegistry = !showRegistry"
              :style="{ backgroundColor: '#4a90d9', padding: 8, borderRadius: 4, marginRight: 8, marginBottom: 4 }">
          <text :style="{ color: '#fff', fontSize: 13 }">Toggle Once</text>
        </view>
        <view @tap="hammering ? stopHammer() : startHammer()"
              :style="{ backgroundColor: hammering ? '#f44336' : '#4caf50', padding: 8, borderRadius: 4, marginRight: 8, marginBottom: 4 }">
          <text :style="{ color: '#fff', fontSize: 13 }">{{ hammering ? 'Stop Hammer' : 'Start Hammer (30ms)' }}</text>
        </view>
        <view @tap="markRegistryBaseline"
              :style="{ backgroundColor: '#757575', padding: 8, borderRadius: 4, marginBottom: 4 }">
          <text :style="{ color: '#fff', fontSize: 13 }">Reset Baseline</text>
        </view>
      </view>

      <!-- No `duration` prop — event-registry path -->
      <Transition name="fade">
        <view v-if="showRegistry" :style="{ backgroundColor: '#fff', padding: 12, borderRadius: 4, marginBottom: 8 }">
          <text :style="{ fontSize: 13 }">No duration prop — waits for transitionend (+ fallback cleanup)</text>
        </view>
      </Transition>

      <view :style="{ backgroundColor: '#fff', padding: 12, borderRadius: 4, borderWidth: 1, borderColor: '#ddd' }">
        <view :style="{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }">
          <view :style="{ width: 8, height: 8, borderRadius: 4, backgroundColor: registryHealthy ? '#4caf50' : '#f44336', marginRight: 8 }" />
          <text :style="{ fontSize: 13, fontWeight: 'bold' }">Event-registry monitor</text>
        </view>
        <view :style="{ flexDirection: 'row' }">
          <view :style="{ flex: 1 }">
            <text :style="{ fontSize: 20, fontWeight: 'bold', color: registryHealthy ? '#2e7d32' : '#c62828' }">{{ registrySize }}</text>
            <text :style="{ fontSize: 11, color: '#666' }">current size</text>
          </view>
          <view :style="{ flex: 1 }">
            <text :style="{ fontSize: 20, fontWeight: 'bold' }">+{{ registryDelta }}</text>
            <text :style="{ fontSize: 11, color: '#666' }">Δ since baseline</text>
          </view>
          <view :style="{ flex: 1 }">
            <text :style="{ fontSize: 20, fontWeight: 'bold' }">{{ registryPeak }}</text>
            <text :style="{ fontSize: 11, color: '#666' }">peak</text>
          </view>
        </view>
        <text :style="{ fontSize: 11, color: '#888', marginTop: 8 }">
          Healthy: climbs while hammering, then returns to baseline after stop. Leak: climbs and never drops.
        </text>
      </view>
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
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}
.slide-fade-leave-active {
  transition: opacity 500ms cubic-bezier(1, 0.5, 0.8, 1), transform 500ms cubic-bezier(1, 0.5, 0.8, 1);
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
  transition: opacity 300ms, transform 300ms;
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
