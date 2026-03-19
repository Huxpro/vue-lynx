<script setup lang="ts">
/**
 * Demonstrates named v-model bindings (v-model:title, v-model:body).
 * Uses defineModel('name') for each named model.
 */
const title = defineModel<string>('title', { default: '' })
const body = defineModel<string>('body', { default: '' })

function clearTitle() {
  title.value = ''
}

function clearBody() {
  body.value = ''
}
</script>

<template>
  <view :style="{ display: 'flex', flexDirection: 'column', padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 }">
    <text :style="{ fontSize: 14, color: '#222', marginBottom: 4 }">
      Child (named models):
    </text>
    <text :style="{ fontSize: 12, color: '#666' }">title = "{{ title }}"</text>
    <text :style="{ fontSize: 12, color: '#666' }">body = "{{ body }}"</text>

    <view :style="{ display: 'flex', flexDirection: 'row', marginTop: 8 }">
      <view
        :style="{ padding: '4px 10px', backgroundColor: '#ff4400', borderRadius: 4, marginRight: 8 }"
        @tap="clearTitle"
      >
        <text :style="{ color: '#fff', fontSize: 12 }">Clear title</text>
      </view>
      <view
        :style="{ padding: '4px 10px', backgroundColor: '#ff4400', borderRadius: 4 }"
        @tap="clearBody"
      >
        <text :style="{ color: '#fff', fontSize: 12 }">Clear body</text>
      </view>
    </view>
  </view>
</template>
