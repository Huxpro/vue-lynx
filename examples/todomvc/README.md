# TodoMVC

Classic [TodoMVC](https://todomvc.com) built with Vue 3 × Lynx using CSS Selector styling. This version features iteratively improved UI, layout, and scrolling behaviors matching the modern reference clone.

*(For the original unpolished version, see `examples/todomvc-day1`)*

## Features Exercised

- `<script setup>` with `defineProps` / `defineEmits`
- `ref`, `computed` for state management
- `v-for` list rendering with `:key`
- `v-if` / `v-else` conditional rendering
- Dynamic `:class` binding
- `@tap`, `@longpress`, `@confirm`, `@blur` events
- CSS Selectors (`enableCSSSelector: true`)
- Multi-component composition (TodoApp, TodoHeader, TodoItem, TodoFooter)
