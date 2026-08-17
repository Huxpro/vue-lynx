<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import FilterLink from './components/FilterLink.vue';
import TodoItem from './components/TodoItem.vue';
import { visibilityFromRouteName, visibilityLinks, visibilityPaths } from './router';
import { loadTodos, saveTodos } from './storage';
import type { Todo } from './todo';
import { todoFilters } from './todo';

const route = useRoute();
const router = useRouter();

const todos = ref<Todo[]>(loadTodos());
const newTodo = ref('');
const editedTodoId = ref<number | null>(null);
const editText = ref('');

let nextTodoId =
  todos.value.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;

watch(
  todos,
  (value) => {
    saveTodos(value);
  },
  { deep: true },
);

const visibility = computed(() => visibilityFromRouteName(route.name));
const filteredTodos = computed(() => todoFilters[visibility.value](todos.value));
const remaining = computed(() => todoFilters.active(todos.value).length);
const completedCount = computed(() => todos.value.length - remaining.value);
const TODO_ROW_HEIGHT = 58;
const VIEWPORT_RESERVED_HEIGHT = 320;

const mainScrollHeight = computed(
  () => `${filteredTodos.value.length * TODO_ROW_HEIGHT}px`,
);
const mainScrollMaxHeight = `calc(100vh - ${VIEWPORT_RESERVED_HEIGHT}px)`;
const allDone = computed({
  get: () => todos.value.length > 0 && remaining.value === 0,
  set: (value: boolean) => {
    todos.value.forEach((todo) => {
      todo.completed = value;
    });
  },
});

function readInputValue(event: unknown): string {
  const detail = (event as { detail?: { value?: unknown } }).detail;
  return typeof detail?.value === 'string' ? detail.value : '';
}

function pluralize(count: number): string {
  return count === 1 ? 'item' : 'items';
}

function resetToAll(): void {
  router.push(visibilityPaths.all);
}

function onNewTodoInput(event: unknown): void {
  newTodo.value = readInputValue(event);
}

function submitNewTodo(event?: unknown): void {
  if (event) {
    newTodo.value = readInputValue(event);
  }

  const title = newTodo.value.trim();

  if (!title) {
    return;
  }

  todos.value.push({
    id: nextTodoId,
    title,
    completed: false,
  });
  nextTodoId += 1;
  newTodo.value = '';
}

function toggleTodo(todo: Todo): void {
  todo.completed = !todo.completed;
}

function removeTodo(todo: Todo): void {
  const index = todos.value.findIndex((item) => item.id === todo.id);
  if (index === -1) {
    return;
  }

  todos.value.splice(index, 1);

  if (editedTodoId.value === todo.id) {
    editedTodoId.value = null;
    editText.value = '';
  }
}

function startEdit(todo: Todo): void {
  editedTodoId.value = todo.id;
  editText.value = todo.title;
}

function updateEdit(value: string): void {
  editText.value = value;
}

function doneEdit(todo: Todo): void {
  if (editedTodoId.value !== todo.id) {
    return;
  }

  const title = editText.value.trim();
  editedTodoId.value = null;
  editText.value = '';

  if (!title) {
    removeTodo(todo);
    return;
  }

  todo.title = title;
}

function clearCompleted(): void {
  todos.value = todoFilters.active(todos.value);

  if (
    editedTodoId.value !== null &&
    !todos.value.some((todo) => todo.id === editedTodoId.value)
  ) {
    editedTodoId.value = null;
    editText.value = '';
  }
}

function toggleAll(): void {
  allDone.value = !allDone.value;
}
</script>

<template>
  <page class="page">
    <view class="page-content">
      <view class="todoapp-shell">
        <view class="todoapp">
          <view class="header">
            <text class="title" @tap="resetToAll">todos</text>

            <view class="new-todo-row">
              <view
                v-if="todos.length > 0"
                class="header-toggle-all"
                @tap="toggleAll"
              >
                <text
                  class="header-toggle-all-icon"
                  :class="{ checked: allDone }"
                >
                  ⌄
                </text>
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
                @input="onNewTodoInput"
                @confirm="submitNewTodo"
              />
            </view>
          </view>

          <scroll-view
            v-if="todos.length > 0"
            class="todo-scroll"
            scroll-orientation="vertical"
            :style="{ height: mainScrollHeight, maxHeight: mainScrollMaxHeight }"
          >
            <view class="main">
              <view class="todo-list">
                <TodoItem
                  v-for="todo in filteredTodos"
                  :key="todo.id"
                  :todo="todo"
                  :editing="editedTodoId === todo.id"
                  :edit-text="editedTodoId === todo.id ? editText : todo.title"
                  @toggle="toggleTodo"
                  @remove="removeTodo"
                  @start-edit="startEdit"
                  @update-edit="updateEdit"
                  @done-edit="doneEdit"
                />
              </view>
            </view>
          </scroll-view>

          <view v-if="todos.length > 0" class="footer">
            <view class="todo-count">
              <text class="todo-count-strong">{{ remaining }}</text>
              <text class="todo-count-label"> {{ pluralize(remaining) }} left</text>
            </view>

            <view class="filters">
              <FilterLink
                v-for="link in visibilityLinks"
                :key="link.name"
                :to="link.to"
                :label="link.label"
                :active="visibility === link.name"
              />
            </view>

            <text
              v-if="completedCount > 0"
              class="clear-completed"
              @tap="clearCompleted"
            >
              Clear completed
            </text>
          </view>
        </view>
      </view>

      <view class="info">
        <text class="info-line">Tap the todo text to edit</text>
        <text class="info-line">Built as a closer TodoMVC Vue reference clone for Vue Lynx</text>
      </view>
    </view>
  </page>
</template>
