<script setup>
defineProps(['allCompleted', 'hasTodos'])
const emit = defineEmits(['add-todo', 'toggle-all'])

function onConfirm(e) {
  const value = e?.detail?.value ?? ''
  if (value.trim()) {
    emit('add-todo', value)
  }
}

function onToggleAll() {
  emit('toggle-all')
}
</script>

<template>
  <view class="header">
    <text class="title">todos</text>
    <view class="new-todo-row">
      <view
        v-if="hasTodos"
        class="header-toggle-all"
        @tap="onToggleAll"
      >
        <text
          class="header-toggle-all-icon"
          :class="{ checked: allCompleted }"
        >✓</text>
      </view>

      <input
        class="new-todo"
        :class="{ 'with-toggle': hasTodos }"
        type="text"
        placeholder="What needs to be done?"
        confirm-type="done"
        autofocus
        @confirm="onConfirm"
      />
    </view>
  </view>
</template>
