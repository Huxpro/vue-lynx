<script setup>
import { ref, computed } from 'vue'

import TodoHeader from './TodoHeader.vue'
import TodoItem from './TodoItem.vue'
import TodoFooter from './TodoFooter.vue'

// ── State ──────────────────────────────────────────────────
const todos = ref([])
const filter = ref('all')
const editedTodoId = ref(null)
const editText = ref('')

// ── Derived ────────────────────────────────────────────────
const activeTodos = computed(() => todos.value.filter(t => !t.completed))
const completedTodos = computed(() => todos.value.filter(t => t.completed))
const filteredTodos = computed(() => {
  if (filter.value === 'active') return activeTodos.value
  if (filter.value === 'completed') return completedTodos.value
  return todos.value
})

const TODO_ROW_HEIGHT = 58;
const VIEWPORT_RESERVED_HEIGHT = 320;

const mainScrollHeight = computed(
  () => `${filteredTodos.value.length * TODO_ROW_HEIGHT}px`,
)
const mainScrollMaxHeight = `calc(100vh - ${VIEWPORT_RESERVED_HEIGHT}px)`

const allCompleted = computed(() =>
  todos.value.length > 0 && activeTodos.value.length === 0,
)

// ── Helpers ────────────────────────────────────────────────
let nextId = 0
function uuid() {
  return `todo-${++nextId}`
}

// ── Actions ────────────────────────────────────────────────
function addTodo(title) {
  if (!title.trim()) return
  todos.value.push({ id: uuid(), title: title.trim(), completed: false })
}

function toggleTodo(todo) {
  todo.completed = !todo.completed
}

function deleteTodo(todo) {
  todos.value = todos.value.filter(t => t.id !== todo.id)
  if (editedTodoId.value === todo.id) {
    editedTodoId.value = null
    editText.value = ''
  }
}

function startEdit(todo) {
  editedTodoId.value = todo.id
  editText.value = todo.title
}

function updateEdit(value) {
  editText.value = value
}

function doneEdit(todo) {
  if (editedTodoId.value !== todo.id) {
    return
  }

  const title = editText.value.trim()
  editedTodoId.value = null
  editText.value = ''

  if (!title) {
    deleteTodo(todo)
    return
  }

  todo.title = title
}

function toggleAll() {
  const newVal = !allCompleted.value
  todos.value.forEach(t => { t.completed = newVal })
}

function clearCompleted() {
  todos.value = todos.value.filter(t => !t.completed)
}

function setFilter(f) {
  filter.value = f
}
</script>

<template>
  <view class="page">
    <view class="todoapp-shell">
      <view class="todoapp">
        <TodoHeader
          :all-completed="allCompleted"
          :has-todos="todos.length > 0"
          @add-todo="addTodo"
          @toggle-all="toggleAll"
        />

        <scroll-view
          v-if="todos.length > 0"
          scroll-orientation="vertical"
          :style="{ height: mainScrollHeight, maxHeight: mainScrollMaxHeight }"
        >
          <view class="main">
            <!-- Todo list -->
            <view class="todo-list">
              <TodoItem
                v-for="todo in filteredTodos"
                :key="todo.id"
                :todo="todo"
                :editing="editedTodoId === todo.id"
                :edit-text="editedTodoId === todo.id ? editText : todo.title"
                @toggle="toggleTodo"
                @delete="deleteTodo"
                @start-edit="startEdit"
                @update-edit="updateEdit"
                @done-edit="doneEdit"
              />
            </view>
          </view>
        </scroll-view>

        <TodoFooter
          v-if="todos.length > 0"
          :active-count="activeTodos.length"
          :completed-count="completedTodos.length"
          :current-filter="filter"
          @set-filter="setFilter"
          @clear-completed="clearCompleted"
        />
      </view>
    </view>

    <!-- Info -->
    <view class="info">
      <text class="info-text">Tap the todo text to edit</text>
      <text class="info-text">Built with Vue 3 × Lynx</text>
    </view>
  </view>
</template>
