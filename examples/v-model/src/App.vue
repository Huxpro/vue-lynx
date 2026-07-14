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

// ── Section 3: Native input v-model ──
const inputText = ref('')

// ── Section 4: Timing-sensitive native v-model ──
// These cases exercise the directive-hook timing that must line up with the
// web runtime's listener registration (see PRs #121, #136):
//
//  4a. Preset initial value + programmatic change. The `mounted` hook must push
//      the model's initial value into the native control (otherwise the field
//      renders empty even though the model is non-empty — the classic symptom),
//      and `beforeUpdate` must teleport later model changes back (Clear / Fill).
//  4b. v-model + @input on the same element — vModelText injects its handler
//      into vnode.props during `created` so patchProp registers a SINGLE merged
//      PAPI listener; otherwise the two listeners overwrite each other.
const presetText = ref('Preset draft')

const coexistText = ref('')
const inputEvents = ref(0)
function onCoexistInput() {
  // Runs in addition to v-model's own assignment; proves both coexist.
  inputEvents.value++
}

function clearPreset() {
  presetText.value = ''
}
function fillPreset() {
  presetText.value = 'filled from parent'
}
</script>

<template>
  <scroll-view scroll-orientation="vertical" :style="{ width: '100%', height: '100%', backgroundColor: '#f5f5f5', padding: 16 }">

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
    <!-- SECTION 3: Native input v-model (SUPPORTED) -->
    <!-- ═══════════════════════════════════════════ -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#00aa44', marginBottom: 4 }">
      3. Native input v-model
    </text>
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 8 }">
      Text: "{{ inputText }}"
    </text>
    <input v-model="inputText" type="text" placeholder="Type here"
      :style="{ padding: 8, borderRadius: 4, fontSize: 14, backgroundColor: '#fff' }" />

    <!-- ═══════════════════════════════════════════ -->
    <!-- SECTION 4: Timing-sensitive native v-model  -->
    <!-- ═══════════════════════════════════════════ -->
    <text :style="{ fontSize: 14, fontWeight: 'bold', color: '#00aa44', marginTop: 16, marginBottom: 4 }">
      4. Native v-model timing cases
    </text>

    <!-- 4a. Preset initial value must render into the native control -->
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 4 }">
      4a. Preset: "{{ presetText }}"
    </text>
    <input v-model="presetText" type="text" placeholder="Preset value"
      :style="{ padding: 8, borderRadius: 4, fontSize: 14, backgroundColor: '#fff', marginBottom: 4 }" />
    <view :style="{ flexDirection: 'row', gap: 8, marginBottom: 12 }">
      <view :style="{ padding: '4px 10px', backgroundColor: '#555', borderRadius: 4, alignSelf: 'flex-start' }" @tap="clearPreset">
        <text :style="{ color: '#fff', fontSize: 12 }">Clear</text>
      </view>
      <view :style="{ padding: '4px 10px', backgroundColor: '#555', borderRadius: 4, alignSelf: 'flex-start' }" @tap="fillPreset">
        <text :style="{ color: '#fff', fontSize: 12 }">Fill from parent</text>
      </view>
    </view>

    <!-- 4b. v-model and @input on the SAME element must coexist -->
    <text :style="{ fontSize: 12, color: '#666', marginBottom: 4 }">
      4b. Coexist model: "{{ coexistText }}" | @input fired: {{ inputEvents }}x
    </text>
    <input v-model="coexistText" @input="onCoexistInput" type="text" placeholder="v-model + @input"
      :style="{ padding: 8, borderRadius: 4, fontSize: 14, backgroundColor: '#fff' }" />

    <!-- v-model works identically on <textarea> (a first-class Lynx element),
         so this demo keeps to <input> only for a web-preview reason:
         `<input>` is in web-core's built-in tag map, but `<textarea>` is an
         opt-in ("additional dependency") element. To render it on web the HOST
         must (1) import `@lynx-js/web-elements/XTextarea` and (2) map the Lynx
         tag to the custom element via the `<lynx-view>`'s
         `overrideLynxTagToHTMLTagMap={{ textarea: 'x-textarea' }}`. Without that
         registration web-core creates a bare <textarea> with no Lynx event
         bridge. It works out of the box on native, and this repo's bundled
         preview harness doesn't set the override — hence <input> here. -->

    <!-- Bottom spacer: keeps the lower inputs scrollable above the soft
         keyboard so a focused field is never trapped behind it. -->
    <view :style="{ height: 320 }" />

  </scroll-view>
</template>
