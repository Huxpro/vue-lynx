<script setup>
const props = defineProps(['todo', 'editing', 'editText'])
const emit = defineEmits(['toggle', 'delete', 'start-edit', 'update-edit', 'done-edit'])

function onToggle() {
  emit('toggle', props.todo)
}

function onDelete() {
  emit('delete', props.todo)
}

function startEdit() {
  emit('start-edit', props.todo)
}

function onEditInput(e) {
  const value = e?.detail?.value ?? ''
  emit('update-edit', value)
}

function onDoneEdit(e) {
  if (e) {
    const value = e?.detail?.value ?? ''
    emit('update-edit', value)
  }
  emit('done-edit', props.todo)
}
</script>

<template>
  <view
    class="todo-item"
    :class="{ completed: todo.completed, editing }"
  >
    <!-- Normal view -->
    <view
      v-if="!editing"
      class="todo-view"
    >
      <view class="todo-toggle" @tap="onToggle">
        <text v-if="todo.completed" class="todo-toggle-icon">✓</text>
      </view>
      <view class="todo-label-hitbox" @tap="startEdit">
        <text class="todo-label">{{ todo.title }}</text>
      </view>
      <text class="destroy" @tap="onDelete">✕</text>
    </view>

    <!-- Edit view -->
    <view v-else class="edit-container">
      <input
        class="edit-input"
        type="text"
        :value="editText"
        autofocus
        @input="onEditInput"
        @confirm="onDoneEdit"
        @blur="onDoneEdit"
      />
    </view>
  </view>
</template>
