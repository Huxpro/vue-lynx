<script setup lang="ts">
import { ref } from 'vue'
import ModelCounter from './ModelCounter.vue'
import NamedModels from './NamedModels.vue'

// ── Section 1: Component v-model (defineModel) ──
const parentCount = ref(0)

function resetCount() {
  parentCount.value = 0
}

// ── Section 2: Named models ──
const docTitle = ref('Hello')
const docBody = ref('World')

function setValues() {
  docTitle.value = 'Reset Title'
  docBody.value = 'Reset Body'
}

// ── Section 3: Manual two-way binding (workaround for native input) ──
const inputText = ref('')
</script>

<template>
  <view :style="{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5', padding: 16 }">

    <text :style="{ fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12 }">
      v-model Demo
    </text>

    <!-- ═══════════════════════════════════════════ -->
    <!-- SECTION 1: Component v-model (WORKS)       -->
    <!-- ═══════════════════════════════════════════ -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#0077ff', marginBottom: 4 }">
      1. Component v-model (defineModel)
    </text>
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 8 }">
      Parent count: {{ parentCount }}
    </text>

    <!-- v-model on component — compiles to :modelValue + @update:modelValue -->
    <ModelCounter v-model="parentCount" />

    <view
      :style="{ padding: '4px 10px', backgroundColor: '#555', borderRadius: 4, marginBottom: 16, alignSelf: 'flex-start' }"
      @tap="resetCount"
    >
      <text :style="{ color: '#fff', fontSize: 12 }">Reset from parent</text>
    </view>

    <!-- ═══════════════════════════════════════════ -->
    <!-- SECTION 2: Named models (WORKS)            -->
    <!-- ═══════════════════════════════════════════ -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#0077ff', marginBottom: 4 }">
      2. Named v-model (v-model:title, v-model:body)
    </text>
    <text :style="{ fontSize: 12, color: '#666' }">
      Parent title: "{{ docTitle }}" | body: "{{ docBody }}"
    </text>

    <NamedModels v-model:title="docTitle" v-model:body="docBody" />

    <view
      :style="{ padding: '4px 10px', backgroundColor: '#555', borderRadius: 4, marginBottom: 16, alignSelf: 'flex-start' }"
      @tap="setValues"
    >
      <text :style="{ color: '#fff', fontSize: 12 }">Reset from parent</text>
    </view>

    <!-- ═══════════════════════════════════════════ -->
    <!-- SECTION 3: Native input (NOT SUPPORTED)    -->
    <!-- ═══════════════════════════════════════════ -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#ff4400', marginBottom: 4 }">
      3. Native input v-model (NOT supported)
    </text>
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 4 }">
      v-model on &lt;input&gt; is stubbed. Use manual :value + @input instead.
    </text>
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 8 }">
      Text: "{{ inputText }}"
    </text>

    <!-- Manual workaround — this is how you do two-way input binding today -->
    <input
      type="text"
      placeholder="Type here (manual binding)"
      :value="inputText"
      :style="{ padding: 8, borderRadius: 4, fontSize: 14, backgroundColor: '#fff' }"
      @input="(e: any) => inputText = e.detail.value"
    />

  </view>
</template>
