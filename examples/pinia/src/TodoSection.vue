<!-- Copyright 2025 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0 that can be found in the
     LICENSE file in the root directory of this source tree. -->

<script setup lang="ts">
import { useTodoStore } from './stores/todos';

const todoStore = useTodoStore();

const sampleTodos = ['Learn Vue-Lynx', 'Try Pinia', 'Build an app'];
let sampleIdx = 0;

function addSample() {
  const text = sampleIdx < sampleTodos.length
    ? sampleTodos[sampleIdx]!
    : `Todo #${sampleIdx + 1}`;
  todoStore.addTodo(text);
  sampleIdx++;
}
</script>

<template>
  <view :style="{ margin: '0 16px 16px', padding: 16, backgroundColor: '#fff', borderRadius: 8 }">
    <text :style="{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 }">
      Todo Store
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: 12, gap: 8 }">
      <text
        :style="{ fontSize: 14, color: '#fff', backgroundColor: '#FF9800', padding: '6px 16px', borderRadius: 4 }"
        @tap="addSample"
      >
        + Add Todo
      </text>
      <text :style="{ fontSize: 13, color: '#777', lineHeight: 30 }">
        {{ todoStore.doneCount }}/{{ todoStore.totalCount }} done
      </text>
    </view>

    <view v-if="todoStore.todos.length === 0">
      <text :style="{ fontSize: 13, color: '#999' }">No todos yet. Tap "Add Todo" to start.</text>
    </view>

    <view v-for="todo in todoStore.todos" :key="todo.id" :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 6, padding: '6px 8px', backgroundColor: todo.done ? '#E8F5E9' : '#F5F5F5', borderRadius: 4 }">
      <text
        :style="{ flex: 1, fontSize: 14, color: todo.done ? '#81C784' : '#333', textDecoration: todo.done ? 'line-through' : 'none' }"
        @tap="todoStore.toggleTodo(todo.id)"
      >
        {{ todo.text }}
      </text>
      <text
        :style="{ fontSize: 12, color: '#EF5350', padding: '2px 8px' }"
        @tap="todoStore.removeTodo(todo.id)"
      >
        ✕
      </text>
    </view>
  </view>
</template>
