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
  <view :style="{ margin: '0 16px 16px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px' }">
    <text :style="{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }">
      Todo Store
    </text>

    <view :style="{ display: 'flex', flexDirection: 'row', marginBottom: '12px', gap: '8px' }">
      <text
        :style="{ fontSize: '14px', color: '#fff', backgroundColor: '#FF9800', padding: '6px 16px', borderRadius: '4px' }"
        @tap="addSample"
      >
        + Add Todo
      </text>
      <text :style="{ fontSize: '13px', color: '#777', lineHeight: '30px' }">
        {{ todoStore.doneCount }}/{{ todoStore.totalCount }} done
      </text>
    </view>

    <view v-if="todoStore.todos.length === 0">
      <text :style="{ fontSize: '13px', color: '#999' }">No todos yet. Tap "Add Todo" to start.</text>
    </view>

    <view v-for="todo in todoStore.todos" :key="todo.id" :style="{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '6px', padding: '6px 8px', backgroundColor: todo.done ? '#E8F5E9' : '#F5F5F5', borderRadius: '4px' }">
      <text
        :style="{ flex: 1, fontSize: '14px', color: todo.done ? '#81C784' : '#333', textDecoration: todo.done ? 'line-through' : 'none' }"
        @tap="todoStore.toggleTodo(todo.id)"
      >
        {{ todo.text }}
      </text>
      <text
        :style="{ fontSize: '12px', color: '#EF5350', padding: '2px 8px' }"
        @tap="todoStore.removeTodo(todo.id)"
      >
        ✕
      </text>
    </view>
  </view>
</template>
