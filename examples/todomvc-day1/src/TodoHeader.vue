<script setup>
defineProps(['allCompleted', 'hasTodos', 'newTodo'])
const emit = defineEmits(['update-new-todo', 'add-todo', 'toggle-all'])

function onInput(e) {
  const value = e?.detail?.value ?? ''
  emit('update-new-todo', value)
}

function onConfirm(e) {
  let value = e?.detail?.value
  if (value === undefined) {
    value = ''
  } else {
    emit('update-new-todo', value)
  }
  
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
      <view
        v-else
        class="header-toggle-all header-toggle-all-placeholder"
      />

      <input
        class="new-todo with-toggle"
        type="text"
        :value="newTodo"
        placeholder="What needs to be done?"
        confirm-type="done"
        autofocus
        @input="onInput"
        @confirm="onConfirm"
      />
    </view>
  </view>
</template>
