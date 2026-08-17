export type TodoVisibility = 'all' | 'active' | 'completed';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export const todoFilters: Record<TodoVisibility, (todos: Todo[]) => Todo[]> = {
  all: (todos) => todos,
  active: (todos) => todos.filter((todo) => !todo.completed),
  completed: (todos) => todos.filter((todo) => todo.completed),
};
