// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([]);
  let nextId = 1;

  const doneCount = computed(() => todos.value.filter((t) => t.done).length);
  const totalCount = computed(() => todos.value.length);

  function addTodo(text: string) {
    todos.value.push({ id: nextId++, text, done: false });
  }

  function toggleTodo(id: number) {
    const todo = todos.value.find((t) => t.id === id);
    if (todo) todo.done = !todo.done;
  }

  function removeTodo(id: number) {
    todos.value = todos.value.filter((t) => t.id !== id);
  }

  return { todos, doneCount, totalCount, addTodo, toggleTodo, removeTodo };
});
