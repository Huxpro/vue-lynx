<script setup>
import { ref, shallowReactive } from 'vue'

const history = shallowReactive([[]])
const historyIndex = ref(0)
const circles = ref([])
const selectedId = ref(-1)
const adjusting = ref(false)

let nextId = 0

function onCanvasTap(e) {
  if (adjusting.value) {
    adjusting.value = false
    selectedId.value = -1
    push()
    return
  }

  // Check if tapped on an existing circle
  const x = e.detail?.x ?? e.touches?.[0]?.pageX ?? 0
  const y = e.detail?.y ?? e.touches?.[0]?.pageY ?? 0
  console.log('[circle-drawer] tap event:', { x, y, detail: e.detail, type: e.type, raw: { clientX: e.clientX, clientY: e.clientY } })

  const hit = [...circles.value].reverse().find((c) => {
    const dx = c.x - x
    const dy = c.y - y
    return Math.sqrt(dx * dx + dy * dy) <= c.r
  })

  if (hit) {
    selectedId.value = hit.id
  } else {
    circles.value.push({ id: nextId++, x, y, r: 30 })
    selectedId.value = -1
    push()
  }
}

function startAdjust() {
  if (selectedId.value >= 0) {
    adjusting.value = true
  }
}

function adjustRadius(delta) {
  const circle = circles.value.find((c) => c.id === selectedId.value)
  if (circle) {
    circle.r = Math.max(5, Math.min(150, circle.r + delta))
  }
}

function push() {
  history.length = ++historyIndex.value
  history.push(circles.value.map((c) => ({ ...c })))
}

function undo() {
  if (historyIndex.value > 0) {
    circles.value = history[--historyIndex.value].map((c) => ({ ...c }))
    selectedId.value = -1
    adjusting.value = false
  }
}

function redo() {
  if (historyIndex.value < history.length - 1) {
    circles.value = history[++historyIndex.value].map((c) => ({ ...c }))
    selectedId.value = -1
    adjusting.value = false
  }
}
</script>

<template>
  <!-- Canvas fills the entire view; controls overlay on top -->
  <view
    :style="{ width: '100%', height: '100vh', minHeight: '400px', backgroundColor: '#f0f0f0', position: 'relative' }"
    @tap="onCanvasTap"
  >
    <!-- Hint text -->
    <text
      v-if="circles.length === 0"
      :style="{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#bbb', fontSize: 14, textAlign: 'center' }"
    >
      Tap to draw circles
    </text>

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
        backgroundColor: circle.id === selectedId ? '#ccc' : '#fff',
        borderWidth: 1,
        borderColor: '#333',
      }"
    />

    <!-- Undo / Redo overlaid at the top -->
    <view :style="{ position: 'absolute', top: 10, left: 0, right: 0, display: 'flex', flexDirection: 'row', gap: 8, justifyContent: 'center' }">
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

    <!-- Adjust controls overlaid at the bottom -->
    <view v-if="selectedId >= 0" :style="{ position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', gap: 8 }">
      <view v-if="!adjusting">
        <view
          :style="{ padding: '8px 20px', backgroundColor: '#0077ff', borderRadius: 6 }"
          @tap="startAdjust"
        >
          <text :style="{ color: '#fff', fontSize: 14 }">Adjust Radius</text>
        </view>
      </view>
      <view v-else :style="{ alignItems: 'center', gap: 6 }">
        <text :style="{ fontSize: 14 }">
          Radius: {{ circles.find(c => c.id === selectedId)?.r ?? 0 }}
        </text>
        <view :style="{ display: 'flex', flexDirection: 'row', gap: 8 }">
          <view
            :style="{ padding: '6px 16px', backgroundColor: '#eee', borderRadius: 4 }"
            @tap="adjustRadius(-5)"
          >
            <text :style="{ fontSize: 16 }">-</text>
          </view>
          <view
            :style="{ padding: '6px 16px', backgroundColor: '#eee', borderRadius: 4 }"
            @tap="adjustRadius(5)"
          >
            <text :style="{ fontSize: 16 }">+</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
