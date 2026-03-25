<script setup lang="ts">
import type { Todo } from '../todo';

const props = defineProps<{
  todo: Todo;
  editing: boolean;
  editText: string;
}>();

const emit = defineEmits<{
  toggle: [todo: Todo];
  remove: [todo: Todo];
  'start-edit': [todo: Todo];
  'update-edit': [value: string];
  'done-edit': [todo: Todo];
}>();

function readInputValue(event: unknown): string {
  const detail = (event as { detail?: { value?: unknown } }).detail;
  return typeof detail?.value === 'string' ? detail.value : '';
}

function startEdit(): void {
  emit('start-edit', props.todo);
}

function onEditInput(event: unknown): void {
  emit('update-edit', readInputValue(event));
}

function onDoneEdit(event?: unknown): void {
  if (event) {
    emit('update-edit', readInputValue(event));
  }
  emit('done-edit', props.todo);
}
</script>

<template>
  <view
    class="todo-item"
    :class="{ completed: todo.completed, editing }"
  >
    <view
      v-if="!editing"
      class="todo-view"
    >
      <view class="todo-toggle" @tap="emit('toggle', todo)">
        <text v-if="todo.completed" class="todo-toggle-icon">✓</text>
      </view>

      <view class="todo-label-hitbox" @tap="startEdit">
        <text class="todo-label">
          {{ todo.title }}
        </text>
      </view>

      <text class="todo-destroy" @tap="emit('remove', todo)">×</text>
    </view>

    <view v-else class="todo-edit-shell">
      <input
        class="todo-edit"
        type="text"
        :value="editText"
        confirm-type="done"
        autofocus
        @input="onEditInput"
        @confirm="onDoneEdit"
        @blur="onDoneEdit"
      />
    </view>
  </view>
</template>
