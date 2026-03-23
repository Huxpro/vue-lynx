<script setup>
import { ref, shallowReactive, computed } from 'vue'

const history = shallowReactive([[]])
const historyIndex = ref(0)
const circles = ref([])
const selectedId = ref(-1)
const showModal = ref(false)

let nextId = 0

// Modal slider state
const sliderWidth = 200 // Width of slider track in px
const minRadius = 5
const maxRadius = 150

// Double tap detection
const lastTapTime = ref(0)
const lastTapId = ref(-1)
const DOUBLE_TAP_DELAY = 300 // ms

const selectedCircle = computed(() => {
  return circles.value.find(c => c.id === selectedId.value)
})

function getTouchPos(e) {
  // Get coordinates relative to the viewport/screen
  // e.detail.x/y in Lynx are relative to the element, but we need absolute for circles
  const x = e.detail?.x ?? e.touches?.[0]?.pageX ?? 0
  const y = e.detail?.y ?? e.touches?.[0]?.pageY ?? 0
  
  // Add offset because canvas is positioned at top: 60
  // In Lynx, e.detail.x/y are relative to the tapped element
  // The canvas view has top: 60, so we need to add that offset
  return { x, y: y + 60 }
}

function onCanvasTap(e) {
  // If modal is open, close it without creating new circle
  if (showModal.value) {
    closeModal()
    return
  }

  const pos = getTouchPos(e)
  const x = pos.x
  const y = pos.y

  // Check if tapped on an existing circle
  const hit = [...circles.value].reverse().find((c) => {
    const dx = c.x - x
    const dy = c.y - y
    return Math.sqrt(dx * dx + dy * dy) <= c.r
  })

  if (hit) {
    handleCircleTap(hit.id)
  } else {
    circles.value.push({ id: nextId++, x,    y, r: 30 })
    selectedId.value = -1
    push()
  }
}

function handleCircleTap(circleId) {
  const now = Date.now()
  const timeSinceLastTap = now - lastTapTime.value
  
  if (lastTapId.value === circleId && timeSinceLastTap < DOUBLE_TAP_DELAY) {
    // Double tap detected - open modal
    showModal.value = true
    lastTapId.value = -1
    lastTapTime.value = 0
  } else {
    // Single tap - just select
    selectedId.value = circleId
    lastTapId.value = circleId
    lastTapTime.value = now
  }
}

function onCircleTap(e, circle) {
  // Stop propagation to prevent canvas tap
  e?.stopPropagation?.()
  handleCircleTap(circle.id)
}

function closeModal() {
  if (showModal.value) {
    showModal.value = false
    push()
  }
}

function onModalTap(e) {
  // Stop propagation to prevent canvas interaction
  e?.stopPropagation?.()
}

function onOverlayTap(e) {
  // Close modal when tapping overlay background
  e?.stopPropagation?.()
  closeModal()
}

// Slider drag handling
const isDragging = ref(false)
const sliderValue = computed({
  get() {
    return selectedCircle.value?.r ?? minRadius
  },
  set(val) {
    if (selectedCircle.value) {
      selectedCircle.value.r = Math.max(minRadius, Math.min(maxRadius, val))
    }
  }
})

function onSliderTouchStart(e) {
  isDragging.value = true
  updateSliderFromTouch(e)
}

function onSliderTouchMove(e) {
  if (isDragging.value) {
    updateSliderFromTouch(e)
  }
}

function onSliderTouchEnd(e) {
  isDragging.value = false
}

function updateSliderFromTouch(e) {
  const touch = e.touches?.[0] ?? e.changedTouches?.[0]
  if (!touch) return
  
  // Calculate position relative to slider track
  const trackLeft = (globalThis.window?.innerWidth ?? 375) / 2 - sliderWidth / 2
  const relativeX = touch.pageX - trackLeft
  const percentage = Math.max(0, Math.min(1, relativeX / sliderWidth))
  sliderValue.value = minRadius + percentage * (maxRadius - minRadius)
}

function push() {
  history.length = ++historyIndex.value
  history.push(circles.value.map((c) => ({ ...c })))
}

function undo(e) {
  e?.stopPropagation?.()
  if (historyIndex.value > 0) {
    circles.value = history[--historyIndex.value].map((c) => ({ ...c }))
    selectedId.value = -1
    showModal.value = false
  }
}

function redo(e) {
  e?.stopPropagation?.()
  if (historyIndex.value < history.length - 1) {
    circles.value = history[++historyIndex.value].map((c) => ({ ...c }))
    selectedId.value = -1
    showModal.value = false
  }
}
</script>

<template>
  <!-- Main container -->
  <view
    :style="{ width: '100%', height: '100vh', minHeight: '400px', backgroundColor: '#f0f0f0', position: 'relative' }"
  >
    <!-- Hint text for empty state - centered -->
    <view
      v-if="circles.length === 0"
      :style="{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }"
    >
      <text :style="{ color: '#bbb', fontSize: 14, textAlign: 'center' }">
        Tap to draw circles
      </text>
    </view>

    <!-- Canvas area for drawing (below controls) -->
    <view
      :style="{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 50 }"
      @tap="onCanvasTap"
    >
      <!-- Circles -->
      <view
        v-for="circle in circles"
        :key="circle.id"
        :style="{
          position: 'absolute',
          left: circle.x - circle.r + 'px',
          top: circle.y - circle.r + 'px',
          width: circle.r * 2 + 'px',
          height: circle.r * 2 + 'px',
          borderRadius: circle.r + 'px',
          backgroundColor: circle.id === selectedId ? '#0077ff' : '#fff',
          borderWidth: circle.id === selectedId ? 3 : 1,
          borderColor: circle.id === selectedId ? '#0055cc' : '#333',
        }"
        @tap="(e) => onCircleTap(e, circle)"
      />
    </view>

    <!-- Undo / Redo overlaid at the top -->
    <view :style="{ position: 'absolute', top: 10, left: 0, right: 0, display: 'flex', flexDirection: 'row', gap: 8, justifyContent: 'center', zIndex: 10 }">
      <view
        :style="{ padding: '6px 16px', backgroundColor: historyIndex > 0 ? '#0077ff' : '#ccc', borderRadius: 6 }"
        @tap="undo"
      >
        <text :style="{ color: '#fff', fontSize: 14 }">Undo</text>
      </view>
      <view
        :style="{ padding: '6px 16px', backgroundColor: historyIndex < history.length - 1 ? '#0077ff' : '#ccc', borderRadius: 6 }"
        @tap="redo"
      >
        <text :style="{ color: '#fff', fontSize: 14 }">Redo</text>
      </view>
    </view>

    <!-- Hint for interaction - at bottom -->
    <view
      v-if="circles.length > 0 && !showModal"
      :style="{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10 
      }"
    >
      <text :style="{ color: '#666', fontSize: 12, textAlign: 'center' }">
        Double-tap a circle to adjust radius
      </text>
    </view>

    <!-- Modal Overlay -->
    <view
      v-if="showModal"
      :style="{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }"
      @tap="onOverlayTap"
    >
      <!-- Modal Content -->
      <view
        :style="{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: '24px 32px',
          alignItems: 'center',
          minWidth: '280px',
        }"
        @tap="onModalTap"
      >
        <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 }">
          Adjust Radius
        </text>
        
        <text :style="{ fontSize: 24, fontWeight: 'bold', color: '#0077ff', marginBottom: 20 }">
          {{ Math.round(selectedCircle?.r ?? 0) }}px
        </text>

        <!-- Slider Track -->
        <view
          :style="{
            width: sliderWidth + 'px',
            height: 6,
            backgroundColor: '#e0e0e0',
            borderRadius: 3,
            position: 'relative',
          }"
          @touchstart="onSliderTouchStart"
          @touchmove="onSliderTouchMove"
          @touchend="onSliderTouchEnd"
        >
          <!-- Filled portion -->
          <view
            :style="{
              position: 'absolute',
              left: 0,
              top: 0,
              height: 6,
              width: (((selectedCircle?.r ?? minRadius) - minRadius) / (maxRadius - minRadius)) * sliderWidth + 'px',
              backgroundColor: '#0077ff',
              borderRadius: 3,
            }"
          />
          <!-- Thumb -->
          <view
            :style="{
              position: 'absolute',
              top: -7,
              left: (((selectedCircle?.r ?? minRadius) - minRadius) / (maxRadius - minRadius)) * sliderWidth - 10 + 'px',
              width: 20,
              height: 20,
              backgroundColor: '#0077ff',
              borderRadius: 10,
              borderWidth: 2,
              borderColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }"
          />
        </view>

        <!-- Slider Labels -->
        <view :style="{ width: sliderWidth + 'px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }">
          <text :style="{ fontSize: 12, color: '#999' }">{{ minRadius }}px</text>
          <text :style="{ fontSize: 12, color: '#999' }">{{ maxRadius }}px</text>
        </view>

        <!-- Done Button -->
        <view
          :style="{
            marginTop: 24,
            padding: '10px 32px',
            backgroundColor: '#0077ff',
            borderRadius: 6,
          }"
          @tap="closeModal"
        >
          <text :style="{ color: '#fff', fontSize: 16, fontWeight: 'bold' }">Done</text>
        </view>
      </view>
    </view>
  </view>
</template>
